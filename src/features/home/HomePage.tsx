// ──────────────────────────────────────────
// LocalPilot — Home Dashboard
// ──────────────────────────────────────────

import { useNavigate } from 'react-router';
import {
  MessageSquare,
  FolderKanban,
  BookOpen,
  FileText,
  Plus,
  ArrowRight,
  Wifi,
  WifiOff,
  Zap,
  Cpu,
  Star,
  ChevronRight,
} from 'lucide-react';
import { useT } from '@/i18n';
import { useChatStore } from '@/store/chat-store';
import { useProjectStore } from '@/store/project-store';
import { usePromptStore } from '@/store/prompt-store';
import { useDocumentStore } from '@/store/document-store';
import { useOllamaStore } from '@/store/ollama-store';
import { useSettingsStore } from '@/store/settings-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

import { motion } from 'framer-motion';

export function HomePage() {
  const t = useT();
  const navigate = useNavigate();
  const { chats } = useChatStore();
  const { projects } = useProjectStore();
  const { prompts } = usePromptStore();
  const { documents } = useDocumentStore();
  const { connected, models } = useOllamaStore();
  const { defaultModel } = useSettingsStore();

  const recentChats = chats.slice(0, 5);
  const recentProjects = projects.slice(0, 3);
  const favoritePrompts = prompts.filter(p => p.favorite).slice(0, 4);
  const recentDocs = documents.slice(0, 3);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="h-full overflow-y-auto">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto p-8 space-y-8"
      >
        {/* Welcome */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent italic lowercase">
              {t.home.welcome}
            </h2>
            <p className="text-muted-foreground text-sm mt-1 font-medium italic opacity-70">
              {t.home.welcomeSub}
            </p>
          </div>
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 shadow-[0_0_20px_rgba(var(--color-primary),0.2)] border border-primary/20">
            <Zap className="w-7 h-7 text-primary animate-pulse" />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="grid grid-cols-4 gap-4">
          {[
            { label: t.home.newChat, icon: MessageSquare, action: () => navigate('/chat'), color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: t.home.newProject, icon: FolderKanban, action: () => navigate('/projects'), color: 'text-violet-400', bg: 'bg-violet-400/10' },
            { label: t.home.newPrompt, icon: BookOpen, action: () => navigate('/prompts'), color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { label: t.home.newDocument, icon: FileText, action: () => navigate('/documents'), color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              className="group flex flex-col items-start gap-4 p-5 glass-card border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
            >
              <div className={cn('p-3 rounded-xl transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-lg', action.bg, action.color)}>
                <action.icon className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{action.label}</span>
                <Plus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
              </div>
            </button>
          ))}
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          {/* Recent Chats */}
          <motion.div variants={item} className="col-span-2">
            <Card className="glass-card border-white/5 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">{t.home.recentChats}</CardTitle>
                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest h-7 hover:bg-white/5" onClick={() => navigate('/chat')}>
                  {t.home.viewAll} <ArrowRight className="w-3 h-3 ml-2" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-1 px-3">
                {recentChats.length === 0 ? (
                  <p className="text-xs font-medium text-muted-foreground py-10 text-center italic opacity-50">{t.home.noRecentChats}</p>
                ) : (
                  recentChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => { navigate('/chat'); setTimeout(() => useChatStore.getState().setActiveChat(chat.id), 50); }}
                      className="group flex items-center gap-4 w-full p-3 rounded-xl hover:bg-white/5 transition-all text-left border border-transparent hover:border-white/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <MessageSquare className="w-4 h-4 text-white/30 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{chat.title}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-0.5">
                          {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-all translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Ollama Status */}
          <motion.div variants={item}>
            <Card className="glass-card border-white/5 h-full bg-primary/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">{t.home.ollamaStatus}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
                  {connected ? (
                    <div className="flex items-center gap-3 text-success">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      <span className="text-xs font-bold uppercase tracking-widest">{t.ollama.connected}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-destructive">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="text-xs font-bold uppercase tracking-widest">{t.ollama.disconnected}</span>
                    </div>
                  )}
                  <Wifi className={cn("w-4 h-4 opacity-40", connected ? "text-success" : "text-destructive")} />
                </div>

                {connected && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.home.modelsAvailable}</span>
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{models.length}</span>
                    </div>
                    <div className="space-y-2">
                      {models.slice(0, 4).map((model) => (
                        <div key={model.name} className="group flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-all">
                          <div className="flex items-center gap-3">
                            <Cpu className="w-3.5 h-3.5 opacity-20 group-hover:text-primary group-hover:opacity-100 transition-all" />
                            <span className="text-xs font-semibold truncate max-w-[120px]">{model.name}</span>
                          </div>
                          {defaultModel === model.name && <div className="text-[8px] font-bold uppercase tracking-tighter bg-primary text-white px-1.5 py-0.5 rounded italic">Default</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={item} className="grid grid-cols-3 gap-6">
          {/* Recent Projects */}
          <Card className="glass-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">{t.home.recentProjects}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-3">
              {recentProjects.length === 0 ? (
                <p className="text-xs font-medium text-muted-foreground py-6 text-center italic opacity-50">{t.home.noRecentProjects}</p>
              ) : (
                recentProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => navigate('/projects')}
                    className="group flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
                  >
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:scale-125 transition-transform" style={{ backgroundColor: project.color }} />
                    <span className="text-sm font-semibold truncate opacity-70 group-hover:opacity-100 transition-opacity">{project.name}</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Favorite Prompts */}
          <Card className="glass-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">{t.home.favoritePrompts}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-3">
              {favoritePrompts.length === 0 ? (
                <p className="text-xs font-medium text-muted-foreground py-6 text-center italic opacity-50">{t.home.noFavoritePrompts}</p>
              ) : (
                favoritePrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => navigate('/prompts')}
                    className="group flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500/40 group-hover:text-amber-500 group-hover:fill-amber-500 transition-all shrink-0" />
                    <span className="text-sm font-semibold truncate opacity-70 group-hover:opacity-100 transition-opacity">{prompt.title}</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Documents Snapshot */}
          <Card className="glass-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">{t.home.documentsSnapshot}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-3">
              {recentDocs.length === 0 ? (
                <p className="text-xs font-medium text-muted-foreground py-6 text-center italic opacity-50">{t.home.noDocuments}</p>
              ) : (
                recentDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => navigate('/documents')}
                    className="group flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
                  >
                    <FileText className="w-3.5 h-3.5 opacity-20 group-hover:opacity-100 transition-opacity shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{doc.title}</p>
                      <p className="text-[9px] font-bold uppercase tracking-tighter opacity-30">
                        {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
