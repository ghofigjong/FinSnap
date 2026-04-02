import { ScannedLineItem, TransactionCategory, TransactionType } from '@finsnap/shared';

export const PROMPT = `You are a financial document analyzer specialized in extracting transaction information from receipts, bank statements, and invoices.

Analyze the image and extract all financial transactions. For each transaction, provide:
1. description: A brief description of the transaction
2. amount: The monetary amount (positive number)
3. type: Either "expense" or "income"
4. category: One of: food, transportation, utilities, entertainment, shopping, healthcare, education, salary, freelance, investment, gift, other
5. date: The transaction date in ISO format (YYYY-MM-DD). Use today's date if not visible.
6. merchant: The merchant/vendor name if available
7. confidence: A number between 0 and 1 indicating your confidence in the extraction

Rules:
- Extract ALL visible transactions
- If it's a receipt from a store/restaurant, the total is usually an expense
- Bank statement credits are usually income, debits are expenses
- Use context clues to determine the most appropriate category
- Be conservative with confidence scores

Respond ONLY with a valid JSON array of transactions. No other text.`;

interface AIResponse {
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  merchant?: string;
  confidence: number;
}

const VALID_CATEGORIES: TransactionCategory[] = [
  'food', 'transportation', 'utilities', 'entertainment', 'shopping',
  'healthcare', 'education', 'salary', 'freelance', 'investment', 'gift', 'other',
];

export function parseAIResponse(content: string): ScannedLineItem[] {
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid JSON response from AI');

  const items: AIResponse[] = JSON.parse(jsonMatch[0]);

  return items.map((item): ScannedLineItem => ({
    description: item.description || 'Unknown transaction',
    amount: Math.abs(Number(item.amount) || 0),
    type: (item.type === 'income' ? 'income' : 'expense') as TransactionType,
    category: (VALID_CATEGORIES.includes(item.category as TransactionCategory)
      ? item.category
      : 'other') as TransactionCategory,
    date: item.date || new Date().toISOString().split('T')[0],
    merchant: item.merchant,
    confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
  }));
}

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('429');
      if (isRateLimit && attempt < maxRetries) {
        const retryDelay = (attempt + 1) * 15000;
        console.log(`Rate limited. Retrying in ${retryDelay / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      if (isRateLimit) {
        throw new Error('AI service is busy. Please wait a moment and try again.');
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
