// ──────────────────────────────────────────
// LocalPilot — Settings Page
// ──────────────────────────────────────────

import { useState } from 'react';
import {
  Globe,
  Sun,
  Moon,
  Cpu,
  Server,
  Database,
  Trash2,
  Info,
  Zap,
} from 'lucide-react';
import { useT } from '@/i18n';
import { useSettingsStore } from '@/store/settings-store';
import { useOllamaStore } from '@/store/ollama-store';
import { resetAllData } from '@/services/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const t = useT();
  const settings = useSettingsStore();
  const { models } = useOllamaStore();
  const [resetDialog, setResetDialog] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaBaseUrl);

  const handleResetData = async () => {
    await resetAllData();
    setResetDialog(false);
    window.location.reload();
  };

  const handleUrlSave = () => {
    settings.setOllamaUrl(ollamaUrl);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto p-12 space-y-12 animate-in fade-in duration-700">
        <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">{t.settings.title}</h1>
            <p className="text-lg text-white/40 font-medium italic">Configure your local intelligence hub.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
            {/* Appearance Section */}
            <div className="glass-card p-10 border-white/5 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Globe className="w-40 h-40" />
                </div>
                
                <div className="space-y-1">
                    <h3 className="text-xs font-black tracking-[0.2em] uppercase text-primary/60">{t.settings.appearance}</h3>
                    <div className="w-12 h-1 bg-primary/20 rounded-full" />
                </div>

                <div className="space-y-8">
                    {/* Language Hub */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-lg font-black uppercase italic tracking-tight">{t.settings.language}</p>
                                <p className="text-sm text-white/30 font-medium italic">{t.settings.languageDesc}</p>
                            </div>
                        </div>
                        <Select value={settings.language} onValueChange={(val: any) => settings.setLanguage(val)}>
                            <SelectTrigger className="w-[180px] h-14 glass rounded-2xl border-white/5 font-bold uppercase tracking-widest text-[10px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-white/10 rounded-2xl">
                                <SelectItem value="en" className="py-3 rounded-xl">{t.settings.english}</SelectItem>
                                <SelectItem value="sv" className="py-3 rounded-xl">{t.settings.swedish}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* Theme Hub */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                                {settings.theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                            </div>
                            <div>
                                <p className="text-lg font-black uppercase italic tracking-tight">{t.settings.theme}</p>
                                <p className="text-sm text-white/30 font-medium italic">{t.settings.themeDesc}</p>
                            </div>
                        </div>
                        <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-3xl">
                            <button
                                className={cn(
                                    'px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center',
                                    settings.theme === 'light' ? 'bg-primary text-primary-foreground shadow-xl' : 'text-white/20 hover:text-white'
                                )}
                                onClick={() => settings.setTheme('light')}
                            >
                                <Sun className="w-4 h-4" /> {t.settings.light}
                            </button>
                            <button
                                className={cn(
                                    'px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center',
                                    settings.theme === 'dark' ? 'bg-primary text-primary-foreground shadow-xl' : 'text-white/20 hover:text-white'
                                )}
                                onClick={() => settings.setTheme('dark')}
                            >
                                <Moon className="w-4 h-4" /> {t.settings.dark}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Infrastructure Hub */}
            <div className="glass-card p-10 border-white/5 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Cpu className="w-40 h-40" />
                </div>

                <div className="space-y-1">
                    <h3 className="text-xs font-black tracking-[0.2em] uppercase text-primary/60">{t.settings.connection}</h3>
                    <div className="w-12 h-1 bg-primary/20 rounded-full" />
                </div>

                <div className="space-y-8">
                    {/* Default Model Selector */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-lg font-black uppercase italic tracking-tight">{t.settings.defaultModel}</p>
                                <p className="text-sm text-white/30 font-medium italic">{t.settings.defaultModelDesc}</p>
                            </div>
                        </div>
                        <Select value={settings.defaultModel || ''} onValueChange={settings.setDefaultModel}>
                            <SelectTrigger className="w-[240px] h-14 glass rounded-2xl border-white/5 font-bold uppercase tracking-widest text-[10px]">
                                <SelectValue placeholder={t.common.selectModel} />
                            </SelectTrigger>
                            <SelectContent className="glass border-white/10 rounded-2xl">
                                {models.map(m => (
                                    <SelectItem key={m.name} value={m.name} className="py-3 rounded-xl">{m.name}</SelectItem>
                                ))}
                                {models.length === 0 && (
                                    <div className="p-4 text-xs font-bold uppercase tracking-widest text-white/20">{t.ollama.noModels}</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* Ollama Connection URL */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                                <Server className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-lg font-black uppercase italic tracking-tight">{t.settings.ollamaUrl}</p>
                                <p className="text-sm text-white/30 font-medium italic">{t.settings.ollamaUrlDesc}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Input
                                value={ollamaUrl}
                                onChange={e => setOllamaUrl(e.target.value)}
                                className="w-full lg:w-[280px] h-14 glass rounded-2xl border-white/5 font-mono text-xs text-white/40 focus:text-white transition-all"
                            />
                            <Button variant="ghost" className="h-14 px-8 rounded-2xl glass bg-primary/10 border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]" onClick={handleUrlSave}>
                                {t.common.save}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Safety & Data Maintenance */}
            <div className="glass-card p-10 border-white/5 space-y-10 relative overflow-hidden bg-destructive/[0.02]">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Database className="w-40 h-40" />
                </div>

                <div className="space-y-1">
                    <h3 className="text-xs font-black tracking-[0.2em] uppercase text-destructive/60">{t.settings.data}</h3>
                    <div className="w-12 h-1 bg-destructive/20 rounded-full" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-destructive/5 flex items-center justify-center text-destructive/40">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-lg font-black uppercase italic tracking-tight text-destructive/80">{t.settings.resetData}</p>
                            <p className="text-sm text-white/30 font-medium italic">{t.settings.resetDataDesc}</p>
                        </div>
                    </div>
                    <Button variant="destructive" className="h-14 px-10 rounded-2xl bg-destructive hover:bg-destructive shadow-2xl shadow-destructive/20 font-black uppercase italic tracking-tighter" onClick={() => setResetDialog(true)}>
                        {t.common.reset}
                    </Button>
                </div>
            </div>

            {/* Information Hub */}
            <div className="p-10 rounded-[40px] bg-white/[0.01] border border-white/5 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary shadow-2xl relative">
                    <div className="absolute inset-0 opacity-10 blur-2xl rounded-full bg-primary" />
                    <Zap className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-3xl font-black uppercase italic tracking-tighter">LocalPilot <span className="text-primary text-lg align-top opacity-50 italic">v0.1.0</span></h4>
                    <p className="text-white/30 font-medium italic max-w-md mx-auto">{t.settings.about}</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/20">Industrial Build</div>
                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/20 text-primary">Stable Core</div>
                </div>
            </div>
        </div>

        {/* Reset Dialog Confirmation */}
        <Dialog open={resetDialog} onOpenChange={setResetDialog}>
          <DialogContent className="glass border-white/20 max-w-sm rounded-[40px] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Trash2 className="w-6 h-6 text-destructive" /> {t.settings.resetData}
              </DialogTitle>
            </DialogHeader>
            <p className="text-white/60 font-medium italic mb-10 leading-relaxed text-center">{t.settings.resetDataConfirm}</p>
            <DialogFooter className="gap-3">
              <Button variant="ghost" onClick={() => setResetDialog(false)} className="flex-1 h-12 rounded-2xl text-white/40 hover:text-white uppercase font-black text-[10px] tracking-widest">{t.common.cancel}</Button>
              <Button variant="destructive" className="flex-1 h-12 rounded-2xl bg-destructive hover:bg-destructive/80 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-destructive/20" onClick={handleResetData}>{t.common.reset}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
