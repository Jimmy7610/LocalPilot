// ──────────────────────────────────────────
// LocalPilot — Ollama Store
// ──────────────────────────────────────────

import { create } from 'zustand';
import type { OllamaModel } from '@/types';
import { checkConnection, listModels } from '@/services/ollama';

interface OllamaState {
  connected: boolean;
  checking: boolean;
  models: OllamaModel[];
  loadingModels: boolean;
  check: () => Promise<void>;
  fetchModels: () => Promise<void>;
  startPolling: () => () => void;
}

export const useOllamaStore = create<OllamaState>((set, get) => ({
  connected: false,
  checking: true,
  models: [],
  loadingModels: false,

  check: async () => {
    set({ checking: true });
    const connected = await checkConnection();
    set({ connected, checking: false });
    if (connected && get().models.length === 0) {
      get().fetchModels();
    }
  },

  fetchModels: async () => {
    set({ loadingModels: true });
    const models = await listModels();
    set({ models, loadingModels: false });
  },

  startPolling: () => {
    get().check();
    const interval = setInterval(() => {
      get().check();
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  },
}));
