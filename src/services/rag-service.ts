// ──────────────────────────────────────────
// LocalPilot — RAG Service (Indexing & Retrieval)
// ──────────────────────────────────────────

import { BaseDirectory, readDir, readTextFile, readFile, stat } from '@tauri-apps/plugin-fs';
import { sep } from '@tauri-apps/api/path';
import { v4 as uuid } from 'uuid';
import { workspaceFileRepo, workspaceChunkRepo } from './storage';
import { generateEmbeddings } from './ollama';
import { describeImage } from './vision-service';
import { extractTextFromPDF } from './pdf-service';
import { cosineSimilarity } from '@/lib/vector-math';
import type { WorkspaceFile, WorkspaceChunk } from '@/types';

const CHUNK_SIZE = 1000; // characters
const CHUNK_OVERLAP = 200; // characters
const ALLOWED_EXTENSIONS = [
  '.txt', '.md', '.markdown', '.js', '.ts', '.tsx', '.jsx', 
  '.py', '.json', '.html', '.css', '.rs', '.go', '.c', '.cpp', '.java',
  '.pdf', '.png', '.jpg', '.jpeg'
];
const IGNORED_DIRS = ['.git', 'node_modules', 'dist', 'build', '.next', '.tauri', 'target'];

export interface IndexProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  status?: string;
}

/**
 * Recursively indexes a local workspace directory.
 */
export async function indexWorkspace(
  projectId: string, 
  basePath: string,
  onProgress?: (p: IndexProgress) => void,
  embeddingModel: string = 'nomic-embed-text'
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
      const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
      if (onProgress) {
        onProgress({ 
          totalFiles: filesToIndex.length, 
          processedFiles: processed, 
          currentFile: filePath.split(await sep()).pop() || '',
          status: ['.png', '.jpg', '.jpeg', '.pdf'].includes(ext) ? 'Vision Analysis' : 'Text Indexing'
        });
      }

      let content = '';
      let visualSummaries: string[] = [];

      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        // Direct Image Analysis
        const bytes = await readFile(filePath);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
        const summary = await describeImage(base64);
        content = `[IMAGE ANALYSIS]: ${summary}`;
      } else if (ext === '.pdf') {
        // PDF with Image Support
        const bytes = await readFile(filePath);
        const fileObj = new File([bytes], filePath.split(await sep()).pop() || 'document.pdf', { type: 'application/pdf' });
        const pdfResult = await extractTextFromPDF(fileObj);
        content = pdfResult.text;
        
        if (pdfResult.images && pdfResult.images.length > 0) {
           // Caption all images in the PDF
           for (const imgBase64 of pdfResult.images) {
             const summary = await describeImage(imgBase64);
             visualSummaries.push(`[VISION-SUMMARY]: ${summary}`);
           }
        }
      } else {
        // Standard Text File
        content = await readTextFile(filePath);
      }

      const fileInfo = await stat(filePath);
      
      const fileRecord: WorkspaceFile = {
        id: uuid(),
        projectId,
        path: filePath,
        lastModified: fileInfo.mtime?.toISOString() || new Date().toISOString(),
        size: fileInfo.size,
      };

      await workspaceFileRepo.create(fileRecord);

      // ── Text Chunking ──
      const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);
      // Add visual summaries as independent chunks
      const allTextChunks = [...chunks, ...visualSummaries];
      
      const chunkRecords: WorkspaceChunk[] = [];
      for (let i = 0; i < allTextChunks.length; i++) {
        const text = allTextChunks[i];
        let embedding: number[] | undefined;
        try {
          embedding = await generateEmbeddings(embeddingModel, text);
        } catch (e) {
          console.warn('Could not generate embedding for chunk:', e);
        }
        
        chunkRecords.push({
          id: uuid(),
          fileId: fileRecord.id,
          projectId,
          content: text,
          indexOrder: i,
          embedding,
        });
      }

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
 * Searches the project workspace using Vector Embeddings (Cosine Similarity).
 * Falls back to basic database search if embeddings aren't available.
 */
export async function searchWorkspace(
  projectId: string, 
  query: string, 
  limit = 5,
  embeddingModel: string = 'nomic-embed-text'
): Promise<string> {
  let queryEmbedding: number[] | undefined;
  
  try {
    queryEmbedding = await generateEmbeddings(embeddingModel, query);
  } catch (e) {
    console.warn('No embedding generated for query, falling back to basic LIKE search.');
  }

  let finalChunks: WorkspaceChunk[] = [];

  if (queryEmbedding && queryEmbedding.length > 0) {
    // 1. Vector Search
    const allChunks = await workspaceChunkRepo.getAllByProject(projectId);
    
    const validScored = allChunks
      .filter(c => c.embedding && c.embedding.length === queryEmbedding!.length)
      .map(chunk => ({
        chunk,
        score: cosineSimilarity(queryEmbedding!, chunk.embedding!)
      }));

    // Sort by descending score
    validScored.sort((a, b) => b.score - a.score);
    
    finalChunks = validScored.slice(0, limit).map(s => s.chunk);
  }

  // Fallback to basic term search if vector search fails or yields nothing
  if (finalChunks.length === 0) {
    finalChunks = await workspaceChunkRepo.search(projectId, query, limit);
  }

  if (finalChunks.length === 0) return '';

  let context = "\n--- RELEVANT WORKSPACE CONTEXT ---\n";
  finalChunks.forEach((chunk, i) => {
    // We append the snippet index for clarity
    context += `[Snippet ${i + 1}]:\n${chunk.content}\n\n`;
  });
  
  return context;
}
