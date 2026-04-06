// ──────────────────────────────────────────
// LocalPilot — Chat Store
// ──────────────────────────────────────────

import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Chat, Message, OllamaChatMessage } from '@/types';
import { chatRepo, messageRepo } from '@/services/storage';
import { chatStream } from '@/services/ollama';
import { useProjectStore } from './project-store';
import { useDocumentStore } from './document-store';
import { useTerminalStore } from './terminal-store';
import { searchWorkspace } from '@/services/rag-service';

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  generating: boolean;
  analyzing: boolean;
  abortController: AbortController | null;
  loaded: boolean;

  load: () => Promise<void>;
  createChat: (model: string, systemPrompt?: string) => Promise<Chat>;
  deleteChat: (id: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  setActiveChat: (id: string | null) => void;
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string, model: string) => Promise<void>;
  stopGeneration: () => void;
  updateChatModel: (id: string, model: string) => Promise<void>;
  updateSystemPrompt: (id: string, prompt: string) => Promise<void>;
  updateChatProject: (id: string, projectId: string | null) => Promise<void>;
  addTerminalMessage: (chatId: string, output: string, meta?: any) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: {},
  activeChatId: null,
  generating: false,
  analyzing: false,
  abortController: null,
  loaded: false,

  load: async () => {
    const chats = await chatRepo.getAll();
    set({ chats, loaded: true });
  },

  createChat: async (model, systemPrompt = '') => {
    const now = new Date().toISOString();
    const chat: Chat = {
      id: uuid(),
      title: 'New Chat',
      model,
      systemPrompt,
      pinned: false,
      projectId: null,
      createdAt: now,
      updatedAt: now,
    };
    await chatRepo.create(chat);
    set(s => ({ chats: [chat, ...s.chats], activeChatId: chat.id, messages: { ...s.messages, [chat.id]: [] } }));
    return chat;
  },

  deleteChat: async (id) => {
    await chatRepo.delete(id);
    set(s => {
      const newMsgs = { ...s.messages };
      delete newMsgs[id];
      return {
        chats: s.chats.filter(c => c.id !== id),
        messages: newMsgs,
        activeChatId: s.activeChatId === id ? null : s.activeChatId,
      };
    });
  },

  renameChat: async (id, title) => {
    const chat = get().chats.find(c => c.id === id);
    if (!chat) return;
    const updated = { ...chat, title, updatedAt: new Date().toISOString() };
    await chatRepo.update(updated);
    set(s => ({ chats: s.chats.map(c => c.id === id ? updated : c) }));
  },

  togglePin: async (id) => {
    const chat = get().chats.find(c => c.id === id);
    if (!chat) return;
    const updated = { ...chat, pinned: !chat.pinned, updatedAt: new Date().toISOString() };
    await chatRepo.update(updated);
    set(s => ({ chats: s.chats.map(c => c.id === id ? updated : c) }));
  },

  setActiveChat: (id) => {
    set({ activeChatId: id });
    if (id && !get().messages[id]) {
      get().loadMessages(id);
    }
  },

  loadMessages: async (chatId) => {
    const msgs = await messageRepo.getByChatId(chatId);
    set(s => ({ messages: { ...s.messages, [chatId]: msgs } }));
  },

  sendMessage: async (chatId, content, model) => {
    const userMsg: Message = {
      id: uuid(),
      chatId,
      role: 'user',
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
    };
    await messageRepo.create(userMsg);

    const assistantMsg: Message = {
      id: uuid(),
      chatId,
      role: 'assistant',
      content: '',
      type: 'text',
      createdAt: new Date().toISOString(),
    };

    set(s => ({
      messages: {
        ...s.messages,
        [chatId]: [...(s.messages[chatId] || []), userMsg, assistantMsg],
      },
      generating: true,
    }));

    // Build message history for Ollama
    const chat = get().chats.find(c => c.id === chatId);
    const allMsgs = get().messages[chatId] || [];
    const ollamaMessages: OllamaChatMessage[] = [];

    let dynamicSystemPrompt = '';

    // Inject Project Context if linked
    if (chat?.projectId) {
      const project = useProjectStore.getState().projects.find(p => p.id === chat.projectId);
      if (project) {
        dynamicSystemPrompt += `You are assisting the user within the context of a specific project.\n`;
        dynamicSystemPrompt += `Project Name: ${project.name}\n`;
        dynamicSystemPrompt += `ENVIRONMENT: You have access to a terminal. You can suggest shell commands or scripts using \`\`\`bash or \`\`\`powershell code blocks. The user can execute these with a single click. Use this to help with file management, git, or running scripts.\n`;
        if (project.description) {
          dynamicSystemPrompt += `Project Description: ${project.description}\n`;
        }
        
        // 1. Fetch linked manual documents
        const docs = useDocumentStore.getState().documents.filter(d => d.projectId === chat.projectId);
        if (docs.length > 0) {
          dynamicSystemPrompt += `\n--- KNOWN PROJECT DOCUMENTS ---\n`;
          docs.forEach(doc => {
            dynamicSystemPrompt += `Document [${doc.title}]:\n${doc.content}\n\n`;
          });
        }

        // 2. Fetch Project File Structure (Discovery)
        if (project.workspacePath) {
          set({ analyzing: true });
          try {
            const { getProjectShallowTree } = await import('@/services/fs-service');
            const tree = await getProjectShallowTree(project.workspacePath);
            dynamicSystemPrompt += `\n--- PROJECT FILE STRUCTURE ---\n${tree}\n`;
          } finally {
            set({ analyzing: false });
          }
        }

        // 3. Fetch Workspace RAG context (Automated search)
        if (project.workspacePath) {
          const workspaceContext = await searchWorkspace(project.id, content);
          if (workspaceContext) {
            dynamicSystemPrompt += workspaceContext;
          }
        }
      }
    }

    if (chat?.systemPrompt) {
      if (dynamicSystemPrompt) {
        dynamicSystemPrompt += `\n--- USER SYSTEM PROMPT ---\n${chat.systemPrompt}`;
      } else {
        dynamicSystemPrompt = chat.systemPrompt;
      }
    }

    if (dynamicSystemPrompt) {
      ollamaMessages.push({ role: 'system', content: dynamicSystemPrompt.trim() });
    }

    for (const m of allMsgs) {
      if (m.id === assistantMsg.id) continue; // Skip the pending assistant message
      ollamaMessages.push({ role: m.role, content: m.content });
    }

    // Auto-run interceptor BEFORE calling Ollama
    const userIntent = content.toLowerCase();
    if (
      userIntent.includes('starta appen') || 
      userIntent.includes('start app') || 
      userIntent.includes('kör servern') ||
      userIntent.includes('run the app') ||
      userIntent.includes('start the server') ||
      userIntent.includes('kör koden') ||
      userIntent.includes('run it')
    ) {
      const lastAssistantMsg = allMsgs.slice().reverse().find(m => m.role === 'assistant' && m.content.includes('```'));
      if (lastAssistantMsg) {
        const match = lastAssistantMsg.content.match(/```(?:bash|sh|cmd|powershell|)\s*\n([\s\S]*?)```/);
        if (match && match[1]) {
          const command = match[1].trim();
          if (command.startsWith('node ') || command.startsWith('npm ') || command.startsWith('npx ') || command.startsWith('python ')) {
            
            try {
              // 1. DYNAMICALLY pull the Workspace service
              const { syncWorkspace } = await import('@/services/workspace');
              
              // 2. Extract & write ALL code files to the disk
              const workspaceDir = await syncWorkspace(chatId, allMsgs);
              
              // 3. Execute terminal command securely mapped to that new directory context
              useTerminalStore.getState().runCommand(command, { cwd: workspaceDir });
              
              // 4. Print synthetic success log
              assistantMsg.content = `📦 **Workspace Synced** under Documents folder.\n🚀 Background execution triggered: \`${command}\``;
              await messageRepo.create(assistantMsg);
              
              set(s => ({
                messages: {
                  ...s.messages,
                  [chatId]: (s.messages[chatId] || []).map(m =>
                    m.id === assistantMsg.id ? { ...m, content: assistantMsg.content } : m
                  ),
                },
                generating: false,
              }));
              return; // Exit stream early
              
            } catch (fsError: any) {
              console.error("Workspace Engine Failed", fsError);
              
              assistantMsg.content = `⚠️ Failed to sync workspace files: ${fsError.message}`;
              await messageRepo.create(assistantMsg);
              
              set(s => ({
                messages: {
                  ...s.messages,
                  [chatId]: (s.messages[chatId] || []).map(m =>
                    m.id === assistantMsg.id ? { ...m, content: assistantMsg.content } : m
                  ),
                },
                generating: false,
              }));
              return;
            }
          }
        }
      }
    }

    const abortController = new AbortController();
    set({ abortController });

    let fullResponse = '';

    await chatStream(
      model,
      ollamaMessages,
      (chunk) => {
        fullResponse += chunk;
        set(s => ({
          messages: {
            ...s.messages,
            [chatId]: (s.messages[chatId] || []).map(m =>
              m.id === assistantMsg.id ? { ...m, content: fullResponse } : m
            ),
          },
        }));
      },
      async () => {
        assistantMsg.content = fullResponse;
        await messageRepo.create(assistantMsg);
        // Auto-rename if first message
        const msgs = get().messages[chatId] || [];
        const chat = get().chats.find(c => c.id === chatId);
        if (chat && chat.title === 'New Chat' && msgs.filter(m => m.role === 'user').length === 1) {
          const shortTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '');
          get().renameChat(chatId, shortTitle);
        }
        // Update chat timestamp
        if (chat) {
          const updated = { ...chat, updatedAt: new Date().toISOString() };
          await chatRepo.update(updated);
          set(s => ({ chats: s.chats.map(c => c.id === chatId ? updated : c) }));
        }

        set({ generating: false, abortController: null });
      },
      async (error) => {
        assistantMsg.content = `⚠️ ${error}`;
        set(s => ({
          messages: {
            ...s.messages,
            [chatId]: (s.messages[chatId] || []).map(m =>
              m.id === assistantMsg.id ? { ...m, content: assistantMsg.content } : m
            ),
          },
          generating: false,
          abortController: null,
        }));
      },
      abortController.signal
    );
  },

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ generating: false, abortController: null });
    }
  },

  updateChatModel: async (id, model) => {
    const chat = get().chats.find(c => c.id === id);
    if (!chat) return;
    const updated = { ...chat, model, updatedAt: new Date().toISOString() };
    await chatRepo.update(updated);
    set(s => ({ chats: s.chats.map(c => c.id === id ? updated : c) }));
  },

  updateSystemPrompt: async (id, prompt) => {
    const chat = get().chats.find(c => c.id === id);
    if (!chat) return;
    const updated = { ...chat, systemPrompt: prompt, updatedAt: new Date().toISOString() };
    await chatRepo.update(updated);
    set(s => ({ chats: s.chats.map(c => c.id === id ? updated : c) }));
  },

  updateChatProject: async (id, projectId) => {
    const chat = get().chats.find(c => c.id === id);
    if (!chat) return;
    const updated = { ...chat, projectId, updatedAt: new Date().toISOString() };
    await chatRepo.update(updated);
    set(s => ({ chats: s.chats.map(c => c.id === id ? updated : c) }));
  },

  addTerminalMessage: async (chatId, output, meta) => {
    const msg: Message = {
      id: uuid(),
      chatId,
      role: 'system',
      content: output,
      type: 'terminal_output',
      meta,
      createdAt: new Date().toISOString(),
    };
    await messageRepo.create(msg);
    set(s => ({
      messages: {
        ...s.messages,
        [chatId]: [...(s.messages[chatId] || []), msg],
      }
    }));
  },
}));
