// ──────────────────────────────────────────
// LocalPilot — Main Application
// ──────────────────────────────────────────

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { I18nProvider } from '@/i18n';
import { useSettingsStore } from '@/store/settings-store';
import { useOllamaStore } from '@/store/ollama-store';
import { useChatStore } from '@/store/chat-store';
import { useProjectStore } from '@/store/project-store';
import { usePromptStore } from '@/store/prompt-store';
import { useDocumentStore } from '@/store/document-store';
import { AppLayout } from '@/layout/AppLayout';
import { HomePage } from '@/features/home/HomePage';
import { ChatPage } from '@/features/chat/ChatPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { PromptsPage } from '@/features/prompts/PromptsPage';
import { DocumentsPage } from '@/features/documents/DocumentsPage';
import { ToolsPage } from '@/features/tools/ToolsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { WelcomePage } from '@/features/welcome/WelcomePage';
import { CommandPalette } from '@/features/command-palette/CommandPalette';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';

export default function App() {
  const settings = useSettingsStore();
  const ollamaStore = useOllamaStore();
  const chatStore = useChatStore();
  const projectStore = useProjectStore();
  const promptStore = usePromptStore();
  const documentStore = useDocumentStore();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Initialize app
  useEffect(() => {
    settings.load();
  }, []);

  // Start Ollama polling
  useEffect(() => {
    const cleanup = ollamaStore.startPolling();
    return cleanup;
  }, []);

  // Load all data stores
  useEffect(() => {
    if (settings.loaded) {
      chatStore.load();
      projectStore.load();
      promptStore.load();
      documentStore.load();
    }
  }, [settings.loaded]);

  // Global keyboard shortcut for Command Palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!settings.loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading LocalPilot...</p>
        </div>
      </div>
    );
  }

  return (
    <I18nProvider language={settings.language} setLanguage={settings.setLanguage}>
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <WelcomePage key="welcome" onComplete={() => setShowWelcome(false)} />
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full"
          >
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="prompts" element={<PromptsPage />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="tools" element={<ToolsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Routes>
              <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  className: 'bg-popover text-popover-foreground border border-border',
                }}
              />
            </BrowserRouter>
          </motion.div>
        )}
      </AnimatePresence>
    </I18nProvider>
  );
}
