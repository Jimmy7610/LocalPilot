// ──────────────────────────────────────────
// LocalPilot — Top Bar
// ──────────────────────────────────────────

import { useLocation } from 'react-router';
import { Sun, Moon, Globe, Wifi, WifiOff, Loader2, TerminalSquare, X, Info, MessageSquare, FolderKanban, BookTemplate, FileText, Wrench } from 'lucide-react';
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
          <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] p-0 flex flex-col">
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
              <DialogTitle className="text-xl">Välkommen till LocalPilot</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6 text-sm">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">LocalPilot</strong> är ditt personliga, oberoende kontrollcenter för lokal AI. Det drivs isolerat på din egen dators hårdvara (via Ollama), vilket innebär 100% kryptosäker integritet utan moln-servrar.
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
                        <h5 className="font-semibold text-foreground">Chatt & Workspace Engine</h5>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                          Här pratar du med AI:n. Om AI:n skriver kod (t.ex. en webbserver eller ett frontend-projekt), extraherar Workspace-motorn automatiskt denna kod och bygger ihop en riktig mappstruktur på din webb i realtid under <code>Dokument/LocalPilot/Workspace/</code>. Ber du sedan AI:n <em>"starta appen"</em>, så spinner terminalen upp filerna i bakgrunden.
                        </p>
                      </div>
                    </div>

                    {/* Projekt */}
                    <div className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md text-primary shrink-0 h-fit">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">Projekt</h5>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                          Hörnstenen i ditt arbetsflöde. Du kan skapa ett Projekt ("Ny Hemsida") och sedermera knyta samman specifika chattar och uppladdade texter/källkod till detta projekt. AI-motorn bygger då upp ett dedikerat minne så den aldrig glömmer bort kravspecifikationen under tidens gång.
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
                          Spara dina mest potenta prompts. Om du ofta befaller maskineriet i en specifik ton (t.ex. "Skriv detta i professionell svensk stil...") så kan du spara denna hook här som en mall för snabbåtkomst nästa gång.
                        </p>
                      </div>
                    </div>

                    {/* Dokument */}
                    <div className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md text-primary shrink-0 h-fit">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">Dokument</h5>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                          Ladda upp systemkrav, träningsdata eller företagshemligheter som textreferenser (även kallat RAG). Dessa fästs vid dina "Projekt" och fungerar som AI:ns personliga facit som den slår upp information i. Allt bearbetas 100% lokalt i din maskin.
                        </p>
                      </div>
                    </div>

                    {/* Verktyg */}
                    <div className="flex gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                      <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md text-primary shrink-0 h-fit">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">Verktyg & Background Tasks</h5>
                        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                          Terminalhanteraren (som du även når via ikonen uppe i menyraden). Här loggas alla agentiska bakgrundsprocesser som AI:n startat i din dator. Du kan säkert övervaka CPU-körningar, portar, och stänga av dem sekventiellt härifrån vid behov.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="flex justify-between items-end pt-5 border-t border-border mt-6 pb-2">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-mono">
                    LocalPilot v0.1.0-beta<br/>
                    Byggt med React + Tauri
                  </p>
                  <div className="text-[10px] uppercase tracking-widest text-primary/80 font-bold bg-primary/5 px-2.5 py-1.5 rounded border border-primary/20">
                    Skyddad av Antigravity
                  </div>
                </div>
              </div>
            </ScrollArea>
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
