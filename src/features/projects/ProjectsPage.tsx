// ──────────────────────────────────────────
// LocalPilot — Projects Page
// ──────────────────────────────────────────

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Edit3,
  FolderKanban,
  MoreVertical,
  ChevronLeft,
  MessageSquare,
  BookOpen,
  FileText,
  FolderOpen,
  RefreshCw,
  Loader2,
  Search as SearchIcon,
} from 'lucide-react';
import { useT } from '@/i18n';
import { useProjectStore } from '@/store/project-store';
import { useChatStore } from '@/store/chat-store';
import { usePromptStore } from '@/store/prompt-store';
import { useDocumentStore } from '@/store/document-store';
import { useOllamaStore } from '@/store/ollama-store';
import { open } from '@tauri-apps/plugin-dialog';
import { indexWorkspace, type IndexProgress } from '@/services/rag-service';
import { workspaceFileRepo } from '@/services/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Project } from '@/types';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export function ProjectsPage() {
  const t = useT();
  const { projects, loaded, load, createProject, updateProject, deleteProject } = useProjectStore();
  const { models } = useOllamaStore();
  const { chats } = useChatStore();
  const { prompts } = usePromptStore();
  const { documents } = useDocumentStore();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState(PROJECT_COLORS[0]);
  const [formIcon, setFormIcon] = useState('folder');
  const [formModel, setFormModel] = useState('');
  const [formWorkspacePath, setFormWorkspacePath] = useState<string | null>(null);

  const [isIndexing, setIsIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState<IndexProgress | null>(null);
  const [fileCount, setFileCount] = useState<number | null>(null);

  useEffect(() => { if (!loaded) load(); }, [loaded]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Load indexing stats when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      workspaceFileRepo.getByProject(selectedProjectId).then(files => setFileCount(files.length));
    }
  }, [selectedProjectId]);

  const openCreate = () => {
    setEditingProject(null);
    setFormName('');
    setFormDesc('');
    setFormColor(PROJECT_COLORS[0]);
    setFormIcon('folder');
    setFormModel('');
    setFormWorkspacePath(null);
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDesc(project.description);
    setFormColor(project.color);
    setFormIcon(project.icon);
    setFormModel(project.preferredModel);
    setFormWorkspacePath(project.workspacePath);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      if (editingProject) {
        await updateProject({ 
          ...editingProject, 
          name: formName, 
          description: formDesc, 
          color: formColor, 
          icon: formIcon, 
          preferredModel: formModel || models[0]?.name || '',
          workspacePath: formWorkspacePath
        });
        toast.success(t.common.saveSuccess || 'Project updated');
      } else {
        const newProject = await createProject({ 
          name: formName, 
          description: formDesc, 
          color: formColor, 
          icon: formIcon, 
          preferredModel: formModel || models[0]?.name || '',
          workspacePath: formWorkspacePath
        });
        toast.success(t.common.saveSuccess || 'Project created');
        
        // If workspace was linked during creation, start indexing immediately
        if (formWorkspacePath) {
          setSelectedProjectId(newProject.id);
          // Indexing will be handled by the detail view effect or user manual refresh
        }
      }
      setFormOpen(false);
    } catch (err) {
      console.error('Failed to save project:', err);
      toast.error(t.common.error || 'Failed to save project');
    }
  };

  const handleIndex = async () => {
    if (!selectedProject?.workspacePath) return;
    setIsIndexing(true);
    console.log(`Starting index for project ${selectedProject.id} at ${selectedProject.workspacePath}`);
    try {
      await indexWorkspace(selectedProject.id, selectedProject.workspacePath, (progress) => {
        setIndexProgress(progress);
      });
      const files = await workspaceFileRepo.getByProject(selectedProject.id);
      setFileCount(files.length);
      toast.success(t.projects.indexSuccess || 'Indexing complete!');
    } catch (err) {
      console.error('Indexing failed:', err);
      toast.error(`${t.projects.indexingError || 'Indexing failed'}: ${err}`);
    } finally {
      setIsIndexing(false);
      setIndexProgress(null);
    }
  };

  // Get linked items for selected project
  const linkedChats = selectedProject ? chats.filter(c => c.projectId === selectedProject.id) : [];
  const linkedDocs = selectedProject ? documents.filter(d => d.projectId === selectedProject.id) : [];

  if (selectedProject) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 animate-fade-in">
        <Button variant="ghost" size="sm" className="gap-1.5 mb-4" onClick={() => setSelectedProjectId(null)}>
          <ChevronLeft className="w-4 h-4" /> {t.common.back}
        </Button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: selectedProject.color }}>
            {selectedProject.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{selectedProject.name}</h2>
            {selectedProject.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{selectedProject.description}</p>}
          </div>
          <div className="flex gap-1.5 shrink-0">
            {selectedProject.preferredModel && <Badge variant="secondary" className="hidden sm:inline-flex">{selectedProject.preferredModel}</Badge>}
            <Button variant="outline" size="sm" onClick={() => openEdit(selectedProject)}>
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> {t.common.edit}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" /> {t.projects.workspace}
                </h3>
                {selectedProject.workspacePath && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2" 
                    onClick={handleIndex}
                    disabled={isIndexing}
                  >
                    {isIndexing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span className="ml-1.5 text-xs">{t.projects.refreshIndex}</span>
                  </Button>
                )}
              </div>
              {selectedProject.workspacePath ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded truncate border border-border/50">
                    {selectedProject.workspacePath}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <SearchIcon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium">{fileCount ?? 0} {t.projects.workspaceDocs}</span>
                    </div>
                  </div>
                  {isIndexing && indexProgress && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground truncate max-w-[150px]">{indexProgress.currentFile}</span>
                        <span>{indexProgress.processedFiles} / {indexProgress.totalFiles}</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300" 
                          style={{ width: `${(indexProgress.processedFiles / indexProgress.totalFiles) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center border-2 border-dashed border-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">{t.projects.noWorkspace}</p>
                  <Button variant="outline" size="sm" onClick={() => openEdit(selectedProject)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> {t.projects.linkWorkspace}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4" /> {t.projects.linkedChats}
              </h3>
              {linkedChats.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">{t.common.none}</p>
              ) : (
                <div className="space-y-1">
                  {linkedChats.slice(0, 5).map(c => (
                    <div key={c.id} className="text-xs py-1 px-2 hover:bg-muted rounded truncate cursor-default">{c.title}</div>
                  ))}
                  {linkedChats.length > 5 && <div className="text-[10px] text-muted-foreground pl-2">+{linkedChats.length - 5} till...</div>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4" /> {t.projects.linkedDocuments}
              </h3>
              {linkedDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">{t.common.none}</p>
              ) : (
                <div className="space-y-1">
                  {linkedDocs.slice(0, 5).map(d => (
                    <div key={d.id} className="text-xs py-1 px-2 hover:bg-muted rounded truncate cursor-default">{d.title}</div>
                  ))}
                  {linkedDocs.length > 5 && <div className="text-[10px] text-muted-foreground pl-2">+{linkedDocs.length - 5} till...</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{t.projects.title}</h2>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> {t.projects.newProject}
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <h3 className="text-base font-semibold mb-1">{t.projects.noProjects}</h3>
          <p className="text-sm text-muted-foreground">{t.projects.noProjectsHint}</p>
          <Button onClick={openCreate} className="mt-4 gap-1.5" size="sm">
            <Plus className="w-4 h-4" /> {t.projects.newProject}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map(project => (
            <Card
              key={project.id}
              className="cursor-pointer hover:border-primary/30 transition-colors group"
              onClick={() => setSelectedProjectId(project.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: project.color }}>
                    {project.name[0]?.toUpperCase()}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(project); }}>
                        <Edit3 className="w-3 h-3 mr-2" /> {t.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialogId(project.id); }}>
                        <Trash2 className="w-3 h-3 mr-2" /> {t.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="text-sm font-semibold mb-0.5 truncate">{project.name}</h3>
                {project.description && <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">{project.description}</p>}
                
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                  </p>
                  {project.workspacePath && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-primary/5 text-primary border-primary/20">
                      RAG
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-m">
          <DialogHeader>
            <DialogTitle>{editingProject ? t.projects.editProject : t.projects.newProject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block">{t.common.name}</label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. My Awesome Project" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block">{t.common.description}</label>
                <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} className="resize-none" />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium mb-1.5 block">{t.projects.projectColor}</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map(c => (
                  <button
                    key={c}
                    className={cn('w-6 h-6 rounded-full transition-all hover:scale-110', formColor === c && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110')}
                    style={{ backgroundColor: c }}
                    onClick={() => setFormColor(c)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">{t.projects.workspace}</label>
              <div className="flex gap-2">
                <Input value={formWorkspacePath || ''} readOnly placeholder={t.projects.noWorkspace} className="text-xs bg-muted/30" />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="shrink-0"
                  onClick={async () => {
                    try {
                      const selected = await open({ 
                        directory: true, 
                        multiple: false,
                        title: t.projects.linkWorkspace
                      });
                      if (selected && typeof selected === 'string') {
                        setFormWorkspacePath(selected);
                        toast.success(t.projects.workspaceLinked || 'Workspace linked');
                      }
                    } catch (err) {
                      console.error('Failed to open directory:', err);
                      toast.error(t.common.error || 'Opening folder failed. Make sure the app has permissions.');
                    }
                  }}
                >
                  <FolderOpen className="w-4 h-4 mr-1.5" /> {t.common.select}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">{t.projects.preferredModel}</label>
              <Select value={formModel} onValueChange={setFormModel}>
                <SelectTrigger className="h-9"><SelectValue placeholder={t.common.selectModel} /></SelectTrigger>
                <SelectContent>
                  {models.map(m => (
                    <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                  ))}
                  {models.length === 0 && <div className="p-2 text-xs text-muted-foreground">No models found</div>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleSave} className="px-8">{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.projects.deleteProject}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.projects.deleteProjectConfirm}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogId(null)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={() => { if (deleteDialogId) { deleteProject(deleteDialogId); setDeleteDialogId(null); } }}>{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
