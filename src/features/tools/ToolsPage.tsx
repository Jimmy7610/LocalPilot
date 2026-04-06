import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText,
  RefreshCw,
  Languages,
  Lightbulb,
  Mail,
  Share2,
  Eraser,
  Wrench,
  Loader2,
  Copy,
  Check,
  ChevronLeft,
  MessageSquare,
  Save,
  Plus,
  Zap,
  Sparkles,
  Shield,
  Cpu,
  Code,
  Search,
  Image,
  Music,
  Video,
  Layers,
  Settings,
  Pencil,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/i18n';
import { useOllamaStore } from '@/store/ollama-store';
import { useSettingsStore } from '@/store/settings-store';
import { useDocumentStore } from '@/store/document-store';
import { useToolStore } from '@/store/tool-store';
import { generate } from '@/services/ollama';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ToolDialog } from './ToolDialog';
import { ToolDefinition } from '@/types';

const ICON_MAP: Record<string, any> = {
  FileText, RefreshCw, Languages, Lightbulb, Mail, Share2, Eraser,
  Zap, Sparkles, Shield, Cpu, Code, Search, Image, Music, Video, Layers, Settings,
};

export function ToolsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { connected, models } = useOllamaStore();
  const { defaultModel } = useSettingsStore();
  const docStore = useDocumentStore();
  const toolStore = useToolStore();

  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [targetLang, setTargetLang] = useState('English');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ToolDefinition | null>(null);

  useEffect(() => {
    toolStore.load();
  }, []);

  const tool = toolStore.tools.find(t => t.id === activeTool);

  const handleRun = async () => {
    if (!tool || !input.trim() || !connected) return;
    const model = defaultModel || models[0]?.name || '';
    if (!model) return;

    setLoading(true);
    setResult('');

    let prompt = input;
    if (tool.hasTargetLanguage) {
      prompt = `Translate to ${targetLang}:\n\n${input}`;
    }

    try {
      const response = await generate(model, prompt, tool.systemPrompt);
      setResult(response);
    } catch (err: any) {
      setResult(`⚠️ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAsDoc = async () => {
    if (!result || !tool) return;
    const toolTitle = tool.isCustom ? tool.title : (t.tools as any)[tool.titleKey!] || tool.id;
    await docStore.createDocument({ 
      title: `${toolTitle} - Result`, 
      content: result,
      projectId: null 
    });
    navigate('/documents');
  };

  const onSaveTool = async (data: any) => {
    if (data.id) {
      await toolStore.updateTool(data as ToolDefinition);
    } else {
      await toolStore.addTool(data);
    }
    setEditTarget(null);
  };

  if (activeTool && tool) {
    const Icon = ICON_MAP[tool.icon] || Wrench;
    const toolTitle = tool.isCustom ? tool.title : (t.tools as any)[tool.titleKey!] || tool.id;
    const toolDesc = tool.isCustom ? tool.description : (t.tools as any)[tool.descriptionKey!] || '';

    return (
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="gap-2 text-white/40 hover:text-white" onClick={() => { setActiveTool(null); setResult(''); setInput(''); }}>
              <ChevronLeft className="w-4 h-4" /> {t.common.back}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-[28px] glass flex items-center justify-center text-primary shadow-2xl relative">
               <div className="absolute inset-0 opacity-20 blur-2xl rounded-full bg-primary" />
               <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                 <h1 className="text-4xl font-black tracking-tighter uppercase italic">{toolTitle}</h1>
                 {connected && <Badge className="bg-primary/20 text-primary border-primary/20 font-black uppercase text-[9px] tracking-widest">Node Active</Badge>}
              </div>
              <p className="text-lg text-white/40 font-medium italic leading-relaxed">{toolDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-7 space-y-6">
                <div className="space-y-4">
                  <Textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={tool.isCustom ? tool.inputPlaceholder : ((t.tools as any)[tool.inputPlaceholderKey!] || t.tools.inputPlaceholder)}
                    className="min-h-[250px] glass p-6 rounded-[32px] border-white/5 font-medium italic text-lg focus:border-primary/40 transition-all shadow-2xl"
                  />
                  
                  <div className="flex items-center justify-between gap-4">
                    {tool.hasTargetLanguage && (
                        <div className="flex items-center gap-4 px-5 h-12 glass rounded-2xl border-white/5">
                            <Languages className="w-4 h-4 text-white/20" />
                            <Input 
                                value={targetLang} 
                                onChange={e => setTargetLang(e.target.value)} 
                                className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-xs font-bold uppercase tracking-widest w-32" 
                            />
                        </div>
                    )}
                    <Button
                        onClick={handleRun}
                        disabled={loading || !input.trim() || !connected}
                        className="h-12 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20 active:scale-95 transition-all ml-auto gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {loading ? t.tools.running : t.tools.run}
                    </Button>
                  </div>
                </div>
            </div>

            <div className="col-span-12 md:col-span-5">
                <AnimatePresence>
                  {result && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-card p-8 border-white/5 shadow-2xl bg-primary/[0.02] space-y-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">{t.tools.result}</h3>
                             <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl glass border-white/5" onClick={handleCopy}>
                                    <Copy className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl glass border-white/5" onClick={handleSaveAsDoc}>
                                    <Save className="w-3.5 h-3.5" />
                                </Button>
                             </div>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none font-medium italic text-primary/80 selection:bg-primary/20 leading-relaxed">
                            <pre className="whitespace-pre-wrap font-sans !m-0 !p-0 bg-transparent">{result}</pre>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto p-12 space-y-12 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">{t.tools.title}</h1>
            <p className="text-lg text-white/40 font-medium italic">Execute task-specific agentic loops.</p>
          </div>
          <Button onClick={() => { setEditTarget(null); setDialogOpen(true); }} className="h-14 px-8 rounded-full bg-primary text-primary-foreground font-black uppercase italic tracking-tighter shadow-2xl shadow-primary/20 hover:scale-105 transition-all gap-3">
            <Plus className="w-5 h-5" /> Initialize Tool
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolStore.tools.map(td => {
            const Icon = ICON_MAP[td.icon] || Wrench;
            const toolTitle = td.isCustom ? td.title : (t.tools as any)[td.titleKey!] || td.id;
            const toolDesc = td.isCustom ? td.description : (t.tools as any)[td.descriptionKey!] || '';

            return (
              <motion.div
                key={td.id}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group cursor-pointer relative"
                onClick={() => setActiveTool(td.id)}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 blur-3xl bg-primary rounded-[32px] transition-all duration-500" />
                <div className="glass-card border-white/5 rounded-[32px] p-8 hover:border-white/20 transition-all shadow-xl group-hover:shadow-2xl h-full flex flex-col isolation-isolate overflow-hidden bg-white/[0.02]">
                    <div className="flex items-start justify-between mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg border border-white/5 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                            <Icon className="w-5 h-5 text-white/20 group-hover:text-primary" />
                        </div>
                        {td.isCustom && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/10 hover:text-white rounded-xl hover:bg-white/5" onClick={e => e.stopPropagation()}>
                                        <Settings className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass border-white/10 w-40">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditTarget(td); setDialogOpen(true); }} className="gap-2 py-2.5">
                                        <Pencil className="w-4 h-4" /> {t.common.edit}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive gap-2 py-2.5" onClick={(e) => { e.stopPropagation(); toolStore.deleteTool(td.id); }}>
                                        <Trash2 className="w-4 h-4" /> {t.common.delete}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-xl font-black tracking-tight uppercase italic truncate mb-2 group-hover:text-primary transition-colors">{toolTitle}</h3>
                        <p className="text-sm text-white/30 font-medium line-clamp-2 leading-relaxed italic">{toolDesc}</p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/20">
                            Agent Module
                         </div>
                         <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
              </motion.div>
            );
          })}

          <motion.div
            whileHover={{ scale: 0.98 }}
            className="cursor-pointer border-2 border-dashed border-white/5 hover:border-primary/20 hover:bg-primary/5 rounded-[32px] flex flex-col items-center justify-center p-12 text-center group transition-all"
            onClick={() => { setEditTarget(null); setDialogOpen(true); }}
          >
            <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-primary/20 flex items-center justify-center mb-6 transition-all group-hover:scale-110">
              <Plus className="w-6 h-6 text-white/20 group-hover:text-primary" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-primary">
              Build Custom Module
            </p>
          </motion.div>
        </div>
      </div>

      <ToolDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSave={onSaveTool}
        editTool={editTarget}
      />
    </div>
  );
}

