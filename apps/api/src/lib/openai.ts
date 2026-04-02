import OpenAI from 'openai';
import { ScannedLineItem } from '@finsnap/shared';
import { parseAIResponse, withRetry, PROMPT } from './scannerUtils';

export async function analyzeWithOpenAI(base64Image: string, apiKey: string): Promise<ScannedLineItem[]> {
  const client = new OpenAI({ apiKey });

  const response = await withRetry(() =>
    client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'high' },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from OpenAI');

  return parseAIResponse(content);
}
