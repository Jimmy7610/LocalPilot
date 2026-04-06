// ──────────────────────────────────────────
// LocalPilot — App Layout Shell
// ──────────────────────────────────────────

import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TerminalPanel } from '@/components/TerminalPanel';

export function AppLayout() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative flex h-screen w-screen overflow-hidden bg-background text-foreground min-h-0">
        {/* Layer 0: Background Effects */}
        <div className="absolute inset-0 bg-vignette opacity-50 z-0" />
        
        {/* Layer 1: Navigation */}
        <Sidebar />
        
        {/* Layer 2: Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 p-3 pl-0 z-10">
          <div className="flex flex-col flex-1 min-h-0 min-w-0 glass-card relative border-border/50">
            <TopBar />
            <main className="flex-1 flex flex-col min-h-0 min-w-0 relative">
              <Outlet />
            </main>
          </div>
        </div>

        {/* Layer 3: Terminal */}
        <TerminalPanel />
      </div>
    </TooltipProvider>
  );
}
