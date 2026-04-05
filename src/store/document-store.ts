// ──────────────────────────────────────────
// LocalPilot — Document Store
// ──────────────────────────────────────────

import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Document } from '@/types';
import { documentRepo } from '@/services/storage';

interface DocumentState {
  documents: Document[];
  loaded: boolean;
  load: () => Promise<void>;
  createDocument: (data: { title: string; content: string; projectId?: string | null }) => Promise<Document>;
  updateDocument: (doc: Document) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  loaded: false,

  load: async () => {
    const documents = await documentRepo.getAll();
    set({ documents, loaded: true });
  },

  createDocument: async (data) => {
    const now = new Date().toISOString();
    const doc: Document = {
      id: uuid(),
      title: data.title,
      content: data.content,
      projectId: data.projectId || null,
      createdAt: now,
      updatedAt: now,
    };
    await documentRepo.create(doc);
    set(s => ({ documents: [doc, ...s.documents] }));
    return doc;
  },

  updateDocument: async (doc) => {
    const updated = { ...doc, updatedAt: new Date().toISOString() };
    await documentRepo.update(updated);
    set(s => ({ documents: s.documents.map(d => d.id === doc.id ? updated : d) }));
  },

  deleteDocument: async (id) => {
    await documentRepo.delete(id);
    set(s => ({ documents: s.documents.filter(d => d.id !== id) }));
  },
}));
