import { create } from 'zustand';
import { Command, Child } from '@tauri-apps/plugin-shell';
import { openUrl } from '@tauri-apps/plugin-opener';
import { v4 as uuidv4 } from 'uuid';

export interface TerminalTask {
  id: string;
  command: string;
  pid: number;
  output: string;
  status: 'running' | 'completed' | 'error';
  urlOpened?: string;
  startedAt: number;
}

interface TerminalState {
  tasks: TerminalTask[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  runCommand: (fullCommand: string, options?: { cwd?: string }) => Promise<string>;
  runCode: (code: string, language: string) => Promise<string>;
  terminateTask: (id: string) => Promise<void>;
  sendInput: (id: string, input: string) => Promise<void>;
  clearTasks: () => void;
}

// Keep a map of actual Child processes in memory (not in Zustand state)
const taskProcesses = new Map<string, Child>();

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tasks: [],
  isOpen: false,

  setIsOpen: (isOpen) => set({ isOpen }),

  runCommand: async (fullCommand, options) => {
    return get().runCode(fullCommand, 'shell');
  },

  runCode: async (code, language) => {
    const id = uuidv4();

    try {
      // @ts-ignore
      const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;
      if (!isTauri) {
        throw new Error('Terminal Execution requires the native LocalPilot Desktop App (Tauri).');
      }

      const isWindows = navigator.userAgent.includes('Windows');

      // Map language → interpreter & file extension
      const langMap: Record<string, { ext: string; runner: string[]; shellRunner?: boolean }> = {
        python: { ext: 'py', runner: ['python', '-u'] },
        python3: { ext: 'py', runner: ['python', '-u'] },
        javascript: { ext: 'js', runner: ['node'] },
        js: { ext: 'js', runner: ['node'] },
        typescript: { ext: 'ts', runner: ['npx', 'ts-node'] },
        ts: { ext: 'ts', runner: ['npx', 'ts-node'] },
        shell: { ext: 'ps1', runner: [], shellRunner: true },
        bash: { ext: 'sh', runner: [], shellRunner: true },
        sh: { ext: 'sh', runner: [], shellRunner: true },
        ps1: { ext: 'ps1', runner: [], shellRunner: true },
        powershell: { ext: 'ps1', runner: [], shellRunner: true },
      };

      const lang = language.toLowerCase().trim();
      const config = langMap[lang] ?? { ext: 'txt', runner: [], shellRunner: true };

      // Add task shown in UI immediately
      const displayLabel = lang === 'shell' || config.shellRunner ? code.slice(0, 60) : `[${lang}] code block`;
      set((state) => ({
        tasks: [
          { id, command: displayLabel, pid: 0, output: '', status: 'running', startedAt: Date.now() },
          ...state.tasks.slice(0, 49),
        ],
        isOpen: true,
      }));

      let shellCmd: string;
      let shellArgs: string[];

      if (config.shellRunner) {
        // Run the code directly via the shell (it IS a shell command/script)
        if (isWindows) {
          shellCmd = 'powershell';
          shellArgs = ['-NoLogo', '-Command', code];
        } else {
          shellCmd = 'sh';
          shellArgs = ['-c', code];
        }
      } else {
        // Save code to a temp file, then run with the right interpreter
        const tmpDir = isWindows ? 'C:\\Windows\\Temp' : '/tmp';
        const sep = isWindows ? '\\' : '/';
        const tmpFile = `${tmpDir}${sep}localpilot_run_${Date.now()}.${config.ext}`;

        // Write the file via PowerShell / sh, then run it
        const escaped = code.replace(/'/g, isWindows ? "''" : "'\\''")
        const runner = config.runner.join(' ');
        const writeCmd = isWindows
          ? `$env:PYTHONUNBUFFERED=1; $env:PYTHONIOENCODING='utf-8'; Set-Content -Path '${tmpFile}' -Value '${escaped}' -Encoding UTF8; ${runner} '${tmpFile}'`
          : `cat > '${tmpFile}' << 'LOCALPILOT_EOF'\n${code}\nLOCALPILOT_EOF\nPYTHONUNBUFFERED=1 ${runner} '${tmpFile}'`;

        if (isWindows) {
          shellCmd = 'powershell';
          shellArgs = ['-NoLogo', '-Command', writeCmd];
        } else {
          shellCmd = 'sh';
          shellArgs = ['-c', writeCmd];
        }
      }

      const command = Command.create(shellCmd, shellArgs);
      let outputBuffer = '';
      let urlOpened = false;


      command.stdout.on('data', (line) => {
        outputBuffer += line + '\n';
        
        // Auto-detect localhost URLs and open browser
        const urlMatch = String(line).match(/(http:\/\/localhost:\d+)/);
        if (urlMatch && !urlOpened) {
          const url = urlMatch[1];
          urlOpened = true;
          openUrl(url).catch(console.error);
          
          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, urlOpened: url } : t)
          }));
        }

        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, output: outputBuffer } : t)
        }));
      });

      command.stderr.on('data', (line) => {
        outputBuffer += line + '\n';
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, output: outputBuffer } : t)
        }));
      });

      command.on('close', (data) => {
        taskProcesses.delete(id);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: data.code === 0 ? 'completed' : 'error' } : t
          ),
        }));
      });

      command.on('error', (error) => {
        taskProcesses.delete(id);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'error', output: t.output + '\n[Error]: ' + error } : t
          ),
        }));
      });

      const child = await command.spawn();
      taskProcesses.set(id, child);

      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, pid: child.pid } : t)
      }));

      return id;
    } catch (e: any) {
      console.error("Failed to run command:", e);
      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'error', output: String(e) } : t),
      }));
      return id;
    }
  },

  terminateTask: async (id) => {
    const child = taskProcesses.get(id);
    if (child) {
      try {
        await child.kill();
        taskProcesses.delete(id);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'error', output: t.output + '\n[Terminated by user]' } : t
          ),
        }));
      } catch (e) {
        console.error("Failed to terminate task:", e);
      }
    } else {
      // It might be already closed, just map state
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, status: 'error', output: t.output + '\n[Terminated by user]' } : t
        ),
      }));
    }
  },

  sendInput: async (id, input) => {
    const child = taskProcesses.get(id);
    if (child) {
      try {
        await child.write(input + '\n');
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, output: t.output + `> ${input}\n` } : t
          ),
        }));
      } catch (e) {
        console.error("Failed to send input:", e);
      }
    }
  },

  clearTasks: () => {
    set({ tasks: [] });
  }
}));
