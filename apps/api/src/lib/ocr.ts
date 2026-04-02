import Tesseract from 'tesseract.js';
import { ScannedLineItem, TransactionCategory, TransactionType } from '@finsnap/shared';

// Currency amount pattern: matches $12.34, 12.34, 1,234.56 etc.
const AMOUNT_PATTERN = /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+\.\d{2})/g;

// Date patterns
const DATE_PATTERNS = [
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,   // MM/DD/YYYY or DD-MM-YYYY
  /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/,           // YYYY-MM-DD
  /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i,
];

// Keywords that suggest income
const INCOME_KEYWORDS = /\b(payment received|credit|deposit|refund|salary|payroll|income|transfer in|direct deposit)\b/i;

// Category keyword mapping
const CATEGORY_KEYWORDS: { pattern: RegExp; category: TransactionCategory }[] = [
  { pattern: /\b(restaurant|cafe|coffee|food|meal|lunch|dinner|breakfast|pizza|burger|sushi|mcdonald|kfc|subway|starbucks|doordash|ubereats|grubhub)\b/i, category: 'food' },
  { pattern: /\b(uber|lyft|taxi|cab|bus|train|metro|fuel|gas station|parking|toll|airline|flight|grab)\b/i, category: 'transportation' },
  { pattern: /\b(electricity|water|internet|phone|mobile|bill|utility|telco|broadband|cable|netflix|spotify|subscription)\b/i, category: 'utilities' },
  { pattern: /\b(cinema|movie|theatre|concert|spotify|netflix|amazon prime|disney|game|entertainment|fun)\b/i, category: 'entertainment' },
  { pattern: /\b(amazon|walmart|target|mall|shop|store|market|purchase|buy|retail|clothing|shoes|fashion)\b/i, category: 'shopping' },
  { pattern: /\b(hospital|clinic|pharmacy|doctor|dental|medicine|health|medical|prescription|optician)\b/i, category: 'healthcare' },
  { pattern: /\b(school|university|college|tuition|course|book|education|training|workshop)\b/i, category: 'education' },
  { pattern: /\b(salary|payroll|wages|income|pay)\b/i, category: 'salary' },
  { pattern: /\b(freelance|invoice|client|project|consulting|contract)\b/i, category: 'freelance' },
];

function detectCategory(text: string): TransactionCategory {
  for (const { pattern, category } of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return category;
  }
  return 'other';
}

function extractDate(text: string): string {
  const today = new Date().toISOString().split('T')[0];
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      try {
        const d = new Date(match[0]);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      } catch {
        // ignore parse errors
      }
    }
  }
  return today;
}

function extractMerchant(lines: string[]): string | undefined {
  // Merchant is usually in the first 3 non-empty lines
  const candidates = lines.slice(0, 5).filter(l => l.trim().length > 2 && !/^\d/.test(l.trim()));
  return candidates[0]?.trim() || undefined;
}

function extractAmounts(text: string): number[] {
  const amounts: number[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(AMOUNT_PATTERN.source, 'g');
  while ((match = pattern.exec(text)) !== null) {
    const val = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0) amounts.push(val);
  }
  return amounts;
}

export async function analyzeWithOCR(base64Image: string): Promise<ScannedLineItem[]> {
  let text: string;

  try {
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const { data } = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: () => {},
    });
    text = data.text;
  } catch (err: any) {
    throw new Error(
      'OCR is not available in cloud deployment. Please use Gemini or OpenAI instead \u2014 go to Profile \u2192 AI Settings to configure.'
    );
  }

  if (!text || text.trim().length < 10) {
    throw new Error('Could not extract readable text from image. Try a clearer photo.');
  }

  const lines = text.split('\n').filter(l => l.trim());
  const fullText = text.toLowerCase();
  const date = extractDate(text);
  const merchant = extractMerchant(lines);
  const category = detectCategory(fullText);
  const isIncome = INCOME_KEYWORDS.test(fullText);
  const type: TransactionType = isIncome ? 'income' : 'expense';
  const amounts = extractAmounts(text);

  if (amounts.length === 0) {
    throw new Error('No monetary amounts found in image. Try a clearer photo or use AI scanning.');
  }

  // Use the largest amount as the primary transaction (likely the total)
  const primaryAmount = Math.max(...amounts);

  const items: ScannedLineItem[] = [{
    description: merchant ? `${merchant} transaction` : 'OCR extracted transaction',
    amount: primaryAmount,
    type,
    category,
    date,
    merchant,
    confidence: 0.5, // OCR is less reliable than AI
  }];

  // If there are multiple distinct amounts, add line items for smaller ones
  const lineAmounts = amounts.filter(a => a !== primaryAmount && a < primaryAmount);
  const uniqueLineAmounts = [...new Set(lineAmounts)].slice(0, 5);

  for (const amount of uniqueLineAmounts) {
    items.push({
      description: 'OCR extracted line item',
      amount,
      type,
      category,
      date,
      merchant,
      confidence: 0.3,
    });
  }

  return items;
}

