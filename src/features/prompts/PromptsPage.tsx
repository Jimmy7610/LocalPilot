// ──────────────────────────────────────────
// LocalPilot — Prompts Library Page
// ──────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Trash2,
  Edit3,
  Star,
  BookOpen,
  Search,
  MoreVertical,
  MessageSquare,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/i18n';
import { usePromptStore } from '@/store/prompt-store';
import { useChatStore } from '@/store/chat-store';
import { useSettingsStore } from '@/store/settings-store';
import { useOllamaStore } from '@/store/ollama-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { PromptTemplate } from '@/types';

const CATEGORIES = ['general', 'coding', 'writing', 'analysis', 'creative', 'business'];

export function PromptsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { prompts, loaded, load, createPrompt, updatePrompt, deletePrompt, toggleFavorite } = usePromptStore();
  const chatStore = useChatStore();
  const { defaultModel } = useSettingsStore();
  const { models } = useOllamaStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formTags, setFormTags] = useState('');
  const [formContent, setFormContent] = useState('');

  useEffect(() => { if (!loaded) load(); }, [loaded]);

  const filtered = prompts.filter(p => {
    if (showFavorites && !p.favorite) return false;
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const openCreate = () => {
    setEditingPrompt(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('general');
    setFormTags('');
    setFormContent('');
    setFormOpen(true);
  };

  const openEdit = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    setFormTitle(prompt.title);
    setFormDesc(prompt.description);
    setFormCategory(prompt.category);
    setFormTags(prompt.tags.join(', '));
    setFormContent(prompt.content);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
    if (editingPrompt) {
      await updatePrompt({ ...editingPrompt, title: formTitle, description: formDesc, category: formCategory, tags, content: formContent });
    } else {
      await createPrompt({ title: formTitle, description: formDesc, category: formCategory, tags, content: formContent });
    }
    setFormOpen(false);
  };

  const handleUseInChat = async (prompt: PromptTemplate) => {
    const model = defaultModel || models[0]?.name || '';
    const chat = await chatStore.createChat(model, prompt.content);
    navigate('/chat');
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto p-12 space-y-12 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">{t.prompts.title}</h1>
            <p className="text-lg text-white/40 font-medium italic">High-performance AI instructions.</p>
          </div>
          <Button onClick={openCreate} className="h-14 px-8 rounded-full bg-primary text-primary-foreground font-black uppercase italic tracking-tighter shadow-2xl shadow-primary/20 hover:scale-105 transition-all gap-3">
            <Plus className="w-5 h-5" /> {t.prompts.newPrompt}
          </Button>
        </div>

        <div className="flex flex-col gap-8">
            {/* Search & Filter Hub */}
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder={t.prompts.searchPrompts}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 rounded-[20px] glass border-white/5 focus:border-primary/40 transition-all font-medium italic text-lg"
                    />
                </div>
                <Button
                    variant="ghost"
                    className={cn(
                        'h-14 px-8 rounded-[20px] glass border-white/5 font-black uppercase tracking-widest text-[10px] gap-3 transition-all',
                        showFavorites ? 'bg-primary/20 text-primary border-primary/20' : 'text-white/40 hover:text-white'
                    )}
                    onClick={() => setShowFavorites(!showFavorites)}
                >
                    <Star className={cn('w-4 h-4', showFavorites && 'fill-current')} />
                    {t.prompts.favorites}
                </Button>
            </div>

            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <TabsList className="h-12 p-1 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-xl">
                    <TabsTrigger value="all" className="px-6 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold text-xs uppercase tracking-widest">{t.prompts.allCategories}</TabsTrigger>
                    {CATEGORIES.map(c => (
                        <TabsTrigger key={c} value={c} className="px-6 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold text-xs uppercase tracking-widest capitalize">{c}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center glass-card border-white/5 rounded-[40px] opacity-40 group hover:opacity-60 transition-opacity">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-xl border border-white/5 group-hover:scale-110 transition-transform">
               <BookOpen className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-2">{t.prompts.noPrompts}</h3>
            <p className="text-white/40 max-w-sm mb-10">{t.prompts.noPromptsHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(prompt => (
              <motion.div
                key={prompt.id}
                whileHover={{ y: -8, scale: 1.01 }}
                className="group relative"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 blur-3xl bg-primary rounded-[32px] transition-all duration-500" />
                <div className="glass-card border-white/5 rounded-[32px] p-8 hover:border-white/20 transition-all shadow-xl group-hover:shadow-2xl h-full flex flex-col isolation-isolate overflow-hidden bg-white/[0.02]">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                             <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[8px] font-black uppercase tracking-widest px-2">{prompt.category}</Badge>
                             {prompt.favorite && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
                        </div>
                        <h3 className="text-xl font-black tracking-tight uppercase italic truncate group-hover:text-primary transition-colors">{prompt.title}</h3>
                        <p className="text-xs text-white/30 font-medium line-clamp-1 italic mt-1">{prompt.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-white/10 hover:text-white rounded-xl hover:bg-white/5"
                            onClick={() => toggleFavorite(prompt.id)}
                        >
                            <Star className={cn('w-4 h-4', prompt.favorite && 'fill-amber-500 text-amber-500')} />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-white/10 hover:text-white rounded-xl hover:bg-white/5">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass border-white/10 w-48">
                                <DropdownMenuItem onClick={() => handleUseInChat(prompt)} className="gap-2 py-2.5">
                                    <MessageSquare className="w-4 h-4" /> {t.prompts.useInChat}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(prompt)} className="gap-2 py-2.5">
                                    <Edit3 className="w-4 h-4" /> {t.common.edit}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="text-destructive focus:text-destructive gap-2 py-2.5" onClick={() => setDeleteDialogId(prompt.id)}>
                                    <Trash2 className="w-4 h-4" /> {t.common.delete}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex-1 mb-6">
                      <div className="h-24 bg-black/40 rounded-2xl p-4 border border-white/5 overflow-hidden relative">
                         <pre className="text-[11px] font-mono leading-relaxed text-white/40 line-clamp-3 italic opacity-60">
                            {prompt.content}
                         </pre>
                         <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent" />
                      </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {prompt.tags.slice(0, 3).map(tag => (
                            <div key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/20">
                                <Tag className="w-2.5 h-2.5" /> {tag}
                            </div>
                        ))}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleUseInChat(prompt)}
                        className="h-9 px-4 rounded-xl glass border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] group/btn"
                      >
                         Launch <ArrowRight className="ml-2 w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="glass border-white/20 max-w-2xl rounded-[40px] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-4xl font-black uppercase italic tracking-tighter">
                {editingPrompt ? t.prompts.editPrompt : t.prompts.newPrompt}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">{t.common.title}</label>
                    <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="glass h-12 px-5 rounded-2xl border-white/5 font-bold italic" placeholder="Creative Refactoring..." />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">{t.common.category}</label>
                    <select
                        value={formCategory}
                        onChange={e => setFormCategory(e.target.value)}
                        className="w-full h-12 rounded-2xl glass border-white/5 px-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none"
                    >
                        {CATEGORIES.map(c => (
                            <option key={c} value={c} className="bg-zinc-900 border-none">{c}</option>
                        ))}
                    </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">{t.common.description}</label>
                <Input value={formDesc} onChange={e => setFormDesc(e.target.value)} className="glass h-12 px-5 rounded-2xl border-white/5 font-medium italic text-white/60" placeholder="Used for optimizing complex logic branches..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">{t.common.tags}</label>
                <Input value={formTags} onChange={e => setFormTags(e.target.value)} className="glass h-12 px-5 rounded-2xl border-white/5 font-mono text-[10px] text-primary" placeholder="coding, rust, cleanup" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">{t.prompts.promptContent}</label>
                <Textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder={t.prompts.promptContentPlaceholder}
                  className="min-h-[300px] glass p-6 rounded-[28px] border-white/5 font-mono text-[13px] leading-relaxed italic resize-none"
                />
              </div>
            </div>
            <DialogFooter className="mt-10 gap-3">
              <Button variant="ghost" onClick={() => setFormOpen(false)} className="h-14 px-8 rounded-full text-white/40 hover:text-white uppercase font-black tracking-widest text-[10px]">{t.common.cancel}</Button>
              <Button onClick={handleSave} className="h-14 px-10 rounded-full bg-primary text-primary-foreground font-black uppercase italic tracking-tighter shadow-2xl shadow-primary/20 active:scale-95 transition-all">
                {t.common.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
          <DialogContent className="glass border-white/20 max-w-sm rounded-[40px] p-10">
            <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                    <Trash2 className="w-6 h-6 text-destructive" /> {t.prompts.deletePrompt}
                </DialogTitle>
            </DialogHeader>
            <p className="text-white/60 font-medium italic mb-10 leading-relaxed">{t.prompts.deletePromptConfirm}</p>
            <DialogFooter className="gap-3">
                <Button variant="ghost" onClick={() => setDeleteDialogId(null)} className="flex-1 h-12 rounded-2xl text-white/40 hover:text-white uppercase font-black text-[10px] tracking-widest">{t.common.cancel}</Button>
                <Button variant="destructive" className="flex-1 h-12 rounded-2xl bg-destructive hover:bg-destructive/80 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-destructive/20" onClick={() => { if (deleteDialogId) { deletePrompt(deleteDialogId); setDeleteDialogId(null); } }}>{t.common.delete}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
