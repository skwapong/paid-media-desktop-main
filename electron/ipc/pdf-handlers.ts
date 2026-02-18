/**
 * IPC handlers for PDF text extraction.
 *
 * Accepts base64-encoded PDF data from the renderer process,
 * decodes it, and uses pdf-parse to extract the text content.
 */

import { IpcMain } from 'electron';
import { IPC_CHANNELS } from '../utils/ipc-types';
import { createRequire } from 'node:module';

let pdfParse: ((buffer: Buffer) => Promise<{ text: string }>) | null = null;
let pdfParseLoaded = false;

// pdf-parse is a CJS module — use createRequire to load it in the ESM context.
async function loadPdfParse(): Promise<typeof pdfParse> {
  if (pdfParseLoaded) return pdfParse;
  pdfParseLoaded = true;
  try {
    const require = createRequire(import.meta.url);
    pdfParse = require('pdf-parse');
    console.log('[PDF] pdf-parse loaded successfully');
    return pdfParse;
  } catch (err) {
    // Fallback: try dynamic import
    try {
      const importFn = new Function('specifier', 'return import(specifier)');
      const mod = await importFn('pdf-parse');
      pdfParse = mod.default || mod;
      console.log('[PDF] pdf-parse loaded via dynamic import');
      return pdfParse;
    } catch {
      console.warn('[PDF] pdf-parse not available. PDF extraction will be disabled.');
      return null;
    }
  }
}

export function setupPdfHandlers(ipcMain: IpcMain): void {
  /**
   * Extract text from a base64-encoded PDF.
   *
   * Expects: base64 string (the raw PDF bytes encoded in base64)
   * Returns: { success: true, text: string } or { success: false, error: string }
   */
  ipcMain.handle(
    IPC_CHANNELS.PDF_EXTRACT,
    async (
      _event,
      base64Data: string
    ): Promise<{ success: boolean; text?: string; error?: string }> => {
      const parser = await loadPdfParse();
      if (!parser) {
        return {
          success: false,
          error: 'PDF extraction is not available. The pdf-parse package is not installed.',
        };
      }

      if (!base64Data || typeof base64Data !== 'string') {
        return { success: false, error: 'No PDF data provided.' };
      }

      try {
        const buffer = Buffer.from(base64Data, 'base64');

        if (buffer.length === 0) {
          return { success: false, error: 'PDF data is empty.' };
        }

        const parsed = await parser(buffer);
        const extractedText = parsed.text?.trim() || '';

        console.log(
          `[PDF] Extracted ${extractedText.length} characters from PDF (${buffer.length} bytes)`
        );

        return { success: true, text: extractedText };
      } catch (error: any) {
        console.error('[PDF] Failed to extract text from PDF:', error);
        return {
          success: false,
          error: error.message || 'Failed to parse PDF file.',
        };
      }
    }
  );
}
