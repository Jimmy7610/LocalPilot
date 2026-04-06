import { readDir, DirEntry } from '@tauri-apps/plugin-fs';

/**
 * Cleanly scans a directory to provide a summary of the project structure for the AI.
 * Filters out common "noisy" directories to keep the prompt small and relevant.
 */
export async function getProjectShallowTree(workspacePath: string, maxItems = 40): Promise<string> {
  // @ts-ignore
  if (typeof window !== 'undefined' && !window.__TAURI_INTERNALS__) {
    return "(Local file system access not available in browser mode)";
  }

  try {
    const entries = await readDir(workspacePath);
    
    // Sort directories first, then files
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    const ignoreList = [
      'node_modules', '.git', 'dist', 'build', '.next', '.tauri', 'target', 
      'out', '.DS_Store', 'Thumbs.db'
    ];

    const filtered = sorted.filter(e => !ignoreList.includes(e.name));
    
    // Build a simple text tree
    let tree = `Project Root: ${workspacePath}\n`;
    const limited = filtered.slice(0, maxItems);

    for (const entry of limited) {
      if (entry.isDirectory) {
        tree += `📁 ${entry.name}/\n`;
      } else {
        tree += `📄 ${entry.name}\n`;
      }
    }

    if (filtered.length > maxItems) {
      tree += `... (and ${filtered.length - maxItems} more items)\n`;
    }

    return tree;
  } catch (e) {
    console.error("Failed to scan project structure:", e);
    return `(Error scanning project at ${workspacePath}: ${String(e)})`;
  }
}
