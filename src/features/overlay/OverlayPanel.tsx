// ──────────────────────────────────────────
// LocalPilot — Overlay Popup
// ──────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  X,
  Send,
  Loader2,
  Maximize2,
  Wrench,
  Zap,
} from 'lucide-react';
import { useT } from '@/i18n';
import { useOllamaStore } from '@/store/ollama-store';
import { useSettingsStore } from '@/store/settings-store';
import { generate } from '@/services/ollama';
import { toolDefinitions } from '@/features/tools/tools-config';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface OverlayPanelProps {
  open: boolean;
  onClose: () => void;
}

export function OverlayPanel({ open, onClose }: OverlayPanelProps) {
  const t = useT();
  const navigate = useNavigate();
  const { connected, models } = useOllamaStore();
  const { defaultModel } = useSettingsStore();

  const [input, setInput] = useState('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSend = async () => {
    if (!input.trim() || !connected) return;
    const model = defaultModel || models[0]?.name || '';
    if (!model) return;

    setLoading(true);
    setResult('');

    const tool = toolDefinitions.find(t => t.id === selectedTool);
    const systemPrompt = tool?.systemPrompt;

    try {
      const response = await generate(model, input, systemPrompt);
      setResult(response);
    } catch (err: any) {
      setResult(`⚠️ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleOpenFull = () => {
    onClose();
    if (selectedTool) {
      navigate('/tools');
    } else {
      navigate('/chat');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-[640px] glass border-white/10 rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden animate-slide-up ring-1 ring-white/5"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Bar Area */}
        <div className="relative flex items-center px-6 py-5 border-b border-white/5">
          <Zap className="absolute left-6 w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(var(--color-primary),0.6)]" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.overlay.quickInput}
            className="w-full pl-10 bg-transparent border-none outline-none text-lg font-medium placeholder:text-white/20"
            autoFocus
          />
          <div className="flex items-center gap-2">
            {!input && <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">LocalPilot Spotlight</span>}
            <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/40">ESC</kbd>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-2 max-h-[400px] overflow-auto">
          {/* Tool Selector Section */}
          <div className="px-3 py-2">
            <h3 className="px-3 text-[10px] font-bold tracking-[0.1em] text-white/30 uppercase mb-2">Capabilities</h3>
            <div className="grid grid-cols-3 gap-1">
              {toolDefinitions.map(td => (
                <button
                  key={td.id}
                  onClick={() => setSelectedTool(td.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group duration-200 text-left",
                    selectedTool === td.id 
                      ? "bg-primary/20 text-primary shadow-[inset_0_0_15px_rgba(var(--color-primary),0.05)] border border-primary/20" 
                      : "hover:bg-white/5 text-white/60 border border-transparent"
                  )}
                >
                  <Wrench className={cn("w-4 h-4 opacity-50 transition-transform group-hover:scale-110", selectedTool === td.id && "opacity-100")} />
                  <span className="truncate">{(t.tools as Record<string, string>)[td.titleKey || ''] || td.title || td.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Results */}
          {result && (
            <div className="mt-2 mx-2 p-4 rounded-2xl bg-black/40 border border-white/5 animate-fade-in shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Generation Result</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-white/80">{result}</pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-black/20 border-t border-white/5">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 opacity-40">
                <div className={cn("w-2 h-2 rounded-full", connected ? "bg-success" : "bg-destructive")} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{connected ? "AI Ready" : "Offline"}</span>
              </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleOpenFull}
                className="h-9 px-4 rounded-xl text-xs font-bold text-white/40 hover:text-white"
            >
              Open Full App
            </Button>
            <Button 
                onClick={handleSend}
                disabled={loading || !input.trim() || !connected}
                className="h-9 px-5 rounded-xl bg-primary hover:bg-primary/80 text-white font-bold text-xs shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Run Command</span>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
