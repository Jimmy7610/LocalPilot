import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using Vite's asset loader
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PDFResult {
  text: string;
  pageCount: number;
  fileName: string;
  images?: string[]; // Array of base64 image strings
}

/**
 * Extracts text and images from a PDF file.
 * @param file The PDF file object.
 */
export async function extractTextFromPDF(file: File): Promise<PDFResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullText = '';
  const images: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    fullText += `--- Sida ${i} ---\n${pageText}\n\n`;

    // ── Image Extraction Heuristic ──
    try {
      const ops = await page.getOperatorList();
      for (let j = 0; j < ops.fnArray.length; j++) {
        // OPS.paintImageXObject is usually 85, OPS.paintInlineImageXObject is 82
        if (ops.fnArray[j] === 85 || ops.fnArray[j] === 82) {
           const imgName = ops.argsArray[j][0];
           const img = await page.objs.get(imgName);
           
           if (img && img.data) {
             const canvas = document.createElement('canvas');
             canvas.width = img.width;
             canvas.height = img.height;
             const ctx = canvas.getContext('2d');
             if (ctx) {
               // This is simplified; PDF.js image data interpretation can vary
               const imageData = ctx.createImageData(img.width, img.height);
               imageData.data.set(img.data);
               ctx.putImageData(imageData, 0, 0);
               images.push(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]); // Base64 only
             }
           }
        }
      }
    } catch (err) {
      console.warn(`Could not extract images on page ${i}:`, err);
    }
  }

  return {
    text: fullText.trim(),
    pageCount: numPages,
    fileName: file.name,
    images: images.length > 0 ? images : undefined
  };
}
