// ──────────────────────────────────────────
// LocalPilot — Storage Service (SQLite + localStorage fallback)
// ──────────────────────────────────────────

import type { Chat, Message, Project, PromptTemplate, Document, ToolDefinition, WorkspaceFile, WorkspaceChunk } from '@/types';

// Detect if running inside Tauri
function isTauri(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
}

// ── SQLite Database (Tauri) ──

let db: any = null;

async function getDb() {
  if (db) return db;
  if (!isTauri()) return null;

  try {
    const { default: Database } = await import('@tauri-apps/plugin-sql');
    db = await Database.load('sqlite:localpilot.db');
    return db;
  } catch (e) {
    console.warn('SQLite not available, using localStorage fallback', e);
    return null;
  }
}

// ── localStorage Fallback ──

function lsGet<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(`lp_${key}`);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T) {
  localStorage.setItem(`lp_${key}`, JSON.stringify(value));
}

// ── Settings Repository ──

export const settingsRepo = {
  async get(key: string): Promise<string | null> {
    const database = await getDb();
    if (database) {
      const rows: any[] = await database.select('SELECT value FROM settings WHERE key = $1', [key]);
      return rows.length ? rows[0].value : null;
    }
    return localStorage.getItem(`lp_setting_${key}`);
  },

  async set(key: string, value: string): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)',
        [key, value]
      );
    } else {
      localStorage.setItem(`lp_setting_${key}`, value);
    }
  },
};

// ── Chats Repository ──

export const chatRepo = {
  async getAll(): Promise<Chat[]> {
    const database = await getDb();
    if (database) {
      const rows: any[] = await database.select(
        'SELECT id, title, model, system_prompt as systemPrompt, pinned, project_id as projectId, created_at as createdAt, updated_at as updatedAt FROM chats ORDER BY updated_at DESC'
      );
      return rows.map(r => ({ ...r, pinned: !!r.pinned }));
    }
    return lsGet<Chat[]>('chats', []);
  },

  async getById(id: string): Promise<Chat | null> {
    const database = await getDb();
    if (database) {
      const rows: any[] = await database.select(
        'SELECT id, title, model, system_prompt as systemPrompt, pinned, project_id as projectId, created_at as createdAt, updated_at as updatedAt FROM chats WHERE id = $1',
        [id]
      );
      return rows.length ? { ...rows[0], pinned: !!rows[0].pinned } : null;
    }
    const chats = lsGet<Chat[]>('chats', []);
    return chats.find(c => c.id === id) || null;
  },

  async create(chat: Chat): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'INSERT INTO chats (id, title, model, system_prompt, pinned, project_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [chat.id, chat.title, chat.model, chat.systemPrompt, chat.pinned ? 1 : 0, chat.projectId, chat.createdAt, chat.updatedAt]
      );
    } else {
      const chats = lsGet<Chat[]>('chats', []);
      chats.unshift(chat);
      lsSet('chats', chats);
    }
  },

  async update(chat: Chat): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'UPDATE chats SET title = $1, model = $2, system_prompt = $3, pinned = $4, project_id = $5, updated_at = $6 WHERE id = $7',
        [chat.title, chat.model, chat.systemPrompt, chat.pinned ? 1 : 0, chat.projectId, chat.updatedAt, chat.id]
      );
    } else {
      const chats = lsGet<Chat[]>('chats', []);
      const idx = chats.findIndex(c => c.id === chat.id);
      if (idx !== -1) chats[idx] = chat;
      lsSet('chats', chats);
    }
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute('DELETE FROM chats WHERE id = $1', [id]);
      await database.execute('DELETE FROM messages WHERE chat_id = $1', [id]);
    } else {
      const chats = lsGet<Chat[]>('chats', []);
      lsSet('chats', chats.filter(c => c.id !== id));
      const msgs = lsGet<Message[]>('messages', []);
      lsSet('messages', msgs.filter(m => m.chatId !== id));
    }
  },
};

// ── Messages Repository ──

export const messageRepo = {
  async getByChatId(chatId: string): Promise<Message[]> {
    const database = await getDb();
    if (database) {
      const rows: any[] = await database.select(
        'SELECT id, chat_id as chatId, role, content, COALESCE(type, \'text\') as type, meta, created_at as createdAt FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
        [chatId]
      );
      return rows.map(r => ({ ...r, meta: r.meta ? JSON.parse(r.meta) : undefined }));
    }
    return lsGet<Message[]>('messages', []).filter(m => m.chatId === chatId);
  },

  async create(message: Message): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'INSERT INTO messages (id, chat_id, role, content, type, meta, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [message.id, message.chatId, message.role, message.content, message.type || 'text', message.meta ? JSON.stringify(message.meta) : null, message.createdAt]
      );
    } else {
      const msgs = lsGet<Message[]>('messages', []);
      msgs.push(message);
      lsSet('messages', msgs);
    }
  },

  async update(message: Message): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'UPDATE messages SET content = $1 WHERE id = $2',
        [message.content, message.id]
      );
    } else {
      const msgs = lsGet<Message[]>('messages', []);
      const idx = msgs.findIndex(m => m.id === message.id);
      if (idx !== -1) msgs[idx] = message;
      lsSet('messages', msgs);
    }
  },
};

// ── Projects Repository ──

export const projectRepo = {
  async getAll(): Promise<Project[]> {
    const database = await getDb();
    if (database) {
      return database.select(
        'SELECT id, name, description, color, icon, preferred_model as preferredModel, workspace_path as workspacePath, created_at as createdAt, updated_at as updatedAt FROM projects ORDER BY updated_at DESC'
      );
    }
    return lsGet<Project[]>('projects', []);
  },

  async getById(id: string): Promise<Project | null> {
    const database = await getDb();
    if (database) {
      const rows: any[] = await database.select(
        'SELECT id, name, description, color, icon, preferred_model as preferredModel, workspace_path as workspacePath, created_at as createdAt, updated_at as updatedAt FROM projects WHERE id = $1',
        [id]
      );
      return rows.length ? rows[0] : null;
    }
    const projects = lsGet<Project[]>('projects', []);
    return projects.find(p => p.id === id) || null;
  },

  async create(project: Project): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'INSERT INTO projects (id, name, description, color, icon, preferred_model, workspace_path, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [project.id, project.name, project.description, project.color, project.icon, project.preferredModel, project.workspacePath, project.createdAt, project.updatedAt]
      );
    } else {
      const projects = lsGet<Project[]>('projects', []);
      projects.unshift(project);
      lsSet('projects', projects);
    }
  },

  async update(project: Project): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'UPDATE projects SET name = $1, description = $2, color = $3, icon = $4, preferred_model = $5, workspace_path = $6, updated_at = $7 WHERE id = $8',
        [project.name, project.description, project.color, project.icon, project.preferredModel, project.workspacePath, project.updatedAt, project.id]
      );
    } else {
      const projects = lsGet<Project[]>('projects', []);
      const idx = projects.findIndex(p => p.id === project.id);
      if (idx !== -1) projects[idx] = project;
      lsSet('projects', projects);
    }
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    if (database) {
      // Aggressive cleanup: Try each step, ignore errors for secondary tables
      const cleanup = async (sql: string) => {
        try { await database.execute(sql, [id]); } catch (e) { console.debug(`Cleanup step failed: ${sql}`, e); }
      };

      await cleanup('DELETE FROM project_chats WHERE project_id = $1');
      await cleanup('DELETE FROM project_documents WHERE project_id = $1');
      await cleanup('DELETE FROM project_prompts WHERE project_id = $1');
      await cleanup('DELETE FROM workspace_chunks WHERE project_id = $1');
      await cleanup('DELETE FROM workspace_files WHERE project_id = $1');
      
      // Force dissociate from chats and documents (nullable column)
      await cleanup('UPDATE chats SET project_id = NULL WHERE project_id = $1');
      await cleanup('UPDATE documents SET project_id = NULL WHERE project_id = $1');

      // Final primary record deletion (Must succeed)
      await database.execute('DELETE FROM projects WHERE id = $1', [id]);
    } else {
      const projects = lsGet<Project[]>('projects', []);
      lsSet('projects', projects.filter(p => p.id !== id));
      
      const files = lsGet<WorkspaceFile[]>('workspace_files', []);
      lsSet('workspace_files', files.filter(f => f.projectId !== id));
      
      const chunks = lsGet<WorkspaceChunk[]>('workspace_chunks', []);
      lsSet('workspace_chunks', chunks.filter(c => c.projectId !== id));
    }
  },
};

// ── Workspace Files Repository ──

export const workspaceFileRepo = {
  async getByProject(projectId: string): Promise<WorkspaceFile[]> {
    const database = await getDb();
    if (database) {
      return database.select(
        'SELECT id, project_id as projectId, path, last_modified as lastModified, size FROM workspace_files WHERE project_id = $1',
        [projectId]
      );
    }
    return lsGet<WorkspaceFile[]>('workspace_files', []).filter(f => f.projectId === projectId);
  },

  async create(file: WorkspaceFile): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'INSERT INTO workspace_files (id, project_id, path, last_modified, size) VALUES ($1, $2, $3, $4, $5)',
        [file.id, file.projectId, file.path, file.lastModified, file.size]
      );
    } else {
      const files = lsGet<WorkspaceFile[]>('workspace_files', []);
      files.push(file);
      lsSet('workspace_files', files);
    }
  },

  async deleteByProject(projectId: string): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute('DELETE FROM workspace_files WHERE project_id = $1', [projectId]);
    } else {
      const files = lsGet<WorkspaceFile[]>('workspace_files', []);
      lsSet('workspace_files', files.filter(f => f.projectId !== projectId));
    }
  },
};

// ── Workspace Chunks Repository ──

export const workspaceChunkRepo = {
  async search(projectId: string, query: string, limit = 5): Promise<WorkspaceChunk[]> {
    const database = await getDb();
    if (database) {
      // Basic keyword search using LIKE - later we will use actual vector math in JS
      const rows: any[] = await database.select(
        'SELECT id, file_id as fileId, project_id as projectId, content, index_order as indexOrder, embedding FROM workspace_chunks WHERE project_id = $1 AND content LIKE $2 LIMIT $3',
        [projectId, `%${query}%`, limit]
      );
      return rows.map(r => ({ ...r, embedding: r.embedding ? JSON.parse(r.embedding) : undefined }));
    }
    const chunks = lsGet<WorkspaceChunk[]>('workspace_chunks', []).filter(c => c.projectId === projectId);
    return chunks.filter(c => c.content.toLowerCase().includes(query.toLowerCase())).slice(0, limit);
  },

  async getAllByProject(projectId: string): Promise<WorkspaceChunk[]> {
    const database = await getDb();
    if (database) {
      const rows: any[] = await database.select(
        'SELECT id, file_id as fileId, project_id as projectId, content, index_order as indexOrder, embedding FROM workspace_chunks WHERE project_id = $1',
        [projectId]
      );
      return rows.map(r => ({ ...r, embedding: r.embedding ? JSON.parse(r.embedding) : undefined }));
    }
    return lsGet<WorkspaceChunk[]>('workspace_chunks', []).filter(c => c.projectId === projectId);
  },

  async createMany(chunks: WorkspaceChunk[]): Promise<void> {
    const database = await getDb();
    if (database) {
      for (const chunk of chunks) {
        await database.execute(
          'INSERT INTO workspace_chunks (id, file_id, project_id, content, index_order, embedding) VALUES ($1, $2, $3, $4, $5, $6)',
          [chunk.id, chunk.fileId, chunk.projectId, chunk.content, chunk.indexOrder, chunk.embedding ? JSON.stringify(chunk.embedding) : null]
        );
      }
    } else {
      const allChunks = lsGet<WorkspaceChunk[]>('workspace_chunks', []);
      allChunks.push(...chunks);
      lsSet('workspace_chunks', allChunks);
    }
  },

  async deleteByProject(projectId: string): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute('DELETE FROM workspace_chunks WHERE project_id = $1', [projectId]);
    } else {
      const chunks = lsGet<WorkspaceChunk[]>('workspace_chunks', []);
      lsSet('workspace_chunks', chunks.filter(c => c.projectId !== projectId));
    }
  },
};

// ── Prompts Repository ──

export const promptRepo = {
  async getAll(): Promise<PromptTemplate[]> {
    const database = await getDb();
    if (database) {
      const rows: any[] = await database.select(
        'SELECT id, title, description, category, tags, content, favorite, created_at as createdAt, updated_at as updatedAt FROM prompts ORDER BY updated_at DESC'
      );
      return rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]'), favorite: !!r.favorite }));
    }
    return lsGet<PromptTemplate[]>('prompts', []);
  },

  async create(prompt: PromptTemplate): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'INSERT INTO prompts (id, title, description, category, tags, content, favorite, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [prompt.id, prompt.title, prompt.description, prompt.category, JSON.stringify(prompt.tags), prompt.content, prompt.favorite ? 1 : 0, prompt.createdAt, prompt.updatedAt]
      );
    } else {
      const prompts = lsGet<PromptTemplate[]>('prompts', []);
      prompts.unshift(prompt);
      lsSet('prompts', prompts);
    }
  },

  async update(prompt: PromptTemplate): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'UPDATE prompts SET title = $1, description = $2, category = $3, tags = $4, content = $5, favorite = $6, updated_at = $7 WHERE id = $8',
        [prompt.title, prompt.description, prompt.category, JSON.stringify(prompt.tags), prompt.content, prompt.favorite ? 1 : 0, prompt.updatedAt, prompt.id]
      );
    } else {
      const prompts = lsGet<PromptTemplate[]>('prompts', []);
      const idx = prompts.findIndex(p => p.id === prompt.id);
      if (idx !== -1) prompts[idx] = prompt;
      lsSet('prompts', prompts);
    }
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute('DELETE FROM prompts WHERE id = $1', [id]);
    } else {
      const prompts = lsGet<PromptTemplate[]>('prompts', []);
      lsSet('prompts', prompts.filter(p => p.id !== id));
    }
  },
};

// ── Documents Repository ──

export const documentRepo = {
  async getAll(): Promise<Document[]> {
    const database = await getDb();
    if (database) {
      return database.select(
        'SELECT id, title, content, project_id as projectId, created_at as createdAt, updated_at as updatedAt FROM documents ORDER BY updated_at DESC'
      );
    }
    return lsGet<Document[]>('documents', []);
  },

  async getById(id: string): Promise<Document | null> {
    const database = await getDb();
    if (database) {
      const rows: any[] = await database.select(
        'SELECT id, title, content, project_id as projectId, created_at as createdAt, updated_at as updatedAt FROM documents WHERE id = $1',
        [id]
      );
      return rows.length ? rows[0] : null;
    }
    const docs = lsGet<Document[]>('documents', []);
    return docs.find(d => d.id === id) || null;
  },

  async create(doc: Document): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'INSERT INTO documents (id, title, content, project_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [doc.id, doc.title, doc.content, doc.projectId, doc.createdAt, doc.updatedAt]
      );
    } else {
      const docs = lsGet<Document[]>('documents', []);
      docs.unshift(doc);
      lsSet('documents', docs);
    }
  },

  async update(doc: Document): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'UPDATE documents SET title = $1, content = $2, project_id = $3, updated_at = $4 WHERE id = $5',
        [doc.title, doc.content, doc.projectId, doc.updatedAt, doc.id]
      );
    } else {
      const docs = lsGet<Document[]>('documents', []);
      const idx = docs.findIndex(d => d.id === doc.id);
      if (idx !== -1) docs[idx] = doc;
      lsSet('documents', docs);
    }
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute('DELETE FROM documents WHERE id = $1', [id]);
    } else {
      const docs = lsGet<Document[]>('documents', []);
      lsSet('documents', docs.filter(d => d.id !== id));
    }
  },
};

// ── Custom Tools Repository ──

export const toolRepo = {
  async getAll(): Promise<ToolDefinition[]> {
    const database = await getDb();
    if (database) {
      const rows: any[] = await database.select(
        'SELECT id, title, description, icon, system_prompt as systemPrompt, input_placeholder as inputPlaceholder, has_target_language as hasTargetLanguage, is_custom as isCustom FROM custom_tools'
      );
      return rows.map(r => ({ 
        ...r, 
        hasTargetLanguage: !!r.hasTargetLanguage,
        isCustom: !!r.isCustom
      }));
    }
    return lsGet<ToolDefinition[]>('custom_tools', []);
  },

  async create(tool: ToolDefinition): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'INSERT INTO custom_tools (id, title, description, icon, system_prompt, input_placeholder, has_target_language, is_custom) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [tool.id, tool.title, tool.description, tool.icon, tool.systemPrompt, tool.inputPlaceholder, tool.hasTargetLanguage ? 1 : 0, 1]
      );
    } else {
      const tools = lsGet<ToolDefinition[]>('custom_tools', []);
      tools.unshift({ ...tool, isCustom: true });
      lsSet('custom_tools', tools);
    }
  },

  async update(tool: ToolDefinition): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute(
        'UPDATE custom_tools SET title = $1, description = $2, icon = $3, system_prompt = $4, input_placeholder = $5, has_target_language = $6 WHERE id = $7',
        [tool.title, tool.description, tool.icon, tool.systemPrompt, tool.inputPlaceholder, tool.hasTargetLanguage ? 1 : 0, tool.id]
      );
    } else {
      const tools = lsGet<ToolDefinition[]>('custom_tools', []);
      const idx = tools.findIndex(t => t.id === tool.id);
      if (idx !== -1) tools[idx] = { ...tool, isCustom: true };
      lsSet('custom_tools', tools);
    }
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    if (database) {
      await database.execute('DELETE FROM custom_tools WHERE id = $1', [id]);
    } else {
      const tools = lsGet<ToolDefinition[]>('custom_tools', []);
      lsSet('custom_tools', tools.filter(t => t.id !== id));
    }
  },
};

// ── Reset All ──

export async function resetAllData(): Promise<void> {
  const database = await getDb();
  if (database) {
    await database.execute('DELETE FROM messages');
    await database.execute('DELETE FROM chats');
    await database.execute('DELETE FROM projects');
    await database.execute('DELETE FROM prompts');
    await database.execute('DELETE FROM documents');
    await database.execute('DELETE FROM custom_tools');
    await database.execute('DELETE FROM settings');
  } else {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('lp_'));
    keys.forEach(k => localStorage.removeItem(k));
  }
}
