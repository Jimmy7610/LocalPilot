// ──────────────────────────────────────────
// LocalPilot — Prompt Store
// ──────────────────────────────────────────

import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { PromptTemplate } from '@/types';
import { promptRepo } from '@/services/storage';

interface PromptState {
  prompts: PromptTemplate[];
  loaded: boolean;
  load: () => Promise<void>;
  createPrompt: (data: { title: string; description: string; category: string; tags: string[]; content: string; projectIds?: string[] }) => Promise<PromptTemplate>;
  updatePrompt: (prompt: PromptTemplate) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  linkToProject: (promptId: string, projectId: string) => Promise<void>;
  unlinkFromProject: (promptId: string, projectId: string) => Promise<void>;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  loaded: false,

  load: async () => {
    const prompts = await promptRepo.getAll();
    set({ prompts, loaded: true });
  },

  createPrompt: async (data) => {
    const now = new Date().toISOString();
    const prompt: PromptTemplate = {
      id: uuid(),
      ...data,
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };
    await promptRepo.create(prompt);
    set(s => ({ prompts: [prompt, ...s.prompts] }));
    return prompt;
  },

  updatePrompt: async (prompt) => {
    const updated = { ...prompt, updatedAt: new Date().toISOString() };
    await promptRepo.update(updated);
    set(s => ({ prompts: s.prompts.map(p => p.id === prompt.id ? updated : p) }));
  },

  deletePrompt: async (id) => {
    await promptRepo.delete(id);
    set(s => ({ prompts: s.prompts.filter(p => p.id !== id) }));
  },

  toggleFavorite: async (id) => {
    const prompt = get().prompts.find(p => p.id === id);
    if (!prompt) return;
    const updated = { ...prompt, favorite: !prompt.favorite, updatedAt: new Date().toISOString() };
    await promptRepo.update(updated);
    set(s => ({ prompts: s.prompts.map(p => p.id === id ? updated : p) }));
  },

  linkToProject: async (promptId, projectId) => {
    const prompt = get().prompts.find(p => p.id === promptId);
    if (!prompt) return;
    const pids = prompt.projectIds || [];
    if (pids.includes(projectId)) return;
    const updated = { ...prompt, projectIds: [...pids, projectId], updatedAt: new Date().toISOString() };
    await promptRepo.update(updated);
    set(s => ({ prompts: s.prompts.map(p => p.id === promptId ? updated : p) }));
  },

  unlinkFromProject: async (promptId, projectId) => {
    const prompt = get().prompts.find(p => p.id === promptId);
    if (!prompt) return;
    const pids = prompt.projectIds || [];
    const updated = { ...prompt, projectIds: pids.filter(id => id !== projectId), updatedAt: new Date().toISOString() };
    await promptRepo.update(updated);
    set(s => ({ prompts: s.prompts.map(p => p.id === promptId ? updated : p) }));
  },
}));
