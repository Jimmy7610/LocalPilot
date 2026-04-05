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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] animate-fade-in" onClick={onClose}>
      <div
        className="w-[560px] bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{t.overlay.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenFull}>
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <Select value={selectedTool} onValueChange={setSelectedTool}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder={t.overlay.selectTool} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">{t.common.none}</SelectItem>
                {toolDefinitions.map(td => (
                  <SelectItem key={td.id} value={td.id} className="text-xs">
                    {(t.tools as any)[td.titleKey] || td.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.overlay.quickInput}
              className="min-h-[44px] max-h-[120px] resize-none text-sm"
              rows={1}
              autoFocus
            />
            <Button
              size="icon"
              className="h-[44px] w-[44px] shrink-0"
              onClick={handleSend}
              disabled={loading || !input.trim() || !connected}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-muted rounded-xl p-3 max-h-[200px] overflow-auto">
              <pre className="whitespace-pre-wrap text-sm font-sans">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
