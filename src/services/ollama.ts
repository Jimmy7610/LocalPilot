// ──────────────────────────────────────────
// LocalPilot — Ollama Service Layer
// ──────────────────────────────────────────

import type { OllamaModel, OllamaChatMessage } from '@/types';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const CONNECTION_TIMEOUT = 5000;

let baseUrl = DEFAULT_BASE_URL;

export function setOllamaBaseUrl(url: string) {
  baseUrl = url || DEFAULT_BASE_URL;
}

export function getOllamaBaseUrl() {
  return baseUrl;
}

// ── Connection Check ──

export async function checkConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
    const res = await fetch(baseUrl, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

// ── List Models ──

export async function listModels(): Promise<OllamaModel[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
    const res = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m: any) => ({
      name: m.name,
      size: m.size || 0,
      digest: m.digest || '',
      modifiedAt: m.modified_at || '',
      details: m.details
        ? {
            format: m.details.format || '',
            family: m.details.family || '',
            parameterSize: m.details.parameter_size || '',
            quantizationLevel: m.details.quantization_level || '',
          }
        : undefined,
    }));
  } catch {
    return [];
  }
}

// ── Chat (Streaming) ──

export async function chatStream(
  model: string,
  messages: OllamaChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      onError(`Ollama error: ${res.status} - ${errorText}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError('No response stream available');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            onChunk(json.message.content);
          }
          if (json.done) {
            onDone();
            return;
          }
        } catch {
          // skip malformed JSON lines
        }
      }
    }

    onDone();
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    onError(err.message || 'Connection failed');
  }
}

// ── Generate (Streaming) ──

export async function generateStream(
  model: string,
  prompt: string,
  systemPrompt: string | undefined,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const body: any = { model, prompt, stream: true };
    if (systemPrompt) body.system = systemPrompt;

    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      onError(`Ollama error: ${res.status} - ${errorText}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError('No response stream available');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.response) {
            onChunk(json.response);
          }
          if (json.done) {
            onDone();
            return;
          }
        } catch {
          // skip malformed JSON lines
        }
      }
    }

    onDone();
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    onError(err.message || 'Connection failed');
  }
}

// ── Generate (Non-Streaming) ──

export async function generate(
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system: systemPrompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status}`);
  }

  const data = await res.json();
  return data.response || '';
}
