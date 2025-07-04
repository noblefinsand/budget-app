export type ExpenseCategory = 'housing' | 'utilities' | 'transportation' | 'food' | 'entertainment' | 'healthcare' | 'insurance' | 'debt' | 'savings' | 'other';

export type ExpenseStatus = 'pending' | 'paid' | 'overdue';

export type RecurringFrequency = 'monthly' | 'bi-weekly' | 'weekly' | 'yearly';

// Category color mapping
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  housing: '#3B82F6',      // Blue
  utilities: '#EF4444',    // Red
  transportation: '#10B981', // Green
  food: '#F59E0B',         // Yellow
  entertainment: '#8B5CF6', // Purple
  healthcare: '#06B6D4',   // Cyan
  insurance: '#EC4899',    // Pink
  debt: '#F97316',         // Orange
  savings: '#84CC16',      // Lime
  other: '#6B7280'         // Gray
};

export interface Expense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  recurring_pattern: string | null;
  category: ExpenseCategory;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  status: ExpenseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  name: string;
  amount: number;
  due_date: string;
  recurring_pattern?: string | null;
  category: ExpenseCategory;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency;
  notes?: string;
}

export interface ExpenseUpdate {
  name?: string;
  amount?: number;
  due_date?: string;
  recurring_pattern?: string | null;
  category?: ExpenseCategory;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency;
  status?: ExpenseStatus;
  notes?: string;
} 