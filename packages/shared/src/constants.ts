export const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food & Dining',
  transportation: 'Transportation',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  healthcare: 'Healthcare',
  education: 'Education',
  salary: 'Salary',
  freelance: 'Freelance',
  investment: 'Investment',
  gift: 'Gift',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔',
  transportation: '🚗',
  utilities: '💡',
  entertainment: '🎬',
  shopping: '🛍️',
  healthcare: '🏥',
  education: '📚',
  salary: '💼',
  freelance: '💻',
  investment: '📈',
  gift: '🎁',
  other: '📌',
};

export const EXPENSE_CATEGORIES = [
  'food',
  'transportation',
  'utilities',
  'entertainment',
  'shopping',
  'healthcare',
  'education',
  'other',
] as const;

export const INCOME_CATEGORIES = [
  'salary',
  'freelance',
  'investment',
  'gift',
  'other',
] as const;
