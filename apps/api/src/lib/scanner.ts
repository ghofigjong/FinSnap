import { ScannedLineItem } from '@finsnap/shared';
import { analyzeWithGemini } from './gemini';
import { analyzeWithOCR } from './ocr';

export type ScanProvider = 'finsnap' | 'gemini' | 'ocr';

export async function analyzeImage(
  base64Image: string,
  provider: ScanProvider,
  apiKey: string,
  geminiModel?: string
): Promise<ScannedLineItem[]> {
  switch (provider) {
    case 'finsnap': {
      // Use the embedded server-side key — never exposed to the client
      // Always use gemini-2.5-flash-lite for cost efficiency
      const embeddedKey = process.env.GEMINI_API_KEY;
      if (!embeddedKey) throw new Error('FinSnap scanning is temporarily unavailable. Please try again later or use your own API key.');
      return analyzeWithGemini(base64Image, embeddedKey, 'gemini-2.5-flash-lite');
    }

    case 'gemini':
      if (!apiKey) throw new Error('Gemini API key is required. Configure it in AI Settings.');
      return analyzeWithGemini(base64Image, apiKey, geminiModel);

    case 'ocr':
      return analyzeWithOCR(base64Image);

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
