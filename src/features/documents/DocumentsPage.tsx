// ──────────────────────────────────────────
// LocalPilot — Documents Page
// ──────────────────────────────────────────

import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  FileText,
  Search,
  MoreVertical,
  ChevronLeft,
  Sparkles,
  Loader2,
  Copy,
  Check,
  FilePlus,
  FileUp,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT, useLanguage } from '@/i18n';
import { useDocumentStore } from '@/store/document-store';
import { useOllamaStore } from '@/store/ollama-store';
import { useSettingsStore } from '@/store/settings-store';
import { generate } from '@/services/ollama';
import { extractTextFromPDF } from '@/services/pdf-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
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
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Document } from '@/types';

export function DocumentsPage() {
  const t = useT();
  const { language } = useLanguage();
  const { documents, loaded, load, createDocument, updateDocument, deleteDocument } = useDocumentStore();
  const { models, connected } = useOllamaStore();
  const { defaultModel } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [editing, setEditing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiCopied, setAiCopied] = useState(false);
  
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => { if (!loaded) load(); }, [loaded]);

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported.');
      return;
    }

    setIsExtracting(true);
    try {
      const result = await extractTextFromPDF(file);
      setFormTitle(result.fileName.replace(/\.pdf$/i, ''));
      setFormContent(result.text);
      setFormOpen(true);
      toast.success('PDF imported successfully!');
    } catch (err: any) {
      console.error('PDF error:', err);
      toast.error('Failed to read PDF file.');
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  const filtered = documents.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreate = () => {
    setFormTitle('');
    setFormContent('');
    setFormOpen(true);
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    const doc = await createDocument({ title: formTitle, content: formContent });
    setFormOpen(false);
    setSelectedDoc(doc);
  };

  const handleSaveEdit = async () => {
    if (!selectedDoc) return;
    await updateDocument({ ...selectedDoc, title: formTitle, content: formContent });
    setSelectedDoc({ ...selectedDoc, title: formTitle, content: formContent, updatedAt: new Date().toISOString() });
    setEditing(false);
  };

  const startEdit = () => {
    if (!selectedDoc) return;
    setFormTitle(selectedDoc.title);
    setFormContent(selectedDoc.content);
    setEditing(true);
  };

  const runAiAction = async (action: string) => {
    if (!selectedDoc || !connected) return;
    const model = defaultModel || models[0]?.name || '';
    if (!model) return;

    setAiLoading(true);
    setAiResult('');

    const svPrompts: Record<string, string> = {
      summarize: `Sammanfatta följande text kortfattat. VIKTIGT: Svara på samma språk som input-texten.\n\n${selectedDoc.content}`,
      rewrite: `Skriv om följande text för att förbättra tydlighet och stil. VIKTIGT: Svara på samma språk som input-texten.\n\n${selectedDoc.content}`,
      explain: `Förklara följande text på ett enkelt och lättförståeligt sätt. VIKTIGT: Svara på samma språk som input-texten.\n\n${selectedDoc.content}`,
      bullets: `Gör om följande text till en välstrukturerad punktlista. VIKTIGT: Svara på samma språk som input-texten.\n\n${selectedDoc.content}`,
    };

    const enPrompts: Record<string, string> = {
      summarize: `Summarize the following text concisely. IMPORTANT: Respond in the same language as the input text.\n\n${selectedDoc.content}`,
      rewrite: `Rewrite the following text to improve clarity and style. IMPORTANT: Respond in the same language as the input text.\n\n${selectedDoc.content}`,
      explain: `Explain the following text in simple, easy-to-understand language. IMPORTANT: Respond in the same language as the input text.\n\n${selectedDoc.content}`,
      bullets: `Turn the following text into a well-organized bullet point list. IMPORTANT: Respond in the same language as the input text.\n\n${selectedDoc.content}`,
    };

    const activePrompts = language === 'sv' ? svPrompts : enPrompts;

    try {
      const result = await generate(model, activePrompts[action] || activePrompts.summarize);
      setAiResult(result);
    } catch (err: any) {
      setAiResult(`⚠️ ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  if (selectedDoc) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="gap-2 text-white/40 hover:text-white" onClick={() => { setSelectedDoc(null); setEditing(false); setAiResult(''); }}>
              <ChevronLeft className="w-4 h-4" /> {t.common.back}
            </Button>
            {!editing && (
              <Button variant="ghost" size="sm" className="glass h-9 px-4 rounded-xl text-xs font-bold" onClick={startEdit}>
                <Edit3 className="w-3.5 h-3.5 mr-2" /> {t.common.edit}
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-6">
              <Input 
                value={formTitle} 
                onChange={e => setFormTitle(e.target.value)} 
                className="text-4xl font-black tracking-tighter bg-transparent border-none p-0 focus-visible:ring-0 placeholder:opacity-20" 
                placeholder="Document Title"
              />
              <Textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder={t.documents.contentPlaceholder}
                className="min-h-[500px] glass p-6 rounded-[32px] border-white/5 font-mono text-[13px] leading-relaxed focus:border-primary/40 transition-all"
              />
              <div className="flex gap-3">
                <Button onClick={handleSaveEdit} className="h-12 px-8 rounded-2xl bg-primary font-bold text-xs uppercase tracking-widest">{t.common.save}</Button>
                <Button variant="ghost" onClick={() => setEditing(false)} className="h-12 px-8 rounded-2xl text-white/40">{t.common.cancel}</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                   <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40">Knowledge Base</div>
                   <div className="w-1 h-1 rounded-full bg-white/20" />
                   <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Last modified {formatDistanceToNow(new Date(selectedDoc.updatedAt), { addSuffix: true })}</div>
                </div>
                <h1 className="text-5xl font-black tracking-tighter uppercase italic">{selectedDoc.title}</h1>
              </div>

              <div className="glass-card p-10 border-white/5 shadow-2xl relative">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                      <FileText className="w-32 h-32" />
                  </div>
                  <div className="prose prose-invert max-w-none prose-sm selection:bg-primary/30 leading-relaxed text-white/80 font-medium">
                      {selectedDoc.content ? (
                        <pre className="whitespace-pre-wrap font-sans !m-0 !p-0 bg-transparent">{selectedDoc.content}</pre>
                      ) : (
                        <p className="italic opacity-30">{t.documents.contentPlaceholder}</p>
                      )}
                  </div>
              </div>

              {/* AI Actions System */}
              <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
                    <Sparkles className="w-4 h-4 shadow-sm" />
                  </div>
                  <h3 className="text-xs font-black tracking-[0.2em] uppercase text-primary/80">Intelligent Operations</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'summarize', label: t.documents.summarize, icon: FilePlus },
                    { key: 'rewrite', label: t.documents.rewrite, icon: Edit3 },
                    { key: 'explain', label: t.documents.explain, icon: Sparkles },
                    { key: 'bullets', label: t.documents.toBullets, icon: Check },
                  ].map(action => (
                    <Button
                      key={action.key}
                      variant="ghost"
                      size="sm"
                      className="glass h-10 px-4 rounded-xl border-white/5 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all font-bold text-[10px] uppercase tracking-widest gap-2"
                      disabled={aiLoading || !connected || !selectedDoc.content}
                      onClick={() => runAiAction(action.key)}
                    >
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <action.icon className="w-3.5 h-3.5 opacity-40 shrink-0" />}
                      {action.label}
                    </Button>
                  ))}
                </div>

                <AnimatePresence>
                  {aiResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-black/40 rounded-[28px] p-6 border border-white/5 relative group shadow-2xl"
                    >
                      <div className="prose prose-invert prose-xs max-w-none selection:bg-primary/40 leading-relaxed text-primary/90 font-medium italic">
                          <pre className="whitespace-pre-wrap font-sans !m-0 !p-0 bg-transparent">{aiResult}</pre>
                      </div>
                      <button
                        className="absolute top-4 right-4 p-2 rounded-xl bg-primary/20 border border-primary/20 hover:bg-primary transition-all text-primary hover:text-primary-foreground shadow-xl opacity-0 group-hover:opacity-100"
                        onClick={() => {
                          navigator.clipboard.writeText(aiResult);
                          setAiCopied(true);
                          setTimeout(() => setAiCopied(false), 2000);
                        }}
                      >
                        {aiCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto p-12 space-y-12 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">{t.documents.title}</h1>
            <p className="text-lg text-white/40 font-medium italic">Build your local knowledge repository.</p>
          </div>
          <div className="flex gap-3">
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              className="hidden"
              onChange={handlePdfImport}
            />
            <Button 
              variant="ghost" 
              className="glass h-14 px-8 rounded-full border-white/5 hover:bg-white/10 font-black uppercase italic tracking-tighter gap-3 text-white/60 hover:text-white" 
              disabled={isExtracting}
              onClick={() => document.getElementById('pdf-upload')?.click()}
            >
              {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
              {isExtracting ? t.documents.pdfReading : t.documents.pdfUpload}
            </Button>
            <Button onClick={openCreate} className="h-14 px-8 rounded-full bg-primary text-primary-foreground font-black uppercase italic tracking-tighter shadow-2xl shadow-primary/20 hover:scale-105 transition-all gap-3">
              <Plus className="w-5 h-5" /> {t.documents.newDocument}
            </Button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={t.documents.searchDocuments}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-[20px] glass border-white/5 focus:border-primary/40 transition-all font-medium italic text-lg"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center glass-card border-white/5 rounded-[40px] opacity-40 group hover:opacity-60 transition-opacity">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-xl border border-white/5 group-hover:scale-110 transition-transform">
               <FileText className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-2">{t.documents.noDocuments}</h3>
            <p className="text-white/40 max-w-sm mb-10">{t.documents.noDocumentsHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(doc => (
              <motion.div
                key={doc.id}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group cursor-pointer relative"
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 blur-3xl bg-primary rounded-[32px] transition-all duration-500" />
                <div className="glass-card border-white/5 rounded-[32px] p-8 hover:border-white/20 transition-all shadow-xl group-hover:shadow-2xl h-full flex flex-col isolation-isolate overflow-hidden bg-white/[0.02]">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg border border-white/5 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                        <FileText className="w-5 h-5 text-white/20 group-hover:text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-white/10 hover:text-white rounded-xl hover:bg-white/5" onClick={e => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass border-white/10 w-40">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); startEdit(); }} className="gap-2 py-2.5">
                          <Edit3 className="w-4 h-4" /> {t.common.edit}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="text-destructive focus:text-destructive gap-2 py-2.5" onClick={(e) => { e.stopPropagation(); setDeleteDialogId(doc.id); }}>
                          <Trash2 className="w-4 h-4" /> {t.common.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black tracking-tight uppercase italic truncate mb-2 group-hover:text-primary transition-colors">{doc.title}</h3>
                    <p className="text-xs text-white/30 font-medium line-clamp-3 leading-relaxed italic">{doc.content || 'Indexed but empty.'}</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/10">
                        {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                     </span>
                     <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="glass border-white/20 max-w-2xl rounded-[40px] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-4xl font-black uppercase italic tracking-tighter">{t.documents.newDocument}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">{t.common.title}</label>
                <Input 
                  value={formTitle} 
                  onChange={e => setFormTitle(e.target.value)}
                  className="glass h-14 px-6 rounded-2xl border-white/5 font-bold italic text-lg" 
                  placeholder="The knowledge node title..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">{t.common.content}</label>
                <Textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder={t.documents.contentPlaceholder}
                  className="min-h-[400px] glass p-6 rounded-[28px] border-white/5 font-mono text-[13px] leading-relaxed resize-none italic"
                />
              </div>
            </div>

            <DialogFooter className="mt-10 gap-3">
              <Button variant="ghost" onClick={() => setFormOpen(false)} className="h-14 px-8 rounded-full text-white/40 hover:text-white uppercase font-black tracking-widest text-[10px]">{t.common.cancel}</Button>
              <Button onClick={handleCreate} className="h-14 px-10 rounded-full bg-primary text-primary-foreground font-black uppercase italic tracking-tighter shadow-2xl shadow-primary/20 active:scale-95 transition-all">
                {t.common.create}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
          <DialogContent className="glass border-white/20 max-w-sm rounded-[40px] p-10">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Trash2 className="w-6 h-6 text-destructive" /> {t.documents.deleteDocument}
              </DialogTitle>
            </DialogHeader>
            <p className="text-white/60 font-medium italic mb-10 leading-relaxed">{t.documents.deleteDocumentConfirm}</p>
            <DialogFooter className="gap-3">
              <Button variant="ghost" onClick={() => setDeleteDialogId(null)} className="flex-1 h-12 rounded-2xl text-white/40 hover:text-white uppercase font-black text-[10px] tracking-widest">{t.common.cancel}</Button>
              <Button variant="destructive" className="flex-1 h-12 rounded-2xl bg-destructive hover:bg-destructive/80 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-destructive/20" onClick={() => { if (deleteDialogId) { deleteDocument(deleteDialogId); setDeleteDialogId(null); } }}>{t.common.delete}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

