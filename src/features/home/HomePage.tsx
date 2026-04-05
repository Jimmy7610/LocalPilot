// ──────────────────────────────────────────
// LocalPilot — Home Dashboard
// ──────────────────────────────────────────

import { useNavigate } from 'react-router';
import {
  MessageSquare,
  FolderKanban,
  BookOpen,
  FileText,
  Plus,
  ArrowRight,
  Wifi,
  WifiOff,
  Zap,
  Cpu,
  Star,
} from 'lucide-react';
import { useT } from '@/i18n';
import { useChatStore } from '@/store/chat-store';
import { useProjectStore } from '@/store/project-store';
import { usePromptStore } from '@/store/prompt-store';
import { useDocumentStore } from '@/store/document-store';
import { useOllamaStore } from '@/store/ollama-store';
import { useSettingsStore } from '@/store/settings-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function HomePage() {
  const t = useT();
  const navigate = useNavigate();
  const { chats } = useChatStore();
  const { projects } = useProjectStore();
  const { prompts } = usePromptStore();
  const { documents } = useDocumentStore();
  const { connected, models } = useOllamaStore();
  const { defaultModel } = useSettingsStore();

  const recentChats = chats.slice(0, 5);
  const recentProjects = projects.slice(0, 3);
  const favoritePrompts = prompts.filter(p => p.favorite).slice(0, 4);
  const recentDocs = documents.slice(0, 3);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.home.welcome}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{t.home.welcomeSub}</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
          <Zap className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t.home.newChat, icon: MessageSquare, action: () => navigate('/chat'), color: 'text-blue-500' },
          { label: t.home.newProject, icon: FolderKanban, action: () => navigate('/projects'), color: 'text-violet-500' },
          { label: t.home.newPrompt, icon: BookOpen, action: () => navigate('/prompts'), color: 'text-amber-500' },
          { label: t.home.newDocument, icon: FileText, action: () => navigate('/documents'), color: 'text-emerald-500' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-left group"
          >
            <div className={cn('p-2 rounded-lg bg-muted', item.color)}>
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-medium">{item.label}</span>
              <Plus className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity inline ml-1.5" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Recent Chats */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">{t.home.recentChats}</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/chat')}>
              {t.home.viewAll} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentChats.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{t.home.noRecentChats}</p>
            ) : (
              recentChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => { navigate('/chat'); setTimeout(() => useChatStore.getState().setActiveChat(chat.id), 50); }}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                  {chat.pinned && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Ollama Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{t.home.ollamaStatus}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {connected ? (
                <div className="flex items-center gap-2 text-success">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-medium">{t.ollama.connected}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">{t.ollama.disconnected}</span>
                </div>
              )}
            </div>

            {connected && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  {t.home.modelsAvailable}: {models.length}
                </p>
                <div className="space-y-1.5">
                  {models.slice(0, 5).map((model) => (
                    <div key={model.name} className="flex items-center gap-2 text-xs">
                      <Cpu className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium truncate">{model.name}</span>
                    </div>
                  ))}
                  {models.length > 5 && (
                    <p className="text-xs text-muted-foreground">+{models.length - 5} more</p>
                  )}
                </div>
              </div>
            )}

            {!connected && (
              <p className="text-xs text-muted-foreground">
                {t.ollama.connectionErrorHint} {useSettingsStore.getState().ollamaBaseUrl}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">{t.home.recentProjects}</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/projects')}>
              {t.home.viewAll} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t.home.noRecentProjects}</p>
            ) : (
              recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate('/projects')}
                  className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                  <span className="text-sm font-medium truncate">{project.name}</span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Favorite Prompts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">{t.home.favoritePrompts}</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/prompts')}>
              {t.home.viewAll} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {favoritePrompts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t.home.noFavoritePrompts}</p>
            ) : (
              favoritePrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => navigate('/prompts')}
                  className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="text-sm font-medium truncate">{prompt.title}</span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Documents Snapshot */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">{t.home.documentsSnapshot}</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/documents')}>
              {t.home.viewAll} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {recentDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t.home.noDocuments}</p>
            ) : (
              recentDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => navigate('/documents')}
                  className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
