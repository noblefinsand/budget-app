import { vi } from 'vitest';
import type { Expense, ExpenseCreate, ExpenseUpdate } from '../../types/expense';

// Mock expense data
export const mockExpense: Expense = {
  id: '1',
  user_id: 'user123',
  name: 'Test expense',
  amount: 50.00,
  due_date: '2024-01-15',
  recurring_pattern: null,
  category: 'food',
  is_recurring: false,
  recurring_frequency: null,
  status: 'pending',
  notes: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
};

export const mockExpenseCreate: ExpenseCreate = {
  name: 'Test expense',
  amount: 50.00,
  due_date: '2024-01-15',
  category: 'food',
  is_recurring: false
};

export const mockExpenseUpdate: ExpenseUpdate = {
  amount: 75.00,
  notes: 'Updated notes'
};

export const mockExpenses: Expense[] = [
  mockExpense,
  {
    ...mockExpense,
    id: '2',
    name: 'Second expense',
    amount: 25.00,
    category: 'transportation'
  },
  {
    ...mockExpense,
    id: '3',
    name: 'Recurring expense',
    amount: 100.00,
    category: 'housing',
    is_recurring: true,
    recurring_frequency: 'monthly'
  }
];

// Mock service responses
export const mockExpenseService = {
  getExpenses: vi.fn(),
  addExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
};

// Mock successful responses
export const mockGetExpensesResponse = {
  data: mockExpenses,
  error: null
};

export const mockAddExpenseResponse = {
  data: [mockExpense],
  error: null
};

export const mockUpdateExpenseResponse = {
  data: [{ ...mockExpense, amount: 75.00 }],
  error: null
};

export const mockDeleteExpenseResponse = {
  data: null,
  error: null
};

// Mock error responses
export const mockExpenseErrorResponse = {
  data: null,
  error: { message: 'Database error' }
};

export const mockAddExpenseErrorResponse = {
  data: null,
  error: { message: 'Insert failed' }
};

export const mockUpdateExpenseErrorResponse = {
  data: null,
  error: { message: 'Update failed' }
};

export const mockDeleteExpenseErrorResponse = {
  data: null,
  error: { message: 'Delete failed' }
}; 