export type ExpenseCategory = 'housing' | 'utilities' | 'transportation' | 'food' | 'entertainment' | 'healthcare' | 'insurance' | 'debt' | 'savings' | 'other';

export type ExpenseStatus = 'pending' | 'paid' | 'overdue';

export type RecurringFrequency = 'monthly' | 'bi-weekly' | 'weekly' | 'yearly';

export interface Expense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  category: ExpenseCategory;
  color: string;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  status: ExpenseStatus;
  notes: string | null;
  excluded_from_paycheck: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  name: string;
  amount: number;
  due_date: string;
  category: ExpenseCategory;
  color?: string;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency;
  notes?: string;
  excluded_from_paycheck?: boolean;
}

export interface ExpenseUpdate {
  name?: string;
  amount?: number;
  due_date?: string;
  category?: ExpenseCategory;
  color?: string;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency;
  status?: ExpenseStatus;
  notes?: string;
  excluded_from_paycheck?: boolean;
} 