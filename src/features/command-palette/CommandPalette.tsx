import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  Search, 
  MessageSquare, 
  FolderKanban, 
  FileText, 
  BookOpen, 
  Wrench, 
  Plus, 
  ArrowRight,
  Zap,
  Command,
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/i18n';
import { useChatStore } from '@/store/chat-store';
import { useProjectStore } from '@/store/project-store';
import { useDocumentStore } from '@/store/document-store';
import { usePromptStore } from '@/store/prompt-store';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

type ResultItem = {
  id: string;
  type: 'chat' | 'project' | 'document' | 'prompt' | 'action';
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
};

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const t = useT();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { chats, setActiveChat } = useChatStore();
  const { projects } = useProjectStore();
  const { documents } = useDocumentStore();
  const { prompts } = usePromptStore();

  // Reset state on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Unified Search Logic
  const results = useMemo(() => {
    const items: ResultItem[] = [];
    const q = query.toLowerCase().trim();

    // 1. Actions (Always show top if query is empty or matches)
    const actions: ResultItem[] = [
      { id: 'new-chat', type: 'action', title: t.home.newChat, icon: Plus, action: () => { navigate('/chat'); onClose(); } },
      { id: 'new-doc', type: 'action', title: t.home.newDocument, icon: FileText, action: () => { navigate('/documents'); onClose(); } },
      { id: 'settings', type: 'action', title: t.nav.settings, icon: Settings, action: () => { navigate('/settings'); onClose(); } },
    ];

    if (!q) {
      items.push(...actions);
    } else {
      items.push(...actions.filter(a => a.title.toLowerCase().includes(q)));
    }

    // 2. Searchable Entities
    const searchItems: ResultItem[] = [
      ...chats.map(c => ({ id: c.id, type: 'chat' as const, title: c.title, subtitle: 'Chat', icon: MessageSquare, action: () => { navigate('/chat'); setActiveChat(c.id); onClose(); } })),
      ...projects.map(p => ({ id: p.id, type: 'project' as const, title: p.name, subtitle: 'Project', icon: FolderKanban, action: () => { navigate('/projects'); onClose(); } })),
      ...documents.map(d => ({ id: d.id, type: 'document' as const, title: d.title, subtitle: 'Document', icon: FileText, action: () => { navigate('/documents'); onClose(); } })),
      ...prompts.map(p => ({ id: p.id, type: 'prompt' as const, title: p.title, subtitle: 'Prompt', icon: BookOpen, action: () => { navigate('/prompts'); onClose(); } })),
    ];

    if (q) {
      items.push(...searchItems.filter(i => 
        i.title.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q)
      ));
    } else {
        // Show a snapshot of recent items if query is empty
        items.push(...searchItems.slice(0, 8));
    }

    return items;
  }, [query, chats, projects, documents, prompts, t, navigate, onClose]);

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[selectedIndex]?.action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[640px] max-w-[90vw] glass-card border-border shadow-2xl shadow-black/20 overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Command Header */}
            <div className="flex items-center px-6 py-5 border-b border-border gap-4">
              <Command className="w-5 h-5 text-primary opacity-50" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search everything or type a command..."
                className="flex-1 bg-transparent border-none outline-none text-lg font-medium placeholder:text-foreground/40"
              />
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded-lg bg-muted border border-border text-[10px] font-mono text-foreground/40 shadow-sm">ESC</kbd>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[420px] overflow-y-auto py-2 custom-scrollbar">
              {results.length > 0 ? (
                <div className="px-2 space-y-1">
                  {results.map((item, index) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "flex items-center gap-4 w-full p-3 rounded-xl transition-all duration-150 group text-left",
                        index === selectedIndex 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                          : "hover:bg-muted/50 text-foreground/60"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        index === selectedIndex ? "bg-white/20" : "bg-muted"
                      )}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{item.title}</span>
                          {item.type === 'action' && (
                             <span className={cn(
                               "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                               index === selectedIndex ? "bg-white/20" : "bg-primary/20 text-primary"
                             )}>Command</span>
                          )}
                        </div>
                        {item.subtitle && (
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest opacity-40",
                            index === selectedIndex ? "text-primary-foreground" : ""
                          )}>{item.subtitle}</span>
                        )}
                      </div>
                      <div className={cn(
                        "opacity-0 transition-all",
                        index === selectedIndex ? "opacity-100 translate-x-0" : "translate-x-2"
                      )}>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-foreground/40">
                  <Sparkles className="w-10 h-10 mb-4 opacity-40" />
                  <p className="text-sm font-bold uppercase tracking-widest italic">No matches found</p>
                </div>
              )}
            </div>

            {/* Footer / Shortcuts */}
            <div className="flex items-center justify-between px-6 py-4 bg-muted/50 border-t border-border">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded-md bg-background border border-border text-[9px] font-mono opacity-40">↑↓</kbd>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Navigate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded-md bg-background border border-border text-[9px] font-mono opacity-40">ENTER</kbd>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Select</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-30">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-tighter italic">LocalPilot Core v0.2</span>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
