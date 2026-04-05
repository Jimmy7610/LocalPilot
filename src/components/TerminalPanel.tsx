import { useEffect, useRef, useState } from 'react';
import { TerminalSquare, X, Play, Square, Settings2, Trash2 } from 'lucide-react';
import { useTerminalStore } from '@/store/terminal-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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
    <div className="fixed bottom-0 left-72 right-0 h-80 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl z-50 flex flex-col pointer-events-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <TerminalSquare className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Terminal Manager</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => store.clearTasks()} title="Clear History">
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" onClick={() => store.setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Task List (Sidebar) */}
        <div className="w-64 border-r border-border bg-card/30 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2 text-center mt-4">No active tasks</p>
              ) : (
                tasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => setActiveTabId(task.id)}
                    className={`flex items-center justify-between w-full text-left px-2 py-2 rounded-md transition-colors ${activeTabId === task.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-mono truncate">{task.command}</p>
                      <p className="text-[10px] opacity-70">
                        {task.status === 'running' ? 'Running...' : task.status === 'error' ? 'Terminated' : 'Completed'}
                      </p>
                    </div>
                    {task.status === 'running' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Task Detail (Logs & Input) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0d0d0d] text-gray-300">
          {activeTask ? (
            <>
              {/* Output Log */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-xs whitespace-pre-wrap break-words leading-relaxed"
              >
                {activeTask.output || (
                  <span className="text-gray-600 italic">No output yet...</span>
                )}
              </div>

              {/* Input & Controls */}
              <div className="border-t border-white/10 p-2 bg-black/40 flex items-center gap-2">
                {activeTask.status === 'running' ? (
                  <Button variant="destructive" size="sm" className="h-7 text-xs gap-1.5 px-2" onClick={() => store.terminateTask(activeTask.id)}>
                    <Square className="w-3 h-3" /> Stop
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2 opacity-50" disabled>
                    <Square className="w-3 h-3" /> Stopped
                  </Button>
                )}
                <Separator orientation="vertical" className="h-5 bg-white/10" />
                <div className="flex-1 relative flex items-center">
                  <span className="absolute left-2 text-primary font-mono text-xs">{'>'}</span>
                  <Input
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={activeTask.status === 'running' ? "Type input to terminal..." : "Task ended."}
                    disabled={activeTask.status !== 'running'}
                    className="h-7 pl-6 bg-transparent border-none text-xs font-mono focus-visible:ring-0 shadow-none text-gray-200 placeholder:text-gray-600"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-600">
              Select a task to view terminal output
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
