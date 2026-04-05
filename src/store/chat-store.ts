// ──────────────────────────────────────────
// LocalPilot — Chat Store
// ──────────────────────────────────────────

import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Chat, Message, OllamaChatMessage } from '@/types';
import { chatRepo, messageRepo } from '@/services/storage';
import { chatStream } from '@/services/ollama';

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  generating: boolean;
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
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: {},
  activeChatId: null,
  generating: false,
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
      createdAt: new Date().toISOString(),
    };
    await messageRepo.create(userMsg);

    const assistantMsg: Message = {
      id: uuid(),
      chatId,
      role: 'assistant',
      content: '',
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

    if (chat?.systemPrompt) {
      ollamaMessages.push({ role: 'system', content: chat.systemPrompt });
    }

    for (const m of allMsgs) {
      if (m.id === assistantMsg.id) continue; // Skip the pending assistant message
      ollamaMessages.push({ role: m.role, content: m.content });
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
}));
