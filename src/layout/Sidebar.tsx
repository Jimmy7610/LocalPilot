// ──────────────────────────────────────────
// LocalPilot — Sidebar Navigation
// ──────────────────────────────────────────

import { NavLink } from 'react-router';
import {
  Home,
  MessageSquare,
  FolderKanban,
  BookOpen,
  FileText,
  Wrench,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Zap,
} from 'lucide-react';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: Home, labelKey: 'home' as const },
  { to: '/chat', icon: MessageSquare, labelKey: 'chat' as const },
  { to: '/projects', icon: FolderKanban, labelKey: 'projects' as const },
  { to: '/prompts', icon: BookOpen, labelKey: 'prompts' as const },
  { to: '/documents', icon: FileText, labelKey: 'documents' as const },
  { to: '/tools', icon: Wrench, labelKey: 'tools' as const },
];

export function Sidebar() {
  const t = useT();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col h-[calc(100vh-24px)] m-3 transition-all duration-300 z-20',
        'glass-card border-border/40',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 h-14 border-b border-white/5', collapsed && 'justify-center px-0')}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 shadow-[0_0_15px_rgba(var(--color-primary),0.3)]">
          <Zap className="w-4.5 h-4.5 text-primary" />
        </div>
        {!collapsed && (
          <span className="font-bold text-sm tracking-tight text-sidebar-foreground uppercase last:text-primary">
            {t.app.name}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1.5 px-2 py-4">
        {navItems.map((item) => {
          const label = t.nav[item.labelKey];
          const Icon = item.icon;

          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5',
                  isActive && 'bg-primary/10 text-primary font-bold shadow-[inset_0_0_10px_rgba(var(--color-primary),0.1)]',
                  collapsed && 'justify-center px-0'
                )
              }
            >
              <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110")} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.to} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="glass border-white/10">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {/* Settings + Collapse */}
      <div className="flex flex-col gap-1.5 px-2 pb-3 border-t border-white/5 pt-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5',
              isActive && 'bg-primary/10 text-primary font-bold',
              collapsed && 'justify-center px-0'
            )
          }
        >
          <Settings className="w-5 h-5 shrink-0 group-hover:rotate-45 transition-transform" />
          {!collapsed && <span>{t.nav.settings}</span>}
        </NavLink>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start gap-3 px-3 rounded-xl text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-white/5',
            collapsed && 'justify-center px-0'
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-widest opacity-60">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
