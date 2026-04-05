// ──────────────────────────────────────────
// LocalPilot — Top Bar
// ──────────────────────────────────────────

import { useLocation } from 'react-router';
import { Sun, Moon, Globe, Wifi, WifiOff, Loader2, TerminalSquare, X, Info } from 'lucide-react';
import { useT, useLanguage } from '@/i18n';
import { useSettingsStore } from '@/store/settings-store';
import { useOllamaStore } from '@/store/ollama-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTerminalStore } from '@/store/terminal-store';

function usePageTitle(): string {
  const t = useT();
  const location = useLocation();
  const path = location.pathname;

  if (path === '/') return t.nav.home;
  if (path.startsWith('/chat')) return t.nav.chat;
  if (path.startsWith('/projects')) return t.nav.projects;
  if (path.startsWith('/prompts')) return t.nav.prompts;
  if (path.startsWith('/documents')) return t.nav.documents;
  if (path.startsWith('/tools')) return t.nav.tools;
  if (path.startsWith('/settings')) return t.nav.settings;
  return t.app.name;
}

export function TopBar() {
  const t = useT();
  const pageTitle = usePageTitle();
  const { language } = useLanguage();
  const settings = useSettingsStore();
  const { connected, checking } = useOllamaStore();
  const terminalStore = useTerminalStore();
  const runningTasks = terminalStore.tasks.filter(t => t.status === 'running');

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-background/80 backdrop-blur-sm">
      {/* Page title */}
      <h1 className="text-base font-semibold tracking-tight">{pageTitle}</h1>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Ollama status */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              checking
                ? 'bg-muted text-muted-foreground'
                : connected
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
            )}>
              {checking ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : connected ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              <span>{checking ? t.ollama.connecting : connected ? t.ollama.connected : t.ollama.disconnected}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {connected ? t.ollama.connected : `${t.ollama.connectionErrorHint} ${settings.ollamaBaseUrl}`}
          </TooltipContent>
        </Tooltip>

        {/* Active Tasks */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <TerminalSquare className="w-4 h-4" />
              {runningTasks.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-success rounded-full ring-2 ring-background"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <DropdownMenuLabel className="text-xs">Active Background Tasks</DropdownMenuLabel>
            <Separator className="my-1" />
            {runningTasks.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                No active tasks
              </div>
            ) : (
              runningTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-sm">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-mono truncate" title={task.command}>{task.command}</span>
                    <span className="text-[10px] text-muted-foreground">PID: {task.pid || 'starting...'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive shrink-0 hover:bg-destructive/10"
                    onClick={() => terminalStore.terminateTask(task.id)}
                    title="Terminate"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Info / About App */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground hover:text-foreground transition-colors group">
              <Info className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl">Om LocalPilot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm mt-3">
              <p className="text-muted-foreground">
                <strong className="text-foreground">LocalPilot</strong> är ett oberoende, lokalt kontrollcenter för generativ AI, helt och hållet drivet och processat isolerat på din egen dators hårdvara via Ollama. 
              </p>
              
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Premium-Funktioner:</h4>
                <ul className="list-none space-y-3 m-0 p-0 text-muted-foreground">
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span><strong className="text-foreground font-medium">Agentisk Arkitektur:</strong> AI:n kan självständigt exekvera mjukvara direkt på ditt operativsystem och underhålla processer i din inbyggda terminal.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span><strong className="text-foreground font-medium">Fullständig Integritet:</strong> 100% kryptosäkert. Din konversation eller källkod skickas aldrig till internet. Allt stannar i burken.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span><strong className="text-foreground font-medium">Workspace Engine:</strong> Motorn extraherar snabbt koden i den pågående konversationen och bygger automagiskt riktiga mappar (<code>Dokument/LocalPilot</code>).</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span><strong className="text-foreground font-medium">Sammanlänkat Kontext:</strong> Fäst skräddarsydda globala direktiv till projekt så att kontextfönstret minns projektkraven.</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-border">
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-mono">
                  LocalPilot v0.1.0-beta<br/>
                  Byggt med React + Tauri
                </p>
                <div className="text-[10px] uppercase tracking-widest text-primary/80 font-bold">
                  Skyddad av Antigravity
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Model badge */}
        {settings.defaultModel && (
          <Badge variant="secondary" className="text-xs font-medium">
            {settings.defaultModel}
          </Badge>
        )}

        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-medium h-8">
              <Globe className="w-3.5 h-3.5" />
              {language.toUpperCase()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            <DropdownMenuItem onClick={() => settings.setLanguage('en')} className={cn(language === 'en' && 'font-semibold')}>
              {t.settings.english}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => settings.setLanguage('sv')} className={cn(language === 'sv' && 'font-semibold')}>
              {t.settings.swedish}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => settings.setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {settings.theme === 'dark' ? t.settings.light : t.settings.dark}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
