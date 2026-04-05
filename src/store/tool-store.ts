import { create } from 'zustand';
import type { ToolDefinition } from '@/types';
import { toolRepo } from '@/services/storage';
import { toolDefinitions as builtInTools } from '@/features/tools/tools-config';
import { v4 as uuidv4 } from 'uuid';

interface ToolState {
  tools: ToolDefinition[];
  loaded: boolean;
  load: () => Promise<void>;
  addTool: (tool: Omit<ToolDefinition, 'id' | 'isCustom'>) => Promise<void>;
  updateTool: (tool: ToolDefinition) => Promise<void>;
  deleteTool: (id: string) => Promise<void>;
}

export const useToolStore = create<ToolState>((set, get) => ({
  tools: builtInTools,
  loaded: false,

  load: async () => {
    const customTools = await toolRepo.getAll();
    set({ 
      tools: [...builtInTools, ...customTools],
      loaded: true 
    });
  },

  addTool: async (toolData) => {
    const newTool: ToolDefinition = {
      ...toolData,
      id: uuidv4(),
      isCustom: true,
    };
    await toolRepo.create(newTool);
    set({ tools: [...get().tools, newTool] });
  },

  updateTool: async (tool) => {
    if (!tool.isCustom) return;
    await toolRepo.update(tool);
    set({
      tools: get().tools.map(t => t.id === tool.id ? tool : t)
    });
  },

  deleteTool: async (id) => {
    await toolRepo.delete(id);
    set({
      tools: get().tools.filter(t => t.id !== id)
    });
  },
}));
