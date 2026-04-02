import { ScannedLineItem } from '@finsnap/shared';
import { analyzeWithGemini } from './gemini';
import { analyzeWithOpenAI } from './openai';
import { analyzeWithOCR } from './ocr';

export type ScanProvider = 'gemini' | 'openai' | 'ocr';

export async function analyzeImage(
  base64Image: string,
  provider: ScanProvider,
  apiKey: string,
  geminiModel?: string
): Promise<ScannedLineItem[]> {
  switch (provider) {
    case 'gemini':
      if (!apiKey) throw new Error('Gemini API key is required. Configure it in AI Settings.');
      return analyzeWithGemini(base64Image, apiKey, geminiModel);

    case 'openai':
      if (!apiKey) throw new Error('OpenAI API key is required. Configure it in AI Settings.');
      return analyzeWithOpenAI(base64Image, apiKey);

    case 'ocr':
      return analyzeWithOCR(base64Image);

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
