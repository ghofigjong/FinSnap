import OpenAI from 'openai';
import { ScannedLineItem, TransactionCategory, TransactionType } from '@finsnap/shared';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a financial document analyzer specialized in extracting transaction information from receipts, bank statements, and invoices.

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

export async function analyzeReceiptImage(base64Image: string): Promise<ScannedLineItem[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Extract all financial transactions from this image.',
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const items: AIResponse[] = JSON.parse(jsonMatch[0]);

    // Validate and transform the response
    const validCategories: TransactionCategory[] = [
      'food', 'transportation', 'utilities', 'entertainment', 'shopping',
      'healthcare', 'education', 'salary', 'freelance', 'investment', 'gift', 'other'
    ];

    return items.map((item): ScannedLineItem => ({
      description: item.description || 'Unknown transaction',
      amount: Math.abs(Number(item.amount) || 0),
      type: (item.type === 'income' ? 'income' : 'expense') as TransactionType,
      category: (validCategories.includes(item.category as TransactionCategory)
        ? item.category
        : 'other') as TransactionCategory,
      date: item.date || new Date().toISOString().split('T')[0],
      merchant: item.merchant,
      confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
    }));
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}
