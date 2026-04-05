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
  isOpen: boolean; // whether the terminal panel/sheet is open
  setIsOpen: (isOpen: boolean) => void;
  runCommand: (fullCommand: string) => Promise<string>;
  terminateTask: (id: string) => Promise<void>;
  clearTasks: () => void;
}

// Keep a map of actual Child processes in memory (not in Zustand state)
const taskProcesses = new Map<string, Child>();

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tasks: [],
  isOpen: false,

  setIsOpen: (isOpen) => set({ isOpen }),

  runCommand: async (fullCommand) => {
    const id = uuidv4();
    const parts = fullCommand.trim().split(/\s+/);
    if (parts.length === 0) return '';

    const cmd = parts[0];
    const args = parts.slice(1);

    try {
      const command = Command.create(cmd, args);
      let outputBuffer = '';
      let urlOpened = false;

      // Add task to state before spawn to show loading
      set((state) => ({
        tasks: [
          { id, command: fullCommand, pid: 0, output: '', status: 'running', startedAt: Date.now() },
          ...state.tasks.slice(0, 49) // Keep last 50 tasks
        ],
        isOpen: true,
      }));

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

  clearTasks: () => {
    set({ tasks: [] });
  }
}));
