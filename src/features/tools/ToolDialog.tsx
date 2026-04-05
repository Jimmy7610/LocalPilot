import { useState, useEffect } from 'react';
import { 
  Zap, Sparkles, Shield, Cpu, FileText, RefreshCw, Languages, 
  Lightbulb, Mail, Share2, Eraser, Code, Search, Image, Music, 
  Video, Layers, Settings, Check, X, Wand2 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useT } from '@/i18n';
import { ToolDefinition } from '@/types';
import { cn } from '@/lib/utils';

const ICONS = [
  { id: 'Zap', icon: Zap },
  { id: 'Sparkles', icon: Sparkles },
  { id: 'Shield', icon: Shield },
  { id: 'Cpu', icon: Cpu },
  { id: 'FileText', icon: FileText },
  { id: 'RefreshCw', icon: RefreshCw },
  { id: 'Languages', icon: Languages },
  { id: 'Lightbulb', icon: Lightbulb },
  { id: 'Mail', icon: Mail },
  { id: 'Share2', icon: Share2 },
  { id: 'Eraser', icon: Eraser },
  { id: 'Code', icon: Code },
  { id: 'Search', icon: Search },
  { id: 'Image', icon: Image },
  { id: 'Music', icon: Music },
  { id: 'Video', icon: Video },
  { id: 'Layers', icon: Layers },
  { id: 'Settings', icon: Settings },
];

interface ToolDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (tool: Omit<ToolDefinition, 'id' | 'isCustom'> & { id?: string }) => void;
  editTool?: ToolDefinition | null;
}

export function ToolDialog({ open, onClose, onSave, editTool }: ToolDialogProps) {
  const t = useT();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [icon, setIcon] = useState('Zap');
  const [inputPlaceholder, setInputPlaceholder] = useState('');

  useEffect(() => {
    if (editTool) {
      setTitle(editTool.title || '');
      setDescription(editTool.description || '');
      setSystemPrompt(editTool.systemPrompt || '');
      setIcon(editTool.icon || 'Zap');
      setInputPlaceholder(editTool.inputPlaceholder || '');
    } else {
      setTitle('');
      setDescription('');
      setSystemPrompt('');
      setIcon('Zap');
      setInputPlaceholder('');
    }
  }, [editTool, open]);

  const handleSave = () => {
    if (!title.trim() || !systemPrompt.trim()) return;
    onSave({
      id: editTool?.id,
      title,
      description,
      systemPrompt,
      icon,
      inputPlaceholder: inputPlaceholder || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-border/50 shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wand2 className="w-5 h-5 text-primary" />
            {editTool ? t.tools.editTitle : t.tools.createTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t.tools.toolTitle}</Label>
            <Input 
              id="title" 
              placeholder="t.ex. Proofreader" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.tools.toolDesc}</Label>
            <Input 
              id="description" 
              placeholder="What does it do?" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label>{t.tools.toolIcon}</Label>
            <div className="grid grid-cols-6 gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 max-h-[160px] overflow-y-auto scrollbar-none">
              {ICONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setIcon(item.id)}
                  className={cn(
                    "flex items-center justify-center p-2.5 rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95",
                    icon === item.id 
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" 
                      : "bg-background/50 border-transparent text-muted-foreground hover:bg-background hover:text-foreground hover:border-border"
                  )}
                  title={item.id}
                >
                  <item.icon className="w-4.5 h-4.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">{t.tools.toolPrompt}</Label>
            <Textarea 
              id="systemPrompt" 
              placeholder="t.ex. You are an expert at..." 
              value={systemPrompt} 
              onChange={e => setSystemPrompt(e.target.value)}
              className="min-h-[120px] bg-background/50 resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive">
            {t.common.cancel}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim() || !systemPrompt.trim()}
            className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            {t.tools.saveTool}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
