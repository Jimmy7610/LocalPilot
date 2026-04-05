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
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold">{t.settings.title}</h2>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{t.settings.appearance}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t.settings.language}</p>
                <p className="text-xs text-muted-foreground">{t.settings.languageDesc}</p>
              </div>
            </div>
            <Select value={settings.language} onValueChange={(val: any) => settings.setLanguage(val)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t.settings.english}</SelectItem>
                <SelectItem value="sv">{t.settings.swedish}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.theme === 'dark' ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">{t.settings.theme}</p>
                <p className="text-xs text-muted-foreground">{t.settings.themeDesc}</p>
              </div>
            </div>
            <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
              <button
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  settings.theme === 'light' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
                onClick={() => settings.setTheme('light')}
              >
                <Sun className="w-3 h-3 inline mr-1" /> {t.settings.light}
              </button>
              <button
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  settings.theme === 'dark' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
                onClick={() => settings.setTheme('dark')}
              >
                <Moon className="w-3 h-3 inline mr-1" /> {t.settings.dark}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{t.settings.connection}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Default Model */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t.settings.defaultModel}</p>
                <p className="text-xs text-muted-foreground">{t.settings.defaultModelDesc}</p>
              </div>
            </div>
            <Select value={settings.defaultModel || ''} onValueChange={settings.setDefaultModel}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder={t.common.selectModel} />
              </SelectTrigger>
              <SelectContent>
                {models.map(m => (
                  <SelectItem key={m.name} value={m.name} className="text-xs">{m.name}</SelectItem>
                ))}
                {models.length === 0 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground">{t.ollama.noModels}</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Ollama URL */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t.settings.ollamaUrl}</p>
                <p className="text-xs text-muted-foreground">{t.settings.ollamaUrlDesc}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Input
                value={ollamaUrl}
                onChange={e => setOllamaUrl(e.target.value)}
                className="w-[200px] h-8 text-xs"
              />
              <Button size="sm" variant="outline" className="h-8" onClick={handleUrlSave}>
                {t.common.save}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Storage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{t.settings.data}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t.settings.storage}</p>
              <p className="text-xs text-muted-foreground">{t.settings.storageDesc}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">{t.settings.resetData}</p>
                <p className="text-xs text-muted-foreground">{t.settings.resetDataDesc}</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setResetDialog(true)}>
              {t.common.reset}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{t.settings.appInfo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">LocalPilot</p>
              <p className="text-xs text-muted-foreground">{t.settings.about}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.settings.version}: 0.1.0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Dialog */}
      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.settings.resetData}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.settings.resetDataConfirm}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog(false)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={handleResetData}>{t.common.reset}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
