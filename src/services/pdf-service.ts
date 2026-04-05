import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using Vite's asset loader
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PDFResult {
  text: string;
  pageCount: number;
  fileName: string;
}

/**
 * Extracts all text from a PDF file.
 * @param file The PDF file object from a file input.
 */
export async function extractTextFromPDF(file: File): Promise<PDFResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    fullText += `--- Sida ${i} ---\n${pageText}\n\n`;
  }

  return {
    text: fullText.trim(),
    pageCount: numPages,
    fileName: file.name
  };
}
