// ──────────────────────────────────────────
// LocalPilot — Projects Page
// ──────────────────────────────────────────

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useT } from '@/i18n';
import { useProjectStore } from '@/store/project-store';
import { useChatStore } from '@/store/chat-store';
import { usePromptStore } from '@/store/prompt-store';
import { useDocumentStore } from '@/store/document-store';
import { useOllamaStore } from '@/store/ollama-store';
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

const PROJECT_ICONS = [
  'folder', 'code', 'book', 'rocket', 'star',
  'heart', 'zap', 'globe', 'briefcase', 'layers',
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState(PROJECT_COLORS[0]);
  const [formIcon, setFormIcon] = useState('folder');
  const [formModel, setFormModel] = useState('');

  useEffect(() => { if (!loaded) load(); }, [loaded]);

  const openCreate = () => {
    setEditingProject(null);
    setFormName('');
    setFormDesc('');
    setFormColor(PROJECT_COLORS[0]);
    setFormIcon('folder');
    setFormModel('');
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDesc(project.description);
    setFormColor(project.color);
    setFormIcon(project.icon);
    setFormModel(project.preferredModel);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    if (editingProject) {
      await updateProject({ ...editingProject, name: formName, description: formDesc, color: formColor, icon: formIcon, preferredModel: formModel });
    } else {
      await createProject({ name: formName, description: formDesc, color: formColor, icon: formIcon, preferredModel: formModel });
    }
    setFormOpen(false);
  };

  // Get linked items for selected project
  const linkedChats = selectedProject ? chats.filter(c => c.projectId === selectedProject.id) : [];
  const linkedPrompts: any[] = []; // TODO: implement linking via junction table
  const linkedDocs = selectedProject ? documents.filter(d => d.projectId === selectedProject.id) : [];

  if (selectedProject) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Button variant="ghost" size="sm" className="gap-1.5 mb-4" onClick={() => setSelectedProject(null)}>
          <ChevronLeft className="w-4 h-4" /> {t.common.back}
        </Button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: selectedProject.color }}>
            {selectedProject.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{selectedProject.name}</h2>
            {selectedProject.description && <p className="text-sm text-muted-foreground mt-0.5">{selectedProject.description}</p>}
          </div>
          <div className="flex gap-1.5">
            {selectedProject.preferredModel && <Badge variant="secondary">{selectedProject.preferredModel}</Badge>}
            <Button variant="outline" size="sm" onClick={() => openEdit(selectedProject)}>
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> {t.common.edit}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4" /> {t.projects.linkedChats}
              </h3>
              {linkedChats.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">{t.common.none}</p>
              ) : (
                linkedChats.map(c => (
                  <div key={c.id} className="text-xs py-1.5 truncate">{c.title}</div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4" /> {t.projects.linkedPrompts}
              </h3>
              <p className="text-xs text-muted-foreground py-2">{t.common.none}</p>
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
                linkedDocs.map(d => (
                  <div key={d.id} className="text-xs py-1.5 truncate">{d.title}</div>
                ))
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
        <div className="grid grid-cols-3 gap-3">
          {projects.map(project => (
            <Card
              key={project.id}
              className="cursor-pointer hover:border-primary/30 transition-colors group"
              onClick={() => setSelectedProject(project)}
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
                <h3 className="text-sm font-semibold mb-0.5">{project.name}</h3>
                {project.description && <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>}
                <p className="text-[10px] text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? t.projects.editProject : t.projects.newProject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">{t.common.name}</label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{t.common.description}</label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">{t.projects.projectColor}</label>
              <div className="flex gap-1.5">
                {PROJECT_COLORS.map(c => (
                  <button
                    key={c}
                    className={cn('w-7 h-7 rounded-full transition-transform', formColor === c && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110')}
                    style={{ backgroundColor: c }}
                    onClick={() => setFormColor(c)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{t.projects.preferredModel}</label>
              <Select value={formModel} onValueChange={setFormModel}>
                <SelectTrigger><SelectValue placeholder={t.common.selectModel} /></SelectTrigger>
                <SelectContent>
                  {models.map(m => (
                    <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleSave}>{t.common.save}</Button>
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
