import { writeTextFile, mkdir, exists, BaseDirectory } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';
import type { Message } from '@/types';

export async function syncWorkspace(chatId: string, messages: Message[]): Promise<string> {
  const workspaceRelativePath = `LocalPilot\\Workspace\\${chatId}`;
  
  // Ensure base directory exists
  if (!(await exists(workspaceRelativePath, { baseDir: BaseDirectory.Document }))) {
    await mkdir(workspaceRelativePath, { baseDir: BaseDirectory.Document, recursive: true });
  }

  const blockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let fileCount = 0;

  // We parse all assistant messages in chronological order. 
  // This means later messages will correctly overwrite files if the AI updated them!
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    
    let match;
    while ((match = blockRegex.exec(msg.content)) !== null) {
      const lang = match[1].toLowerCase();
      const code = match[2];

      // Ignore execution blocks since they aren't source files
      if (['bash', 'sh', 'cmd', 'powershell'].includes(lang)) continue;

      let filename = '';
      
      // Heuristic 1: Look for filename in the first line (e.g. // server.js or /* App.css */)
      const firstLine = code.split('\n')[0].trim();
      const commentMatch = firstLine.match(/^(?:\/\/|\/\*|<!--|#)\s*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)\s*(?:\*\/|-->)?$/);
      if (commentMatch && commentMatch[1]) {
        filename = commentMatch[1];
      } else {
        // Fallbacks
        if (lang === 'html') filename = 'index.html';
        else if (lang === 'css') filename = 'style.css';
        else if (lang === 'json' || lang === 'json5') filename = 'package.json'; // risky fallback, but common
        else if (lang === 'js' || lang === 'javascript' || lang === 'node') filename = `app_${fileCount}.js`;
        else if (lang === 'ts' || lang === 'typescript') filename = `app_${fileCount}.ts`;
        else if (lang === 'py' || lang === 'python') filename = `main_${fileCount}.py`;
        else filename = `snippet_${fileCount}.txt`;
      }

      // Handle subdirectories if the AI provided a path like `todo-app/server.js`
      const relativeFilePath = await join(workspaceRelativePath, filename);
      
      // Note: In a robust app, we'd ensure intermediate directories exist before writing. 
      // Tauri's writeTextFile doesn't automatically create parent dirs.
      // We will do a naive approach and strip subdirectories for this MVP or just replace slashes with dashes.
      const safeFilename = filename.replace(/[\/\\]/g, '-');
      const safeRelativePath = await join(workspaceRelativePath, safeFilename);

      await writeTextFile(safeRelativePath, code.trim(), { baseDir: BaseDirectory.Document });
      fileCount++;
    }
  }

  const docPath = await documentDir();
  return await join(docPath, workspaceRelativePath);
}
