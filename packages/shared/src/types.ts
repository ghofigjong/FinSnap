// User types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Transaction types
export type TransactionType = 'expense' | 'income';

export type TransactionCategory =
  | 'food'
  | 'transportation'
  | 'utilities'
  | 'entertainment'
  | 'shopping'
  | 'healthcare'
  | 'education'
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'gift'
  | 'other';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  merchant: string | null;
  date: string;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  merchant?: string;
  date: string;
  receipt_url?: string;
}

// Budget types
export interface Budget {
  id: string;
  user_id: string;
  category: TransactionCategory;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetInput {
  category: TransactionCategory;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
}

// AI Scan types
export interface ScannedLineItem {
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string;
  merchant?: string;
  confidence: number;
}

export interface ScanResult {
  success: boolean;
  items: ScannedLineItem[];
  raw_text?: string;
  error?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Statistics types
export interface SpendingSummary {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  by_category: Record<TransactionCategory, number>;
  period_start: string;
  period_end: string;
}
