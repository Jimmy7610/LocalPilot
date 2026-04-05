import { useEffect, useRef, useState } from 'react';
import { TerminalSquare, X, Play, Square, Settings2, Trash2, ChevronRight, Command as IconCommand } from 'lucide-react';
import { useTerminalStore } from '@/store/terminal-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function TerminalPanel() {
  const store = useTerminalStore();
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { tasks, isOpen } = store;

  // Keep active tab relevant
  useEffect(() => {
    if (tasks.length > 0 && !activeTabId) {
      setActiveTabId(tasks[0].id);
    } else if (tasks.length === 0) {
      setActiveTabId(null);
    }
  }, [tasks.length, activeTabId]);

  // Auto-scroll the log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tasks.map(t => t.output).join('')]);

  if (!isOpen) return null;

  const activeTask = tasks.find(t => t.id === activeTabId);

  const handleSend = () => {
    if (!activeTask || !inputVal.trim()) return;
    store.sendInput(activeTask.id, inputVal);
    setInputVal('');
  };

  return (
    <div className="fixed bottom-6 left-[calc(14rem+1.5rem)] right-6 h-[400px] bg-card/75 backdrop-blur-2xl border border-border/40 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 flex flex-col pointer-events-auto animate-slide-up rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 rounded-md text-primary">
            <TerminalSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-foreground/90">Terminal Manager</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground font-medium">Bakgrundsprocesser</span>
              {tasks.filter(t => t.status === 'running').length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 bg-success rounded-full animate-pulse" />
                  <span className="text-[10px] text-success font-medium">Aktiv</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50" 
                onClick={() => store.clearTasks()}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rensa historik</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6 mx-1 opacity-20" />
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive group" 
            onClick={() => store.setIsOpen(false)}
          >
            <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Task List (Sidebar) */}
        <div className="w-72 border-r border-border/40 flex flex-col bg-muted/10">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1.5">
              {tasks.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                  <IconCommand className="w-8 h-8 mb-2" />
                  <p className="text-[11px] font-medium">Inga aktiva processer</p>
                </div>
              ) : (
                tasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => setActiveTabId(task.id)}
                    className={cn(
                      "group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200",
                      activeTabId === task.id 
                        ? 'bg-primary/10 border-primary/20 text-primary ring-1 ring-primary/10' 
                        : 'bg-transparent border-transparent hover:bg-muted/40 hover:border-border/60 text-muted-foreground'
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-md transition-colors",
                      activeTabId === task.id ? 'bg-primary/20' : 'bg-muted/50 group-hover:bg-muted'
                    )}>
                      <IconCommand className="w-3.5 h-3.5" />
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <p className={cn(
                        "text-[11px] font-mono leading-none truncate mb-1",
                        activeTabId === task.id ? 'text-primary' : 'text-foreground/70'
                      )}>
                        {task.command}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "w-1 h-1 rounded-full",
                          task.status === 'running' ? 'bg-success animate-pulse' : 'bg-muted-foreground/40'
                        )} />
                        <span className="text-[10px] font-medium opacity-60">
                          {task.status === 'running' ? 'Körs' : task.status === 'error' ? 'Avbruten' : 'Klar'}
                        </span>
                      </div>
                    </div>
                    
                    {activeTabId === task.id && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Task Detail (Logs & Input) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#070708]/90 relative overflow-hidden group/terminal">
          {/* Terminal Scanline/Glow Effect */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary/5 to-transparent opacity-10" />
          
          {activeTask ? (
            <>
              {/* Output Log */}
              <ScrollArea className="flex-1">
                <div 
                  ref={scrollRef}
                  className="p-6 font-mono text-[11px] whitespace-pre-wrap break-words leading-relaxed text-blue-100/90 [text-shadow:0_0_10px_rgb(59,130,246,0.2)]"
                >
                  {activeTask.output || (
                    <span className="text-muted-foreground/30 italic select-none">Väntar på loggdata...</span>
                  )}
                  {activeTask.status === 'running' && (
                    <span className="inline-block w-1.5 h-3 bg-primary/50 ml-1 animate-pulse align-middle" />
                  )}
                </div>
              </ScrollArea>

              {/* Input & Controls */}
              <div className="mt-auto border-t border-white/5 p-3 flex items-center gap-3 bg-black/40 backdrop-blur-md">
                <div className="flex-1 relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-2 pointer-events-none">
                    <span className="text-primary font-bold text-xs">❯</span>
                  </div>
                  <Input
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={activeTask.status === 'running' ? "Skriv kommando..." : "Processen har avslutats"}
                    disabled={activeTask.status !== 'running'}
                    className="h-9 pl-8 pr-12 bg-white/5 border-white/10 text-xs font-mono focus-visible:ring-primary/20 shadow-none text-blue-50/90 placeholder:text-muted-foreground/40 rounded-lg"
                  />
                  <div className="absolute right-3">
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-50">
                      ENTER
                    </kbd>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Separator orientation="vertical" className="h-6 bg-white/10" />
                  {activeTask.status === 'running' ? (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-9 text-xs font-semibold gap-2 px-4 shadow-lg shadow-destructive/10" 
                      onClick={() => store.terminateTask(activeTask.id)}
                    >
                      <Square className="w-3 h-3 fill-current" /> Stoppa
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="h-9 text-xs gap-2 px-4 border-white/10 bg-white/5 text-muted-foreground cursor-default" disabled>
                      <Square className="w-3 h-3 opacity-30" /> Avslutad
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mb-4 border border-border/20">
                <TerminalSquare className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h4 className="text-sm font-semibold text-foreground/80 mb-1">Ingen vald process</h4>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                Välj en körning i listan till vänster för att se dess loggar och interagera med terminalen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
