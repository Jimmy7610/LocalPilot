// ──────────────────────────────────────────
// LocalPilot — Vision Service
// ──────────────────────────────────────────

import { generate } from './ollama';

/**
 * Generates a descriptive caption/summary for an image using a multimodal model.
 * @param base64 The image data in Base64 format.
 * @param model The multimodal model to use (e.g., 'llava').
 */
export async function describeImage(base64: string, model: string = 'llava:latest'): Promise<string> {
  const prompt = `
    Analyze this image in detail for a searchable knowledge base. 
    1. Identify all visible text (OCR).
    2. Describe all significant objects, diagrams, or UI elements.
    3. Summarize the overall purpose or context if possible.
    
    Format the response as a clear, dense summary string.
  `;

  try {
    const description = await generate(model, prompt, undefined, [base64]);
    return description.trim();
  } catch (err) {
    console.error('Vision analysis failed:', err);
    return `[IMAGE ANALYSIS FAILED]: ${err}`;
  }
}
