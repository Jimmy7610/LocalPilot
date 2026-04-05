// ──────────────────────────────────────────
// LocalPilot — Top Bar
// ──────────────────────────────────────────

import { useLocation } from 'react-router';
import { Sun, Moon, Globe, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useT, useLanguage } from '@/i18n';
import { useSettingsStore } from '@/store/settings-store';
import { useOllamaStore } from '@/store/ollama-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
