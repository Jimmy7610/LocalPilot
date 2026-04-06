// ──────────────────────────────────────────
// LocalPilot — Projects Page 2.0
// ──────────────────────────────────────────

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Edit3,
  FolderKanban,
  MoreVertical,
  ChevronLeft,
  MessageSquare,
  FileText,
  FolderOpen,
  RefreshCw,
  Loader2,
  Search as SearchIcon,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';
import { useT } from '@/i18n';
import { useProjectStore } from '@/store/project-store';
import { useChatStore } from '@/store/chat-store';
import { useDocumentStore } from '@/store/document-store';
import { useOllamaStore } from '@/store/ollama-store';
import { open } from '@tauri-apps/plugin-dialog';
import { indexWorkspace, type IndexProgress } from '@/services/rag-service';
import { workspaceFileRepo } from '@/services/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

export function ProjectsPage() {
  const t = useT();
  const { projects, loaded, load, createProject, updateProject, deleteProject } = useProjectStore();
  const { models, connected } = useOllamaStore();
  const { chats } = useChatStore();
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
        toast.success(t.common.saveSuccess);
      } else {
        const newProject = await createProject({ 
          name: formName, 
          description: formDesc, 
          color: formColor, 
          icon: formIcon, 
          preferredModel: formModel || models[0]?.name || '',
          workspacePath: formWorkspacePath
        });
        toast.success(t.common.saveSuccess);
        if (formWorkspacePath) setSelectedProjectId(newProject.id);
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(t.common.error);
    }
  };

  const handleIndex = async () => {
    if (!selectedProject?.workspacePath) return;
    setIsIndexing(true);
    try {
      await indexWorkspace(selectedProject.id, selectedProject.workspacePath, (progress) => {
        setIndexProgress(progress);
      });
      const files = await workspaceFileRepo.getByProject(selectedProject.id);
      setFileCount(files.length);
      toast.success(t.projects.indexSuccess);
    } catch (err) {
      toast.error(`${t.projects.indexingError}: ${err}`);
    } finally {
      setIsIndexing(false);
      setIndexProgress(null);
    }
  };

  const linkedChats = selectedProject ? chats.filter(c => c.projectId === selectedProject.id) : [];
  const linkedDocs = selectedProject ? documents.filter(d => d.projectId === selectedProject.id) : [];

  if (selectedProject) {
    return (
      <div className="h-full overflow-y-auto px-4 py-4 md:px-8 md:py-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-white/40 hover:text-white" 
              onClick={() => setSelectedProjectId(null)}
            >
              <ChevronLeft className="w-4 h-4" /> {t.common.back}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="glass h-9 px-4 rounded-xl text-xs font-bold" onClick={() => openEdit(selectedProject)}>
                <Edit3 className="w-3.5 h-3.5 mr-2" /> {t.common.edit}
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div 
              className="w-20 h-20 rounded-[28px] glass flex items-center justify-center text-3xl font-black shadow-2xl relative"
              style={{ color: selectedProject.color }}
            >
               <div className="absolute inset-0 opacity-20 blur-2xl rounded-full" style={{ backgroundColor: selectedProject.color }} />
               {selectedProject.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic">{selectedProject.name}</h1>
                {selectedProject.workspacePath && (
                   <Badge className="bg-primary/20 text-primary border-primary/20 text-[10px] tracking-widest uppercase">RAG Enabled</Badge>
                )}
              </div>
              <p className="text-lg text-white/40 font-medium leading-relaxed italic">{selectedProject.description || t.projects.noProjectsHint}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="glass-card p-6 border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FolderOpen className="w-24 h-24" />
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black tracking-widest uppercase text-white/30 flex items-center gap-2">
                      <FolderOpen className="w-3.5 h-3.5" /> {t.projects.workspace}
                    </h3>
                    <p className="text-sm font-mono text-white/60 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 truncate max-w-md">
                      {selectedProject.workspacePath || t.projects.noWorkspace}
                    </p>
                  </div>
                  {selectedProject.workspacePath && (
                    <Button 
                      onClick={handleIndex}
                      disabled={isIndexing}
                      className="glass bg-primary/20 hover:bg-primary/30 border-primary/20 text-primary h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest"
                    >
                      {isIndexing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                      {t.projects.refreshIndex}
                    </Button>
                  )}
                </div>

                {isIndexing && indexProgress && (
                  <div className="space-y-3 animate-fade-in mb-6">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                      <span className="truncate max-w-[250px]">{indexProgress.currentFile}</span>
                      <span className="text-primary">{Math.round((indexProgress.processedFiles / indexProgress.totalFiles) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(indexProgress.processedFiles / indexProgress.totalFiles) * 100}%` }}
                        className="h-full bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.5)]"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
                    <span className="block text-2xl font-black text-white">{fileCount ?? 0}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Analyzed Files</span>
                  </div>
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
                     <div className="flex justify-center mb-1">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", connected ? "bg-success" : "bg-destructive")} />
                     </div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-white/20">Local AI Status</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="glass-card p-6 border-white/10">
                   <h3 className="text-xs font-black tracking-widest uppercase text-white/30 flex items-center gap-2 mb-4">
                    <MessageSquare className="w-3.5 h-3.5" /> {t.projects.linkedChats}
                  </h3>
                  {linkedChats.length === 0 ? (
                    <div className="py-8 text-center text-white/20 italic text-sm">{t.common.none}</div>
                  ) : (
                    <div className="space-y-2">
                       {linkedChats.map(c => (
                         <div key={c.id} className="p-3 rounded-xl hover:bg-white/5 transition-colors group flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                            <span className="text-xs font-medium text-white/70 truncate">{c.title}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
                 <div className="glass-card p-6 border-white/10">
                   <h3 className="text-xs font-black tracking-widest uppercase text-white/30 flex items-center gap-2 mb-4">
                    <FileText className="w-3.5 h-3.5" /> {t.projects.linkedDocuments}
                  </h3>
                  {linkedDocs.length === 0 ? (
                    <div className="py-8 text-center text-white/20 italic text-sm">{t.common.none}</div>
                  ) : (
                    <div className="space-y-2">
                       {linkedDocs.map(d => (
                         <div key={d.id} className="p-3 rounded-xl hover:bg-white/5 transition-colors group flex items-center gap-3">
                            <FileText className="w-3.5 h-3.5 text-white/20 group-hover:text-primary transition-colors" />
                            <span className="text-xs font-medium text-white/70 truncate">{d.title}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="glass-card p-6 border-white/10 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-3">Project Specs</h4>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] text-white/40 font-bold uppercase">AI Model</span>
                          <Badge variant="outline" className="border-white/10 text-white/70">{selectedProject.preferredModel || 'Default'}</Badge>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] text-white/40 font-bold uppercase">Last Sync</span>
                          <span className="text-[11px] text-white/70">{formatDistanceToNow(new Date(selectedProject.updatedAt), { addSuffix: true })}</span>
                       </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between glass border-white/5 h-12 rounded-2xl group">
                         <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            <span className="text-xs font-black uppercase tracking-widest">Management</span>
                         </div>
                         <MoreVertical className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass border-white/10 w-48">
                       <DropdownMenuItem onClick={() => openEdit(selectedProject)} className="gap-2 py-2.5">
                         <Edit3 className="w-4 h-4" /> {t.common.edit}
                       </DropdownMenuItem>
                       <DropdownMenuSeparator className="bg-white/5" />
                       <DropdownMenuItem onClick={() => setDeleteDialogId(selectedProject.id)} className="gap-2 py-2.5 text-destructive focus:text-destructive">
                         <Trash2 className="w-4 h-4" /> {t.common.delete}
                       </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">{t.projects.title}</h1>
            <p className="text-lg text-white/40 font-medium italic">Organize your local AI workspaces.</p>
          </div>
          <Button onClick={openCreate} className="h-14 px-8 rounded-full bg-primary text-primary-foreground font-black uppercase italic tracking-tighter shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-3">
            <Plus className="w-5 h-5" /> {t.projects.newProject}
          </Button>
        </div>

        {projects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center glass-card border-white/10 rounded-[40px] opacity-50"
          >
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
               <FolderKanban className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-2">{t.projects.noProjects}</h3>
            <p className="text-white/40 max-w-sm mb-10">{t.projects.noProjectsHint}</p>
            <Button onClick={openCreate} variant="secondary" className="glass h-12 px-8 rounded-2xl font-black uppercase italic tracking-widest text-xs">
               Initialize First Project <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {projects.map(project => (
              <motion.div 
                key={project.id} 
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group cursor-pointer relative"
                onClick={() => setSelectedProjectId(project.id)}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 blur-3xl rounded-[32px] transition-opacity duration-500"
                  style={{ backgroundColor: project.color }}
                />
                <div className="glass-card border-white/10 rounded-[32px] p-6 hover:border-white/20 transition-all shadow-xl group-hover:shadow-2xl h-full flex flex-col isolation-isolate overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Layers className="w-20 h-20" />
                   </div>
                   
                   <div className="flex items-start justify-between mb-8">
                     <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg"
                        style={{ backgroundColor: `${project.color}20`, color: project.color }}
                     >
                       {project.name[0]?.toUpperCase()}
                     </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-white/20 hover:text-white rounded-xl hover:bg-white/5" 
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-white/10 w-40">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(project); }}>
                            <Edit3 className="w-3.5 h-3.5 mr-2" /> {t.common.edit}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialogId(project.id); }}>
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> {t.common.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                   </div>

                   <div className="flex-1 space-y-2">
                     <h3 className="text-xl font-black tracking-tight uppercase italic truncate">{project.name}</h3>
                     <p className="text-sm text-white/40 font-medium line-clamp-2 italic">{project.description || 'No description provided.'}</p>
                   </div>

                   <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         {project.workspacePath && (
                            <div className="flex items-center gap-1.5 opacity-60">
                               <Shield className="w-3.5 h-3.5 text-primary" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-white">RAG</span>
                            </div>
                         )}
                         <div className="text-[10px] font-black uppercase tracking-widest text-white/20">
                           {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                         </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                   </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="glass border-white/20 max-w-lg rounded-[40px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
                {editingProject ? t.projects.editProject : t.projects.newProject}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">{t.common.name}</label>
                <Input 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                  className="glass h-12 px-5 rounded-2xl border-white/5 focus:border-primary/50 transition-all font-bold"
                  placeholder="e.g. AGENTIC OVERHAUL" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">{t.common.description}</label>
                <Textarea 
                  value={formDesc} 
                  onChange={e => setFormDesc(e.target.value)} 
                  className="glass p-5 rounded-2xl border-white/5 focus:border-primary/50 transition-all min-h-[100px] font-medium italic"
                  placeholder="Brief project mission..." 
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">{t.projects.projectColor}</label>
                <div className="flex flex-wrap gap-3">
                  {PROJECT_COLORS.map(c => (
                    <motion.button
                      key={c}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all', 
                        formColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setFormColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">{t.projects.workspace}</label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input 
                      value={formWorkspacePath || ''} 
                      readOnly 
                      className="glass h-12 pl-5 pr-10 rounded-2xl border-white/5 font-mono text-[10px] text-white/40" 
                      placeholder={t.projects.noWorkspace} 
                    />
                  </div>
                  <Button 
                    variant="secondary" 
                    className="glass border-white/10 px-6 rounded-2xl h-12 hove:bg-white/10"
                    onClick={async () => {
                        const selected = await open({ directory: true, multiple: false });
                        if (selected && typeof selected === 'string') setFormWorkspacePath(selected);
                    }}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" /> {t.common.select}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">{t.projects.preferredModel}</label>
                <Select value={formModel} onValueChange={setFormModel}>
                  <SelectTrigger className="glass h-12 px-5 rounded-2xl border-white/5">
                    <SelectValue placeholder={t.common.selectModel} />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 rounded-2xl">
                    {models.map(m => (
                      <SelectItem key={m.name} value={m.name} className="py-3 rounded-xl">{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-10 flex gap-3">
              <Button variant="ghost" onClick={() => setFormOpen(false)} className="h-14 px-8 rounded-full text-white/40 hover:text-white">{t.common.cancel}</Button>
              <Button onClick={handleSave} className="h-14 px-10 rounded-full bg-primary text-primary-foreground font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20">
                {t.common.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
          <DialogContent className="glass border-white/20 max-w-sm rounded-[40px] p-8">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                 <Trash2 className="w-6 h-6 text-destructive" /> {t.projects.deleteProject}
              </DialogTitle>
            </DialogHeader>
            <p className="text-white/60 font-medium italic mb-8">{t.projects.deleteProjectConfirm}</p>
            <DialogFooter className="gap-3">
              <Button variant="ghost" onClick={() => setDeleteDialogId(null)} className="flex-1 h-12 rounded-2xl text-white/40 hover:text-white uppercase font-black text-[10px] tracking-widest">
                {t.common.cancel}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => { if (deleteDialogId) { deleteProject(deleteDialogId); setDeleteDialogId(null); } }}
                className="flex-1 h-12 rounded-2xl bg-destructive/20 hover:bg-destructive/100 border border-destructive/20 text-destructive hover:text-white font-black uppercase text-[10px] tracking-widest transition-all"
              >
                {t.common.delete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
