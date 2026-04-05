// ──────────────────────────────────────────
// LocalPilot — Top Bar
// ──────────────────────────────────────────

import { useState } from 'react';
import { useLocation } from 'react-router';
import { Sun, Moon, Globe, Wifi, WifiOff, Loader2, TerminalSquare, Info, MessageSquare, FolderKanban, BookTemplate, FileText, Wrench, RefreshCw, RotateCcw } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [restartOpen, setRestartOpen] = useState(false);

  const handleRestart = async () => {
    try {
      // @ts-ignore
      const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;
      if (isTauri) {
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
      } else {
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <header className="flex items-center justify-between h-14 shrink-0 px-6 border-b border-border bg-background/80 backdrop-blur-sm z-20">
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
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button 
              variant={terminalStore.isOpen ? "secondary" : "ghost"} 
              size="icon" 
              className="h-8 w-8 relative"
              onClick={() => terminalStore.setIsOpen(!terminalStore.isOpen)}
            >
              <TerminalSquare className="w-4 h-4" />
              {runningTasks.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-success rounded-full ring-2 ring-background animate-pulse"></span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Terminal & Bakgrundsprocesser</TooltipContent>
        </Tooltip>

        {/* Info / About App */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground hover:text-foreground transition-colors group">
              <Info className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] p-0 flex flex-col">
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
              <DialogTitle className="text-xl">Välkommen till LocalPilot</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6 text-sm">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">LocalPilot</strong> är ditt personliga, oberoende kontrollcenter för lokal AI. Det drivs isolerat på din egen dators hårdvara (via Ollama), vilket innebär 100% integritet – ingen data lämnar någonsin din maskin.
                </p>

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Moduler & Funktioner</h4>
                  <div className="grid gap-3">
                    
                    {/* Chatt */}
                    <div className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md text-primary shrink-0 h-fit">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">Chatt & AI-Arbetsyta</h5>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                          Här pratar du med dina lokala modeller. När AI:n genererar kod eller filer, kan LocalPilot automatiskt synkronisera dessa till din disk under <code>Documents/LocalPilot/Workspace/</code>. Det är här magin händer när du ber AI:n att "bygga en app".
                        </p>
                      </div>
                    </div>

                    {/* Projekt */}
                    <div className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md text-primary shrink-0 h-fit">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">Projekt-isolerat Minne</h5>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                          Genom att gruppera chattar, dokument och promptar i ett Projekt ger du AI:n ett kontextuellt minne. Den kommer ihåg dina kravspecifikationer och tidigare beslut för just det projektet, vilket gör den betydligt smartare över tid.
                        </p>
                      </div>
                    </div>

                    {/* Promptbibliotek */}
                    <div className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md text-primary shrink-0 h-fit">
                        <BookTemplate className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">Promptbibliotek</h5>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                          Återanvänd dina bästa instruktioner. Spara avancerade systemprompts eller mallar som du ofta använder. Detta sparar tid och säkerställer att AI:n ger dig konsekventa resultat i den stil du önskar.
                        </p>
                      </div>
                    </div>

                    {/* Dokument */}
                    <div className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md text-primary shrink-0 h-fit">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">Dokument & Kunskapsbas</h5>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                          Ladda upp PDF:er, textfiler eller källkod för att ge AI:n en kunskapsbas (RAG). AI:n använder dessa filer som referensmaterial för att svara på frågor, sammanfatta eller skriva ny kod baserat på din befintliga arkitektur.
                        </p>
                      </div>
                    </div>

                    {/* Verktyg */}
                    <div className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md text-primary shrink-0 h-fit">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">Terminal & Bakgrundsprocesser</h5>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                          Här kan du köra och övervaka kod direkt i LocalPilot. Terminalhanteraren loggar allt som händer när du startar bakgrundsprocesser (t.ex. en Python-server eller ett Node-skript) och låter dig interagera med dem i realtid.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="flex justify-between items-end pt-5 border-t border-border mt-6 pb-2">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-mono">
                    LocalPilot v0.1.0-beta<br/>
                    Byggd av Jimmy med React + Tauri
                  </p>
                  <div className="text-[10px] uppercase tracking-widest text-primary/80 font-bold bg-primary/5 px-2.5 py-1.5 rounded border border-primary/20">
                    Utvecklad av Jimmy
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Restart Button */}
        <Dialog open={restartOpen} onOpenChange={setRestartOpen}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>{t.settings.restartTooltip}</TooltipContent>
          </Tooltip>
          <DialogContent className="max-w-sm bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <RefreshCw className="w-4 h-4 text-destructive" />
                {t.settings.restartConfirmTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.settings.restartConfirmDesc}
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setRestartOpen(false)}>
                  {t.common.cancel}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={handleRestart}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.settings.restartConfirmBtn}
                </Button>
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
