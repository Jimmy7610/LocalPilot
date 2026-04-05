// ──────────────────────────────────────────
// LocalPilot — Chat Page
// ──────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Star,
  Pin,
  MoreVertical,
  Send,
  Square,
  MessageSquare,
  Copy,
  Check,
  Settings2,
  Loader2,
  Play,
  TerminalSquare
} from 'lucide-react';
import { useT } from '@/i18n';
import { useChatStore } from '@/store/chat-store';
import { useOllamaStore } from '@/store/ollama-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTerminalStore } from '@/store/terminal-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatPage() {
  const t = useT();
  const { chats, activeChatId, messages, generating, loaded } = useChatStore();
  const store = useChatStore();
  const { models, connected } = useOllamaStore();
  const { defaultModel } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [renameDialog, setRenameDialog] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const chatMessages = activeChatId ? messages[activeChatId] || [] : [];

  // Load chats on mount
  useEffect(() => {
    if (!loaded) store.load();
  }, [loaded]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChatId) store.loadMessages(activeChatId);
  }, [activeChatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, chatMessages[chatMessages.length - 1]?.content]);

  // Filter chats
  const filteredChats = chats.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedChats = filteredChats.filter(c => c.pinned);
  const regularChats = filteredChats.filter(c => !c.pinned);

  const handleNewChat = async () => {
    const model = defaultModel || models[0]?.name || '';
    await store.createChat(model);
  };

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !activeChatId || generating) return;
    const model = activeChat?.model || defaultModel || models[0]?.name || '';
    if (!model) return;
    const msg = inputValue;
    setInputValue('');
    await store.sendMessage(activeChatId, msg, model);
  }, [inputValue, activeChatId, generating, activeChat, defaultModel, models]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full">
      {/* Chat Sidebar */}
      <div className="w-72 border-r border-border flex flex-col bg-card/50">
        <div className="p-3 space-y-2">
          <Button onClick={handleNewChat} className="w-full gap-2" size="sm">
            <Plus className="w-4 h-4" /> {t.chat.newChat}
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={t.chat.searchChats}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-2 pb-2 space-y-0.5">
            {pinnedChats.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1.5">{t.chat.pinned}</p>
                {pinnedChats.map(chat => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeChatId}
                    onClick={() => store.setActiveChat(chat.id)}
                    onRename={() => { setRenameValue(chat.title); setRenameDialog(chat.id); }}
                    onDelete={() => setDeleteDialog(chat.id)}
                    onTogglePin={() => store.togglePin(chat.id)}
                    t={t}
                  />
                ))}
                <Separator className="my-1.5" />
              </>
            )}
            {regularChats.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onClick={() => store.setActiveChat(chat.id)}
                onRename={() => { setRenameValue(chat.title); setRenameDialog(chat.id); }}
                onDelete={() => setDeleteDialog(chat.id)}
                onTogglePin={() => store.togglePin(chat.id)}
                t={t}
              />
            ))}
            {filteredChats.length === 0 && (
              <div className="py-8 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t.chat.noChats}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{t.chat.noChatsHint}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat View */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChatId && activeChat ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-sm font-semibold truncate">{activeChat.title}</h2>
                {activeChat.model && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">{activeChat.model}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Select
                  value={activeChat.model || ''}
                  onValueChange={(val) => store.updateChatModel(activeChatId, val)}
                >
                  <SelectTrigger className="h-7 text-xs w-[140px]">
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
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSettings(!showSettings)}>
                  <Settings2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* System prompt settings panel */}
            {showSettings && (
              <div className="px-4 py-3 border-b border-border bg-muted/30 animate-slide-up">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t.chat.systemPrompt}</label>
                <Textarea
                  value={activeChat.systemPrompt}
                  onChange={e => store.updateSystemPrompt(activeChatId, e.target.value)}
                  placeholder={t.chat.systemPromptPlaceholder}
                  className="text-xs min-h-[60px] resize-none"
                  rows={2}
                />
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="max-w-3xl mx-auto py-4 space-y-4">
                {chatMessages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} t={t} />
                ))}
                {generating && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.chat.thinking}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="max-w-3xl mx-auto flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.chat.typeMessage}
                  className="min-h-[44px] max-h-[200px] resize-none text-sm"
                  rows={1}
                  disabled={!connected}
                />
                {generating ? (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-[44px] w-[44px] shrink-0"
                    onClick={() => store.stopGeneration()}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="h-[44px] w-[44px] shrink-0"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || !connected}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">{t.chat.selectChat}</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">{t.chat.selectChatSub}</p>
              <Button onClick={handleNewChat} className="mt-4 gap-2" size="sm">
                <Plus className="w-4 h-4" /> {t.chat.newChat}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!renameDialog} onOpenChange={() => setRenameDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.chat.renameChat}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && renameDialog) {
                store.renameChat(renameDialog, renameValue);
                setRenameDialog(null);
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(null)}>{t.common.cancel}</Button>
            <Button onClick={() => { if (renameDialog) { store.renameChat(renameDialog, renameValue); setRenameDialog(null); } }}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.chat.deleteChat}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.chat.deleteChatConfirm}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={() => { if (deleteDialog) { store.deleteChat(deleteDialog); setDeleteDialog(null); } }}>{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Chat Item Component ──

function ChatItem({
  chat,
  isActive,
  onClick,
  onRename,
  onDelete,
  onTogglePin,
  t,
}: {
  chat: any;
  isActive: boolean;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  t: any;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-accent' : 'hover:bg-muted'
      )}
      onClick={onClick}
    >
      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{chat.title}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
        </p>
      </div>
      {chat.pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[130px]">
          <DropdownMenuItem onClick={onRename}><Edit3 className="w-3 h-3 mr-2" />{t.common.rename}</DropdownMenuItem>
          <DropdownMenuItem onClick={onTogglePin}>
            <Pin className="w-3 h-3 mr-2" />{chat.pinned ? t.common.unpin : t.common.pin}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-3 h-3 mr-2" />{t.common.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Chat Message Component ──

function ChatMessage({ message, t }: { message: any; t: any }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-xl px-4 py-3 text-sm animate-fade-in',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-background/50 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-2 [&_code]:text-xs [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}
              components={{
                pre: ({ children }) => <PreBlock t={t}>{children}</PreBlock>,
              }}
            >
              {message.content || '...'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Code Block with Copy ──

function PreBlock({ children, t }: { children: React.ReactNode; t: any }) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLPreElement>(null);
  const runCommand = useTerminalStore((s) => s.runCommand);

  const handleCopy = () => {
    const text = ref.current?.textContent || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    const text = ref.current?.textContent || '';
    if (text) {
      runCommand(text);
    }
  };

  return (
    <div className="relative group">
      <pre ref={ref}>{children}</pre>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleRun}
          title="Run in Background"
          className="p-1.5 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-primary transition-colors"
        >
          <Play className="w-3 h-3" />
        </button>
        <button
          onClick={handleCopy}
          title="Copy code"
          className="p-1.5 rounded-md bg-background/80 border border-border transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />}
        </button>
      </div>
    </div>
  );
}
