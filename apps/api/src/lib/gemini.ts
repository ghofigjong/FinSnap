import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScannedLineItem } from '@finsnap/shared';
import { parseAIResponse, withRetry, PROMPT } from './scannerUtils';

const ALLOWED_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

export async function analyzeWithGemini(base64Image: string, apiKey: string, modelName?: string): Promise<ScannedLineItem[]> {
  const safeModel = ALLOWED_MODELS.includes(modelName || '') ? modelName! : 'gemini-2.0-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: safeModel });

  const result = await withRetry(() =>
    model.generateContent([
      PROMPT,
      { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
    ])
  );

  const content = result.response.text();
  if (!content) throw new Error('No response from Gemini');

  return parseAIResponse(content);
}
