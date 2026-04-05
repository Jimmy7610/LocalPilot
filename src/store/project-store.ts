// ──────────────────────────────────────────
// LocalPilot — Project Store
// ──────────────────────────────────────────

import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Project } from '@/types';
import { projectRepo } from '@/services/storage';

interface ProjectState {
  projects: Project[];
  loaded: boolean;
  load: () => Promise<void>;
  createProject: (data: { name: string; description: string; color: string; icon: string; preferredModel: string; workspacePath: string | null }) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loaded: false,

  load: async () => {
    const projects = await projectRepo.getAll();
    set({ projects, loaded: true });
  },

  createProject: async (data) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: uuid(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await projectRepo.create(project);
    set(s => ({ projects: [project, ...s.projects] }));
    return project;
  },

  updateProject: async (project) => {
    const updated = { ...project, updatedAt: new Date().toISOString() };
    await projectRepo.update(updated);
    set(s => ({ projects: s.projects.map(p => p.id === project.id ? updated : p) }));
  },

  deleteProject: async (id) => {
    await projectRepo.delete(id);
    set(s => ({ projects: s.projects.filter(p => p.id !== id) }));
  },
}));
