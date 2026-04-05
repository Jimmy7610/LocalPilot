// ──────────────────────────────────────────
// LocalPilot — Tools Page
// ──────────────────────────────────────────

import { useState } from 'react';
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
} from 'lucide-react';
import { useT } from '@/i18n';
import { useOllamaStore } from '@/store/ollama-store';
import { useSettingsStore } from '@/store/settings-store';
import { useChatStore } from '@/store/chat-store';
import { useDocumentStore } from '@/store/document-store';
import { generate } from '@/services/ollama';
import { toolDefinitions } from './tools-config';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  FileText, RefreshCw, Languages, Lightbulb, Mail, Share2, Eraser,
};

export function ToolsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { connected, models } = useOllamaStore();
  const { defaultModel } = useSettingsStore();
  const chatStore = useChatStore();
  const docStore = useDocumentStore();

  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [targetLang, setTargetLang] = useState('English');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const tool = toolDefinitions.find(t => t.id === activeTool);

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

  const handleSendToChat = async () => {
    const model = defaultModel || models[0]?.name || '';
    const chat = await chatStore.createChat(model);
    // The result is pre-loaded but user navigates to chat
    navigate('/chat');
  };

  const handleSaveAsDoc = async () => {
    if (!result || !tool) return;
    const toolTitle = (t.tools as any)[tool.titleKey] || tool.id;
    await docStore.createDocument({ title: `${toolTitle} - Result`, content: result });
    navigate('/documents');
  };

  // Tool runner view
  if (activeTool && tool) {
    const Icon = ICON_MAP[tool.icon] || Wrench;
    const toolTitle = (t.tools as any)[tool.titleKey] || tool.id;

    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 animate-fade-in">
        <Button variant="ghost" size="sm" className="gap-1.5 mb-4" onClick={() => { setActiveTool(null); setResult(''); setInput(''); }}>
          <ChevronLeft className="w-4 h-4" /> {t.common.back}
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{toolTitle}</h2>
            <p className="text-sm text-muted-foreground">{(t.tools as any)[tool.descriptionKey]}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={(t.tools as any)[tool.inputPlaceholderKey] || t.tools.inputPlaceholder}
              className="min-h-[150px] text-sm"
            />
          </div>

          {tool.hasTargetLanguage && (
            <div>
              <label className="text-xs font-medium mb-1 block">{t.tools.targetLanguage}</label>
              <Input value={targetLang} onChange={e => setTargetLang(e.target.value)} className="max-w-[200px]" />
            </div>
          )}

          <Button
            onClick={handleRun}
            disabled={loading || !input.trim() || !connected}
            className="gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? t.tools.running : t.tools.run}
          </Button>

          {/* Result */}
          {result ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t.tools.result}</h3>
              <div className="bg-muted rounded-xl p-4 relative group">
                <pre className="whitespace-pre-wrap text-sm font-sans">{result}</pre>
                <button
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {t.tools.copyResult}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSaveAsDoc}>
                  <Save className="w-3.5 h-3.5" /> {t.tools.saveAsDocument}
                </Button>
              </div>
            </div>
          ) : !loading ? (
            <p className="text-sm text-muted-foreground">{t.tools.noResult}</p>
          ) : null}
        </div>
        </div>
      </div>
    );
  }

  // Tool grid
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-6">{t.tools.title}</h2>

      <div className="grid grid-cols-3 gap-3">
        {toolDefinitions.map(td => {
          const Icon = ICON_MAP[td.icon] || Wrench;
          const toolTitle = (t.tools as any)[td.titleKey] || td.id;
          const toolDesc = (t.tools as any)[td.descriptionKey] || '';

          return (
            <Card
              key={td.id}
              className="cursor-pointer hover:border-primary/30 transition-colors group"
              onClick={() => setActiveTool(td.id)}
            >
              <CardContent className="pt-4">
                <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-0.5">{toolTitle}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{toolDesc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
    </div>
  );
}
