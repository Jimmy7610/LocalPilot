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
  Search,
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
import { Badge } from '@/components/ui/badge';
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
    <div className="h-full overflow-y-auto custom-scrollbar">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto p-12 space-y-12"
      >
        {/* Header Section */}
        <motion.div variants={item} className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
                <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary italic">Beta v0.2.0</div>
                <div className="w-1 h-1 rounded-full bg-foreground/20" />
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Local-First Agent Core</div>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter leading-none">
                <span className="text-foreground/40 font-medium italic mr-3">Welcome to</span>
                <span className="text-foreground italic font-serif">LocalPilot</span>
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1">
             <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-muted/50 border border-border backdrop-blur-sm shadow-xl">
                <div className={cn("w-2 h-2 rounded-full shadow-[0_0_10px_currentcolor]", connected ? "bg-success text-success animate-pulse" : "bg-destructive text-destructive")} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{connected ? 'Node Active' : 'Node Offline'}</span>
             </div>
          </div>
        </motion.div>

        {/* Global Search Trigger (Spotlight Style) */}
        <motion.div variants={item}>
           <button 
             onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' }))}
             className="w-full group relative flex items-center justify-between p-6 rounded-[28px] bg-muted/30 border border-border hover:border-primary/20 hover:bg-muted/50 transition-all duration-300 shadow-2xl group shadow-black/40"
           >
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Search className="w-6 h-6" />
                 </div>
                 <div className="text-left">
                    <p className="text-xl font-bold text-foreground/50 group-hover:text-foreground transition-colors tracking-tight">Search everything or ask anything...</p>
                    <p className="text-xs font-medium text-foreground/20 uppercase tracking-widest mt-0.5">Quick access to projects, chats, and intelligent tools</p>
                 </div>
              </div>
              <div className="flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                 <kbd className="px-2 py-1 rounded-lg bg-background border border-border font-mono text-xs font-bold shadow-sm">CTRL</kbd>
                 <kbd className="px-2 py-1 rounded-lg bg-background border border-border font-mono text-xs font-bold shadow-sm">K</kbd>
              </div>
           </button>
        </motion.div>

        {/* Primary Activity Hub */}
        <div className="grid grid-cols-12 gap-8">
            
            {/* Left Column: Recents */}
            <div className="col-span-8 space-y-8">
                
                {/* Quick Shortcuts */}
                <motion.div variants={item} className="grid grid-cols-4 gap-4">
                  {[
                    { label: t.home.newChat, icon: MessageSquare, action: () => navigate('/chat'), color: 'text-primary', bg: 'bg-primary/10' },
                    { label: t.home.newProject, icon: FolderKanban, action: () => navigate('/projects'), color: 'text-foreground/60', bg: 'bg-muted/50' },
                    { label: t.home.newPrompt, icon: BookOpen, action: () => navigate('/prompts'), color: 'text-foreground/60', bg: 'bg-muted/50' },
                    { label: t.home.newDocument, icon: FileText, action: () => navigate('/documents'), color: 'text-foreground/60', bg: 'bg-muted/50' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={action.action}
                      className="group flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-muted/30 border border-border hover:border-primary/20 hover:bg-primary/5 transition-all"
                    >
                      <div className={cn('p-3 rounded-2xl transition-all group-hover:scale-110', action.bg, action.color)}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity text-center leading-tight">{action.label}</span>
                    </button>
                  ))}
                </motion.div>

                {/* Recent Chats */}
                <motion.div variants={item}>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/20">{t.home.recentChats}</h3>
                        <Button variant="link" className="text-[10px] font-bold uppercase tracking-widest text-primary p-0 h-auto opacity-60 hover:opacity-100" onClick={() => navigate('/chat')}>
                            View all
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {recentChats.length === 0 ? (
                            <div className="p-12 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center opacity-40">
                                <MessageSquare className="w-8 h-8 mb-4 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest italic">{t.home.noRecentChats}</p>
                            </div>
                        ) : (
                            recentChats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => { navigate('/chat'); setTimeout(() => useChatStore.getState().setActiveChat(chat.id), 50); }}
                                    className="group flex items-center justify-between w-full p-4 rounded-3xl bg-muted/30 border border-border hover:border-primary/20 transition-all text-left shadow-lg shadow-black/20"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shrink-0 border border-border group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                                            <MessageSquare className="w-4 h-4 text-foreground/20 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold truncate group-hover:text-foreground transition-colors">{chat.title}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/20 mt-0.5">
                                                Modified {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 px-4 opacity-0 group-hover:opacity-100 transition-all">
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-muted text-foreground/40">{chat.model}</span>
                                        <ArrowRight className="w-4 h-4 text-primary" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Right Column: Status & Library */}
            <div className="col-span-4 space-y-8">
                
                {/* System Stats Card */}
                <motion.div variants={item} className="p-8 rounded-[32px] bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/5 space-y-8">
                    <div className="space-y-1">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/60">{t.home.ollamaStatus}</h3>
                        <div className="flex items-center gap-2">
                             <Wifi className={cn("w-4 h-4", connected ? "text-primary animate-pulse" : "text-foreground/20")} />
                             <span className="text-lg font-bold tracking-tight">{connected ? 'Connected' : 'Offline'}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Local Models</span>
                            <Badge variant="outline" className="bg-primary/20 border-primary/40 text-[10px] font-mono">{models.length}</Badge>
                        </div>
                        <div className="space-y-2">
                            {models.slice(0, 3).map(m => (
                                <div key={m.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Cpu className="w-3 h-3 text-foreground/20" />
                                        <span className="text-[11px] font-bold truncate opacity-60">{m.name}</span>
                                    </div>
                                    {defaultModel === m.name && <div className="text-[8px] font-black uppercase tracking-tighter text-primary italic">Default</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button className="w-full h-10 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-xl shadow-primary/20 hover:scale-[1.02]" onClick={() => navigate('/settings')}>
                        Manage Node
                    </Button>
                </motion.div>

                {/* Recent Documents */}
                <motion.div variants={item}>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/20 mb-4 px-2">{t.home.documentsSnapshot}</h3>
                    <div className="p-3 rounded-[32px] bg-muted/30 border border-border space-y-1 shadow-xl shadow-black/20">
                        {recentDocs.length === 0 ? (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-center py-6 opacity-30 italic">No Recent Index</p>
                        ) : (
                            recentDocs.map(doc => (
                                <button
                                    key={doc.id}
                                    onClick={() => navigate('/documents')}
                                    className="group flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-muted transition-all text-left"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center border border-border opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">
                                        <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate opacity-60 group-hover:opacity-100 group-hover:text-foreground transition-all">{doc.title}</p>
                                        <p className="text-[8px] font-black uppercase tracking-tighter opacity-20 group-hover:opacity-40 transition-all">
                                            {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}

