// ──────────────────────────────────────────
// LocalPilot — Tools Configuration
// ──────────────────────────────────────────

import type { ToolDefinition } from '@/types';

export const toolDefinitions: ToolDefinition[] = [
  {
    id: 'summarize',
    titleKey: 'summarize',
    descriptionKey: 'summarizeDesc',
    icon: 'FileText',
    systemPrompt: 'You are a summarization expert. Provide concise, clear summaries that capture the key points.',
    inputPlaceholderKey: 'inputPlaceholder',
  },
  {
    id: 'rewrite',
    titleKey: 'rewrite',
    descriptionKey: 'rewriteDesc',
    icon: 'RefreshCw',
    systemPrompt: 'You are a professional editor. Rewrite the given text to improve clarity, flow, and style while preserving the original meaning.',
    inputPlaceholderKey: 'inputPlaceholder',
  },
  {
    id: 'translate',
    titleKey: 'translate',
    descriptionKey: 'translateDesc',
    icon: 'Languages',
    systemPrompt: 'You are a professional translator. Translate the given text accurately and naturally to the target language specified.',
    inputPlaceholderKey: 'inputPlaceholder',
    hasTargetLanguage: true,
  },
  {
    id: 'explain',
    titleKey: 'explain',
    descriptionKey: 'explainDesc',
    icon: 'Lightbulb',
    systemPrompt: 'You are an expert at explaining complex topics simply. Break down the given text into easy-to-understand language suitable for a general audience.',
    inputPlaceholderKey: 'inputPlaceholder',
  },
  {
    id: 'email',
    titleKey: 'email',
    descriptionKey: 'emailDesc',
    icon: 'Mail',
    systemPrompt: 'You are a professional email writer. Generate a well-structured, professional email based on the brief description provided. Include a subject line.',
    inputPlaceholderKey: 'inputPlaceholder',
  },
  {
    id: 'social',
    titleKey: 'social',
    descriptionKey: 'socialDesc',
    icon: 'Share2',
    systemPrompt: 'You are a social media content expert. Create an engaging, concise social media post based on the given input. Include relevant hashtags if appropriate.',
    inputPlaceholderKey: 'inputPlaceholder',
  },
  {
    id: 'cleanup',
    titleKey: 'cleanup',
    descriptionKey: 'cleanupDesc',
    icon: 'Eraser',
    systemPrompt: 'You are an expert at organizing notes. Clean up, structure, and clarify the given rough notes while preserving all important information.',
    inputPlaceholderKey: 'inputPlaceholder',
  },
];
