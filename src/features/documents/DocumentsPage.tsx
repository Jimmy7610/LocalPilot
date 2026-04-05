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
} from 'lucide-react';
import { useT } from '@/i18n';
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
      toast.error('Går bara att ladda upp PDF-filer');
      return;
    }

    setIsExtracting(true);
    try {
      const result = await extractTextFromPDF(file);
      setFormTitle(result.fileName.replace(/\.pdf$/i, ''));
      setFormContent(result.text);
      setFormOpen(true);
      toast.success('PDF importerad klockrent!');
    } catch (err: any) {
      console.error('PDF error:', err);
      toast.error('Kunde tyvärr inte läsa PDF-filen');
    } finally {
      setIsExtracting(false);
      // Reset input
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

    const prompts: Record<string, string> = {
      summarize: `Summarize the following text concisely:\n\n${selectedDoc.content}`,
      rewrite: `Rewrite the following text to improve clarity and style:\n\n${selectedDoc.content}`,
      explain: `Explain the following text in simple, easy-to-understand language:\n\n${selectedDoc.content}`,
      bullets: `Turn the following text into a well-organized bullet point list:\n\n${selectedDoc.content}`,
    };

    try {
      const result = await generate(model, prompts[action] || prompts.summarize);
      setAiResult(result);
    } catch (err: any) {
      setAiResult(`⚠️ ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Document detail view
  if (selectedDoc) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Button variant="ghost" size="sm" className="gap-1.5 mb-4" onClick={() => { setSelectedDoc(null); setEditing(false); setAiResult(''); }}>
          <ChevronLeft className="w-4 h-4" /> {t.common.back}
        </Button>

        {editing ? (
          <div className="space-y-3">
            <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="text-lg font-semibold" />
            <Textarea
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              placeholder={t.documents.contentPlaceholder}
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit}>{t.common.save}</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>{t.common.cancel}</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedDoc.title}</h2>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" /> {t.common.edit}
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 mb-4 min-h-[200px]">
              <pre className="whitespace-pre-wrap text-sm font-sans">{selectedDoc.content || t.documents.contentPlaceholder}</pre>
            </div>

            {/* AI Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> {t.documents.aiActions}
              </h3>
              <div className="flex gap-2">
                {[
                  { key: 'summarize', label: t.documents.summarize },
                  { key: 'rewrite', label: t.documents.rewrite },
                  { key: 'explain', label: t.documents.explain },
                  { key: 'bullets', label: t.documents.toBullets },
                ].map(action => (
                  <Button
                    key={action.key}
                    variant="outline"
                    size="sm"
                    disabled={aiLoading || !connected || !selectedDoc.content}
                    onClick={() => runAiAction(action.key)}
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                    {action.label}
                  </Button>
                ))}
              </div>

              {aiResult && (
                <div className="bg-muted rounded-xl p-4 relative group">
                  <pre className="whitespace-pre-wrap text-sm font-sans">{aiResult}</pre>
                  <button
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      navigator.clipboard.writeText(aiResult);
                      setAiCopied(true);
                      setTimeout(() => setAiCopied(false), 2000);
                    }}
                  >
                    {aiCopied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </div>
    );
  }

  // Document list view
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{t.documents.title}</h2>
        <div className="flex gap-2">
          <input
            type="file"
            id="pdf-upload"
            accept=".pdf"
            className="hidden"
            onChange={handlePdfImport}
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5" 
            disabled={isExtracting}
            onClick={() => document.getElementById('pdf-upload')?.click()}
          >
            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {isExtracting ? t.documents.pdfReading : t.documents.pdfUpload}
          </Button>
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> {t.documents.newDocument}
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder={t.documents.searchDocuments}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <h3 className="text-base font-semibold mb-1">{t.documents.noDocuments}</h3>
          <p className="text-sm text-muted-foreground">{t.documents.noDocumentsHint}</p>
          <div className="flex justify-center gap-2 mt-4">
            <Button 
              variant="outline" 
              className="gap-1.5" 
              size="sm"
              disabled={isExtracting}
              onClick={() => document.getElementById('pdf-upload')?.click()}
            >
              {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              {t.documents.pdfUpload}
            </Button>
            <Button onClick={openCreate} className="gap-1.5" size="sm">
              <Plus className="w-4 h-4" /> {t.documents.newDocument}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 cursor-pointer transition-colors group bg-card"
              onClick={() => setSelectedDoc(doc)}
            >
              <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{doc.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{doc.content || t.documents.contentPlaceholder}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0" onClick={e => e.stopPropagation()}>
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); startEdit(); }}>
                    <Edit3 className="w-3 h-3 mr-2" /> {t.common.edit}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialogId(doc.id); }}>
                    <Trash2 className="w-3 h-3 mr-2" /> {t.common.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.documents.newDocument}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">{t.common.title}</label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{t.common.content}</label>
              <Textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder={t.documents.contentPlaceholder}
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleCreate}>{t.common.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.documents.deleteDocument}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.documents.deleteDocumentConfirm}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogId(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={() => { if (deleteDialogId) { deleteDocument(deleteDialogId); setDeleteDialogId(null); } }}>{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
