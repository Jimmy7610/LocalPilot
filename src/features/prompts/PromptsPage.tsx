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
} from 'lucide-react';
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
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{t.prompts.title}</h2>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> {t.prompts.newPrompt}
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder={t.prompts.searchPrompts}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Button
          variant={showFavorites ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => setShowFavorites(!showFavorites)}
        >
          <Star className={cn('w-3.5 h-3.5', showFavorites && 'fill-current')} />
          {t.prompts.favorites}
        </Button>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">{t.prompts.allCategories}</TabsTrigger>
          {CATEGORIES.map(c => (
            <TabsTrigger key={c} value={c} className="capitalize">{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <h3 className="text-base font-semibold mb-1">{t.prompts.noPrompts}</h3>
          <p className="text-sm text-muted-foreground">{t.prompts.noPromptsHint}</p>
          <Button onClick={openCreate} className="mt-4 gap-1.5" size="sm">
            <Plus className="w-4 h-4" /> {t.prompts.newPrompt}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(prompt => (
            <Card key={prompt.id} className="group hover:border-primary/30 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">{prompt.title}</h3>
                    {prompt.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{prompt.description}</p>}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleFavorite(prompt.id)}
                    >
                      <Star className={cn('w-3.5 h-3.5', prompt.favorite && 'fill-amber-500 text-amber-500')} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUseInChat(prompt)}>
                          <MessageSquare className="w-3 h-3 mr-2" /> {t.prompts.useInChat}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(prompt)}>
                          <Edit3 className="w-3 h-3 mr-2" /> {t.common.edit}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialogId(prompt.id)}>
                          <Trash2 className="w-3 h-3 mr-2" /> {t.common.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2 font-mono bg-muted rounded-md p-2">{prompt.content}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">{prompt.category}</Badge>
                  {prompt.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      <Tag className="w-2.5 h-2.5 mr-0.5" /> {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? t.prompts.editPrompt : t.prompts.newPrompt}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">{t.common.title}</label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{t.common.description}</label>
              <Input value={formDesc} onChange={e => setFormDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">{t.common.category}</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">{t.common.tags}</label>
                <Input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="tag1, tag2, ..." />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{t.prompts.promptContent}</label>
              <Textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder={t.prompts.promptContentPlaceholder}
                rows={6}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleSave}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.prompts.deletePrompt}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.prompts.deletePromptConfirm}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogId(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={() => { if (deleteDialogId) { deletePrompt(deleteDialogId); setDeleteDialogId(null); } }}>{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
