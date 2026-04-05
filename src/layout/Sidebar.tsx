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
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border', collapsed && 'justify-center px-0')}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Zap className="w-4.5 h-4.5 text-primary" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
            {t.app.name}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 py-3">
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
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
                  collapsed && 'justify-center px-0 py-2.5'
                )
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.to} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {/* Settings + Collapse */}
      <div className="flex flex-col gap-0.5 px-2 pb-3 border-t border-sidebar-border pt-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
              collapsed && 'justify-center px-0 py-2.5'
            )
          }
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>{t.nav.settings}</span>}
        </NavLink>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start gap-3 px-3 text-sidebar-foreground/50 hover:text-sidebar-foreground',
            collapsed && 'justify-center px-0'
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeft className="w-[18px] h-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="w-[18px] h-[18px]" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
