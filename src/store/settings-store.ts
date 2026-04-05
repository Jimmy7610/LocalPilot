// ──────────────────────────────────────────
// LocalPilot — Settings Store
// ──────────────────────────────────────────

import { create } from 'zustand';
import type { Language, Theme, AppSettings } from '@/types';
import { settingsRepo } from '@/services/storage';
import { setOllamaBaseUrl } from '@/services/ollama';

interface SettingsState extends AppSettings {
  loaded: boolean;
  load: () => Promise<void>;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setDefaultModel: (model: string) => void;
  setOllamaUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'en',
  theme: 'dark',
  defaultModel: '',
  ollamaBaseUrl: 'http://localhost:11434',
  loaded: false,

  load: async () => {
    const lang = (await settingsRepo.get('language')) as Language | null;
    const theme = (await settingsRepo.get('theme')) as Theme | null;
    const model = await settingsRepo.get('defaultModel');
    const url = await settingsRepo.get('ollamaBaseUrl');

    const resolved = {
      language: lang || 'en',
      theme: theme || 'dark',
      defaultModel: model || '',
      ollamaBaseUrl: url || 'http://localhost:11434',
    };

    setOllamaBaseUrl(resolved.ollamaBaseUrl);

    // Apply theme to document
    if (resolved.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    set({ ...resolved, loaded: true });
  },

  setLanguage: (language) => {
    set({ language });
    settingsRepo.set('language', language);
  },

  setTheme: (theme) => {
    set({ theme });
    settingsRepo.set('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  setDefaultModel: (defaultModel) => {
    set({ defaultModel });
    settingsRepo.set('defaultModel', defaultModel);
  },

  setOllamaUrl: (ollamaBaseUrl) => {
    set({ ollamaBaseUrl });
    settingsRepo.set('ollamaBaseUrl', ollamaBaseUrl);
    setOllamaBaseUrl(ollamaBaseUrl);
  },
}));
