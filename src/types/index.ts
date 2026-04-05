// ──────────────────────────────────────────
// LocalPilot — Core Type Definitions
// ──────────────────────────────────────────

export type Language = 'en' | 'sv';
export type Theme = 'light' | 'dark';

export interface AppSettings {
  language: Language;
  theme: Theme;
  defaultModel: string;
  ollamaBaseUrl: string;
}

// ── Chat ──────────────────────────────────

export interface Chat {
  id: string;
  title: string;
  model: string;
  systemPrompt: string;
  pinned: boolean;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

// ── Project ───────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  preferredModel: string;
  createdAt: string;
  updatedAt: string;
}

// ── Prompt ────────────────────────────────

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Document ──────────────────────────────

export interface Document {
  id: string;
  title: string;
  content: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Ollama ────────────────────────────────

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modifiedAt: string;
  details?: {
    format: string;
    family: string;
    parameterSize: string;
    quantizationLevel: string;
  };
}

export interface OllamaChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
}

export interface OllamaChatResponse {
  model: string;
  message: OllamaChatMessage;
  done: boolean;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

// ── Tool ──────────────────────────────────

export interface ToolDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  systemPrompt: string;
  inputPlaceholderKey: string;
  hasTargetLanguage?: boolean;
}

export interface ToolRun {
  id: string;
  toolId: string;
  input: string;
  output: string;
  model: string;
  createdAt: string;
}
