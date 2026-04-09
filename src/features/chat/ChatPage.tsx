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
  TerminalSquare,
  ChevronDown,
  Terminal,
  Info,
  ImagePlus,
  X,
  ShieldAlert,
  Eye
} from 'lucide-react';
import { useT } from '@/i18n';
import { useChatStore } from '@/store/chat-store';
import { useOllamaStore } from '@/store/ollama-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTerminalStore } from '@/store/terminal-store';
import { useProjectStore } from '@/store/project-store';
import { Button } from '@/components/ui/button';
import { ActionCard } from '@/components/chat/ActionCard';
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
import { toast } from 'sonner';

import { motion, AnimatePresence } from 'framer-motion';

export function ChatPage() {
  const t = useT();
  const { chats, activeChatId, messages, generating, loaded, analyzing } = useChatStore();
  const store = useChatStore();
  const { models, connected } = useOllamaStore();
  const { defaultModel } = useSettingsStore();
  const { projects } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [renameDialog, setRenameDialog] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  // Auto-scroll to bottom safely
  useEffect(() => {
    if (messagesEndRef.current) {
      const viewport = messagesEndRef.current.closest('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    }
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
    const images = [...pendingImages];
    setInputValue('');
    setPendingImages([]);
    await store.sendMessage(activeChatId, msg, model, images);
  }, [inputValue, pendingImages, activeChatId, generating, activeChat, defaultModel, models]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = '';
  };

  const processFiles = async (files: File[]) => {
    if (pendingImages.length + files.length > 5) {
      toast.error(t.chat.tooManyImages);
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          setPendingImages(prev => [...prev, compressedBase64]);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  return (
    <div className="flex h-full w-full overflow-hidden min-h-0 min-w-0 animate-fade-in">
      {/* Chat Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-muted/30 backdrop-blur-md min-h-0 shrink-0">
        <div className="p-4 space-y-3">
          <Button onClick={handleNewChat} className="w-full gap-2 rounded-xl h-10 font-bold shadow-lg shadow-primary/20" size="sm">
            <Plus className="w-4 h-4" /> {t.chat.newChat}
          </Button>
          <div className="relative group">
            <Search className="absolute left-3 top-3 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t.chat.searchChats}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl bg-muted/50 border-border focus:bg-muted transition-all font-medium"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 pb-4 space-y-1">
            {pinnedChats.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 font-bold px-3 py-2">{t.chat.pinned}</p>
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
                <Separator className="my-3 opacity-5" />
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
              <div className="py-12 text-center opacity-40">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">{t.chat.noChats}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat View */}
      <div 
        className="flex-1 flex flex-col min-w-0 min-h-0 relative"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <AnimatePresence>
          {isDragging && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary/50 flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-bounce">
                <ImagePlus className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-4xl font-black uppercase italic tracking-tighter text-primary drop-shadow-2xl">
                {t.chat.dragDrop}
              </h3>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
        {activeChatId && activeChat ? (
          <motion.div 
            key={activeChatId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col min-w-0 min-h-0"
          >
            {/* Chat header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl z-10 w-full shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                    <h2 className="text-sm font-bold truncate tracking-tight">{activeChat.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        {activeChat.model && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">{activeChat.model}</span>
                            {useOllamaStore.getState().isVisionModel(activeChat.model) && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary group/vision">
                                <Eye className="w-2.5 h-2.5" />
                                <span className="text-[8px] font-black uppercase tracking-tighter">{t.chat.visionModel}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <span className="text-[10px] opacity-20">•</span>
                        <Select
                          value={activeChat.projectId || 'none'}
                          onValueChange={(val) => store.updateChatProject(activeChatId, val === 'none' ? null : val)}
                        >
                          <SelectTrigger className="h-4 p-0 bg-transparent border-none w-auto gap-1 focus:ring-0 text-[10px] font-bold text-foreground/40 hover:text-foreground transition-colors">
                            <SelectValue placeholder="No project" />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            <SelectItem value="none" className="text-[10px]">{t.common.none || 'None'}</SelectItem>
                            {projects.map(p => (
                              <SelectItem key={p.id} value={p.id} className="text-[10px]">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span>{p.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={activeChat.model || ''}
                  onValueChange={(val) => store.updateChatModel(activeChatId, val)}
                >
                  <SelectTrigger className="h-9 text-xs w-[160px] rounded-xl bg-muted/50 border-border">
                    <SelectValue placeholder={t.common.selectModel} />
                  </SelectTrigger>
                  <SelectContent className="glass border-border rounded-xl">
                    {models.map(m => (
                      <SelectItem key={m.name} value={m.name} className="rounded-lg">
                        <div className="flex items-center gap-2">
                          {useOllamaStore.getState().isVisionModel(m.name) && <Eye className="w-3.5 h-3.5 text-primary" />}
                          <span>{m.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted transition-all active:scale-90" onClick={() => setShowSettings(!showSettings)}>
                  <Settings2 className={cn("w-4 h-4 transition-colors", showSettings ? "text-primary" : "text-foreground/40")} />
                </Button>
              </div>
            </div>

            {/* System prompt settings panel */}
            <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-primary/5 px-6"
              >
                  <div className="py-4 border-b border-border">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 mb-2 block">{t.chat.systemPrompt}</label>
                    <Textarea
                      value={activeChat.systemPrompt}
                      onChange={e => store.updateSystemPrompt(activeChatId, e.target.value)}
                      placeholder={t.chat.systemPromptPlaceholder}
                      className="text-xs min-h-[80px] rounded-xl bg-muted border-border focus:ring-1 focus:ring-primary/20 transition-all font-medium leading-relaxed"
                      rows={3}
                    />
                  </div>
              </motion.div>
            )}
            </AnimatePresence>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 min-h-0 min-w-0">
              <div className="max-w-6xl mx-auto py-12 space-y-10">
                <AnimatePresence initial={false}>
                {chatMessages.map((msg) => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    t={t} 
                    onImageClick={(img) => setSelectedImage(img)}
                  />
                ))}
                </AnimatePresence>
                
                {analyzing && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 text-primary text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-full bg-primary/5 border border-primary/20 w-fit mx-auto shadow-2xl shadow-primary/10 backdrop-blur-md"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    {t.chat.analyzing}
                  </motion.div>
                )}
                
                {generating && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 text-foreground/20 text-[10px] font-bold uppercase tracking-[0.2em] py-3 px-6 rounded-full bg-muted border border-border w-fit mx-auto transition-all"
                  >
                    <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-foreground/20 animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1 h-1 rounded-full bg-foreground/20 animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1 h-1 rounded-full bg-foreground/20 animate-bounce" />
                    </div>
                    {t.chat.thinking}
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Overlay Box */}
            <div className="p-6 shrink-0 min-w-0 w-full mt-auto relative z-20">
               <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none -z-10" />
               <div className="max-w-6xl mx-auto glass rounded-2xl border-border p-2 flex flex-col shadow-2xl">
                 
                 <AnimatePresence>
                 {pendingImages.length > 0 && (
                   <div className="flex flex-col">
                     {/* Non-Vision Model Warning */}
                     {!useOllamaStore.getState().isVisionModel(activeChat?.model || '') && (
                       <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-3 mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-bold uppercase tracking-widest"
                       >
                         <ShieldAlert className="w-3.5 h-3.5" />
                         <span>{activeChat?.model} supports no vision. Response might be blind.</span>
                       </motion.div>
                     )}

                     <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex gap-2 p-3 overflow-x-auto border-b border-border scrollbar-none"
                     >
                      {pendingImages.map((imgBase64, idx) => (
                        <motion.div 
                         key={idx}
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.8 }}
                         className="relative group/img w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-border shadow-xl"
                        >
                          <img src={`data:image/jpeg;base64,${imgBase64}`} alt="Attachment" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setPendingImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-destructive rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-all shadow-lg backdrop-blur-md"
                          >
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                   </div>
                 )}
                 </AnimatePresence>

                 <div className="flex items-end gap-2 p-1">
                    <label className="shrink-0 cursor-pointer p-3 rounded-xl text-foreground/40 hover:text-foreground hover:bg-muted transition-colors mb-0.5">
                       <ImagePlus className="w-5 h-5" />
                       <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                    <Textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t.chat.typeMessage || 'Type a message...'}
                      className="min-h-[48px] max-h-[250px] resize-none text-sm bg-transparent border-none focus:ring-0 placeholder:text-foreground/20 font-medium py-3 px-2 flex-1"
                      rows={1}
                      disabled={!connected}
                    />
                    <div className="flex flex-col gap-2 p-1">
                        {generating ? (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-[40px] w-[40px] rounded-xl shadow-lg hover:rotate-90 transition-transform duration-300"
                            onClick={() => store.stopGeneration()}
                          >
                            <Square className="w-4 h-4 fill-current" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            className="h-[40px] w-[40px] rounded-xl bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            onClick={handleSend}
                            disabled={!inputValue.trim() || !connected}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                    </div>
                 </div>
               </div>
               <div className="max-w-6xl mx-auto flex justify-between px-4 mt-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/20">Press Enter to send • / to invoke tools</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/20">{connected ? "Connected to local node" : "Node unreachable"}</span>
               </div>
            </div>
          </motion.div>
        ) : (
          /* Empty state */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center p-12"
          >
            <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-[32px] bg-primary/10 flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-2xl shadow-primary/10 animate-pulse">
                    <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight lowercase italic text-foreground/80">{t.chat.selectChat}</h3>
                <p className="text-sm font-medium text-foreground/30 italic mt-2">{t.chat.selectChatSub}</p>
                <Button onClick={handleNewChat} className="mt-8 gap-3 h-12 px-8 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95" size="lg">
                    <Plus className="w-5 h-5" /> {t.chat.newChat}
                </Button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!renameDialog} onOpenChange={() => setRenameDialog(null)}>
        <DialogContent className="glass border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-widest opacity-40">{t.chat.renameChat}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            className="rounded-xl bg-muted border-border font-bold"
            onKeyDown={e => {
              if (e.key === 'Enter' && renameDialog) {
                store.renameChat(renameDialog, renameValue);
                setRenameDialog(null);
              }
            }}
          />
          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setRenameDialog(null)} className="rounded-xl font-bold text-xs">{t.common.cancel}</Button>
            <Button onClick={() => { if (renameDialog) { store.renameChat(renameDialog, renameValue); setRenameDialog(null); } }} className="rounded-xl font-bold text-xs px-6 shadow-lg shadow-primary/20">{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="glass border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-widest text-destructive/80 mb-2">{t.chat.deleteChat}</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium text-foreground/40 italic">{t.chat.deleteChatConfirm}</p>
          <DialogFooter className="mt-6 gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog(null)} className="rounded-xl font-bold text-xs">{t.common.cancel}</Button>
            <Button variant="destructive" onClick={() => { if (deleteDialog) { store.deleteChat(deleteDialog); setDeleteDialog(null); } }} className="rounded-xl font-bold text-xs px-6 shadow-lg shadow-destructive/20">{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none flex items-center justify-center">
          <div className="relative group/lightbox">
            {selectedImage && (
              <img 
                src={`data:image/jpeg;base64,${selectedImage}`} 
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
                alt="Enlarged view" 
              />
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md opacity-0 group-hover/lightbox:opacity-100 transition-opacity"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
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
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'group flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent mb-0.5',
        isActive 
            ? 'bg-primary/15 text-primary border-primary/20 shadow-[inset_0_0_15px_rgba(var(--color-primary),0.05)]' 
            : 'hover:bg-muted/50 text-foreground/50 hover:text-foreground'
      )}
      onClick={onClick}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors", isActive ? "bg-primary/20" : "bg-muted/50")}>
          <MessageSquare className={cn("w-4.5 h-4.5 transition-colors", isActive ? "text-primary" : "opacity-30 group-hover:opacity-100")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm transition-all truncate", isActive ? "font-bold" : "font-medium")}>{chat.title}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mt-0.5">
          {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
        </p>
      </div>
      {chat.pinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0 drop-shadow-[0_0_5px_rgba(var(--color-primary),0.5)]" />}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0 rounded-lg hover:bg-muted"
            onClick={e => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass min-w-[160px] rounded-2xl border-border p-1.5 shadow-2xl">
          <DropdownMenuItem onClick={onRename} className="rounded-xl px-3 py-2 text-xs font-bold gap-2"><Edit3 className="w-3.5 h-3.5 opacity-50" />{t.common.rename}</DropdownMenuItem>
          <DropdownMenuItem onClick={onTogglePin} className="rounded-xl px-3 py-2 text-xs font-bold gap-2">
            <Pin className="w-3.5 h-3.5 opacity-50" />{chat.pinned ? t.common.unpin : t.common.pin}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="opacity-10" />
          <DropdownMenuItem onClick={onDelete} className="rounded-xl px-3 py-2 text-xs font-bold gap-2 text-destructive focus:text-destructive">
            <Trash2 className="w-3.5 h-3.5 opacity-50" />{t.common.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

// ── Chat Message Component ──

function ChatMessage({ 
  message, 
  t, 
  onImageClick 
}: { 
  message: any; 
  t: any; 
  onImageClick?: (img: string) => void 
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  
  const projects = useProjectStore((s) => s.projects || []);
  const chats = useChatStore((s) => s.chats || []);
  const chat = chats.find(c => c.id === message.chatId);
  const project = projects.find(p => p.id === chat?.projectId);
  const workspacePath = project?.workspacePath || undefined;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('group flex gap-4 relative min-w-0', isUser ? 'justify-end pl-12' : 'justify-start pr-12')}
    >
      <div
        className={cn(
          'max-w-[100%] rounded-[24px] px-6 py-5 text-[15px] relative min-w-0 transition-all duration-300 shadow-2xl',
          isUser
            ? 'bg-primary text-primary-foreground shadow-primary/10 rounded-tr-none'
            : 'glass border-border rounded-tl-none font-medium text-foreground/90 shadow-black/40'
        )}
      >
        {message.type === 'terminal_output' ? (
          <TerminalOutput message={message} t={t} />
        ) : isUser ? (
          <div className="flex flex-col gap-3">
             <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
             {message.images && message.images.length > 0 && (
               <div className={cn(
                 "grid gap-2 mt-2",
                 message.images.length === 1 ? "grid-cols-1" : 
                 message.images.length === 2 ? "grid-cols-2" : 
                 "grid-cols-3"
               )}>
                 {message.images.map((img: string, idx: number) => (
                   <div key={idx} className="group/mesh relative rounded-2xl overflow-hidden border border-border shadow-2xl aspect-square bg-muted/50">
                     <img 
                       src={`data:image/jpeg;base64,${img}`} 
                       className="w-full h-full object-cover transition-transform duration-500 group-hover/mesh:scale-110 cursor-zoom-in" 
                       alt={`Attachment ${idx + 1}`} 
                       onClick={() => onImageClick?.(img)}
                     />
                   </div>
                 ))}
               </div>
             )}
          </div>
        ) : message.type === 'action_proposal' ? (
          <ActionCard
            title={message.meta?.title || 'Action Required'}
            description={message.meta?.description || 'The AI wants to perform an action.'}
            code={message.content}
            status={message.meta?.status || 'pending'}
            onApprove={() => {
              if (message.meta?.command) {
                useTerminalStore.getState().runCommand(message.meta.command, { cwd: message.meta.cwd });
                useChatStore.getState().addTerminalMessage(message.chatId, `🚀 Executing: ${message.meta.command}`, { status: 'executing' });
                // Update message status in meta (ideally should be persisted, but for now we update store)
                message.meta.status = 'approved';
              }
            }}
            onReject={() => {
               message.meta.status = 'rejected';
            }}
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-background/50 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-2 [&_code]:text-xs [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}
              components={{
                pre: ({ children }) => <PreBlock t={t} chatId={message.chatId} cwd={workspacePath || undefined}>{children}</PreBlock>,
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const lang = match ? match[1] : '';
                  return <code className={className} data-language={lang} {...props}>{children}</code>;
                }
              }}
            >
              {message.content || '...'}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Copy Full Message Button */}
        <button
          onClick={handleCopy}
          className={cn(
            "absolute -bottom-8 rounded-md p-1 border border-border bg-background/95 text-muted-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:text-foreground",
            isUser ? "right-2" : "left-2"
          )}
          title={t.common.copy || "Copy"}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </motion.div>
  );
}

// ── Code Block with Copy ──

function PreBlock({ children, t, chatId, cwd }: { children: React.ReactNode; t: any; chatId: string; cwd?: string }) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const runCode = useTerminalStore((s) => s.runCode);

  const handleCopy = () => {
    if (!ref.current) return;
    const codeEl = ref.current.querySelector('code');
    const text = codeEl?.textContent || ref.current.textContent || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    if (!ref.current) return;
    
    const codeEl = ref.current.querySelector('code');
    const language = codeEl?.getAttribute('data-language') || 'shell';
    const code = codeEl?.textContent || ref.current.textContent || '';
    
    if (!code.trim()) return;

    runCode(code, language, { chatId, cwd });
    toast.success(`${t.chat.starting || 'Starting'} ${language || 'code'}-block`, {
      description: t.chat.terminalOpenHint || 'Open terminal in toolbar to see output.'
    });
  };

  // Detect if it's a shell command (AI Proposal)
  const codeEl = (children as any)?.props?.children;
  const lang = (children as any)?.props?.className || '';
  const isAction = lang.includes('shell') || lang.includes('bash') || lang.includes('sh') || lang.includes('ps1') || lang.includes('powershell');

  if (isAction) {
    return (
      <div className="my-4 border border-primary/20 rounded-xl overflow-hidden bg-background/40 backdrop-blur-sm group" ref={ref}>
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
              {t.chat.suggestedAction || 'Suggested Action'}
            </span>
          </div>
          <div className="flex gap-1">
            <button onClick={handleRun} className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95">
              <Play className="w-3 h-3 fill-current" />
              {t.chat.runAction || 'Run'}
            </button>
            <button onClick={handleCopy} className="p-1 px-1.5 text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg bg-background/50">
              {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <div className="p-3">
          <pre className="!m-0 !p-0 bg-transparent whitespace-pre-wrap break-words">{children}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group" ref={ref}>
      <pre className="whitespace-pre-wrap break-words">{children}</pre>
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

function TerminalOutput({ message, t }: { message: any; t: any }) {
  const [expanded, setExpanded] = useState(true);
  const status = message.meta?.status || 'completed';
  const isError = status === 'error';

  return (
    <div className="flex flex-col gap-2 my-2 w-full max-w-full">
      <div 
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors",
          isError ? "bg-destructive/5 border-destructive/20 hover:bg-destructive/10" : "bg-success/5 border-success/20 hover:bg-success/10"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isError ? "bg-destructive animate-pulse" : "bg-success")} />
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            {isError ? t.chat.executionFailed || 'Execution Failed' : t.chat.executionSuccess || 'Execution Finished'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {message.meta?.exitCode !== undefined && (
            <span className="text-[9px] font-mono opacity-50 px-1.5 py-0.5 rounded bg-foreground/5 items-center">
              exit: {message.meta.exitCode}
            </span>
          )}
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform opacity-50", !expanded && "-rotate-90")} />
        </div>
      </div>
      
      {expanded && (
        <div className="rounded-lg bg-black/90 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto shadow-2xl border border-white/5">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5 opacity-40">
             <span className="w-2 h-2 rounded-full bg-red-400" />
             <span className="w-2 h-2 rounded-full bg-yellow-400" />
             <span className="w-2 h-2 rounded-full bg-green-400" />
             <span className="ml-2 uppercase tracking-widest text-[8px] font-bold">Terminal Output</span>
          </div>
          <pre className="text-white/90 whitespace-pre-wrap break-all underline-offset-4 selection:bg-primary/30">
            {message.content || '> No output received'}
          </pre>
        </div>
      )}
    </div>
  );
}
