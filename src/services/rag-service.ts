// ──────────────────────────────────────────
// LocalPilot — RAG Service (Indexing & Retrieval)
// ──────────────────────────────────────────

import { BaseDirectory, readDir, readTextFile, stat } from '@tauri-apps/plugin-fs';
import { sep } from '@tauri-apps/api/path';
import { v4 as uuid } from 'uuid';
import { workspaceFileRepo, workspaceChunkRepo } from './storage';
import type { WorkspaceFile, WorkspaceChunk } from '@/types';

const CHUNK_SIZE = 1000; // characters
const CHUNK_OVERLAP = 200; // characters
const ALLOWED_EXTENSIONS = [
  '.txt', '.md', '.markdown', '.js', '.ts', '.tsx', '.jsx', 
  '.py', '.json', '.html', '.css', '.rs', '.go', '.c', '.cpp', '.java'
];
const IGNORED_DIRS = ['.git', 'node_modules', 'dist', 'build', '.next', '.tauri', 'target'];

export interface IndexProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
}

/**
 * Recursively indexes a local workspace directory.
 */
export async function indexWorkspace(
  projectId: string, 
  basePath: string,
  onProgress?: (p: IndexProgress) => void
): Promise<void> {
  // 1. Clear existing index for this project
  await workspaceFileRepo.deleteByProject(projectId);
  await workspaceChunkRepo.deleteByProject(projectId);

  const filesToIndex: string[] = [];

  // 2. Collect all files recursively
  async function walk(dirPath: string) {
    const entries = await readDir(dirPath);
    const s = await sep();
    for (const entry of entries) {
      const fullPath = `${dirPath}${s}${entry.name}`;
      
      if (entry.isDirectory) {
        if (!IGNORED_DIRS.includes(entry.name)) {
          await walk(fullPath);
        }
      } else {
        const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase();
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          filesToIndex.push(fullPath);
        }
      }
    }
  }

  try {
    await walk(basePath);
  } catch (err) {
    console.error('Error walking directory:', err);
    throw new Error(`Kunde inte läsa mappen: ${err}`);
  }

  // 3. Process each file
  let processed = 0;
  for (const filePath of filesToIndex) {
    try {
      if (onProgress) {
        onProgress({ 
          totalFiles: filesToIndex.length, 
          processedFiles: processed, 
          currentFile: filePath.split('/').pop() || '' 
        });
      }

      const content = await readTextFile(filePath);
      const fileInfo = await stat(filePath);
      
      const fileRecord: WorkspaceFile = {
        id: uuid(),
        projectId,
        path: filePath,
        lastModified: fileInfo.mtime?.toISOString() || new Date().toISOString(),
        size: fileInfo.size,
      };

      await workspaceFileRepo.create(fileRecord);

      // Chunk the content
      const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);
      const chunkRecords: WorkspaceChunk[] = chunks.map((text, index) => ({
        id: uuid(),
        fileId: fileRecord.id,
        projectId,
        content: text,
        indexOrder: index,
      }));

      await workspaceChunkRepo.createMany(chunkRecords);
    } catch (err) {
      console.error(`Error indexing file ${filePath}:`, err);
    }
    processed++;
  }
}

/**
 * Splits text into overlapping chunks.
 */
function chunkText(text: string, size: number, overlap: number): string[] {
  if (text.length <= size) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = start + size;
    chunks.push(text.slice(start, end));
    start = end - overlap;
    
    // Safety break
    if (start >= text.length - overlap && start < text.length) {
       chunks.push(text.slice(start));
       break;
    }
  }

  return chunks;
}

/**
 * Searches the project workspace for relevant snippets.
 */
export async function searchWorkspace(projectId: string, query: string, limit = 5): Promise<string> {
  const chunks = await workspaceChunkRepo.search(projectId, query, limit);
  if (chunks.length === 0) return '';

  let context = "\n--- RELEVANT WORKSPACE CONTEXT ---\n";
  chunks.forEach((chunk, i) => {
    context += `[Snippet ${i + 1}]:\n${chunk.content}\n\n`;
  });
  
  return context;
}
