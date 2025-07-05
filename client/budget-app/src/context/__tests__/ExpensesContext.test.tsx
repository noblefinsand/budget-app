import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpensesProvider, useExpenses } from '../ExpensesContext';
import supabase from '../../../utils/supabase';
import {
  mockExpenseCreate,
  mockExpenseUpdate,
  mockGetExpensesResponse,
  mockAddExpenseResponse,
  mockUpdateExpenseResponse,
  mockDeleteExpenseResponse,
  mockExpenseErrorResponse,
  mockAddExpenseErrorResponse,
  mockUpdateExpenseErrorResponse,
  mockDeleteExpenseErrorResponse,
} from '../../test/fixtures';
import { AuthProvider } from '../AuthContext';

// Mock AuthProvider for testing
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

// Test component to access expenses context
function TestComponent() {
  const { 
    expenses, 
    loading, 
    error, 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    refreshExpenses,
    clearError 
  } = useExpenses();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="expenses-count">{expenses.length}</div>
      <button onClick={() => addExpense(mockExpenseCreate)}>Add Expense</button>
      <button onClick={() => updateExpense('1', mockExpenseUpdate)}>Update Expense</button>
      <button onClick={() => deleteExpense('1')}>Delete Expense</button>
      <button onClick={() => refreshExpenses()}>Refresh Expenses</button>
      <button onClick={() => clearError()}>Clear Error</button>
    </div>
  );
}

describe('ExpensesContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('should render with initial state', () => {
    render(
      <MockAuthProvider>
        <ExpensesProvider>
          <TestComponent />
        </ExpensesProvider>
      </MockAuthProvider>
    );
    expect(screen.getByTestId('loading')).toHaveTextContent('true'); // Initially loading
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('expenses-count')).toHaveTextContent('0');
  });

  it.skip('should refresh expenses successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockGetExpensesResponse)
      })
    } as unknown as ReturnType<typeof supabase.from>);
    render(
      <MockAuthProvider>
        <ExpensesProvider>
          <TestComponent />
        </ExpensesProvider>
      </MockAuthProvider>
    );
    screen.getByText('Refresh Expenses').click();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  it.skip('should handle refresh expenses error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockExpenseErrorResponse)
      })
    } as unknown as ReturnType<typeof supabase.from>);
    render(
      <MockAuthProvider>
        <ExpensesProvider>
          <TestComponent />
        </ExpensesProvider>
      </MockAuthProvider>
    );
    screen.getByText('Refresh Expenses').click();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load expenses');
    });
  });

  it.skip('should add expense successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue(mockAddExpenseResponse),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockGetExpensesResponse)
      })
    } as unknown as ReturnType<typeof supabase.from>);
    render(
      <MockAuthProvider>
        <ExpensesProvider>
          <TestComponent />
        </ExpensesProvider>
      </MockAuthProvider>
    );
    screen.getByText('Add Expense').click();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  it.skip('should handle add expense error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue(mockAddExpenseErrorResponse)
    } as unknown as ReturnType<typeof supabase.from>);
    render(
      <MockAuthProvider>
        <ExpensesProvider>
          <TestComponent />
        </ExpensesProvider>
      </MockAuthProvider>
    );
    screen.getByText('Add Expense').click();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to add expense');
    });
  });

  it.skip('should update expense successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockUpdateExpenseResponse)
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockGetExpensesResponse)
      })
    } as unknown as ReturnType<typeof supabase.from>);
    render(
      <MockAuthProvider>
        <ExpensesProvider>
          <TestComponent />
        </ExpensesProvider>
      </MockAuthProvider>
    );
    screen.getByText('Update Expense').click();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  it.skip('should handle update expense error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockUpdateExpenseErrorResponse)
      })
    } as unknown as ReturnType<typeof supabase.from>);
    render(
      <MockAuthProvider>
        <ExpensesProvider>
          <TestComponent />
        </ExpensesProvider>
      </MockAuthProvider>
    );
    screen.getByText('Update Expense').click();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to update expense');
    });
  });

  it.skip('should delete expense successfully', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockDeleteExpenseResponse)
      })
    } as unknown as ReturnType<typeof supabase.from>);
    render(
      <MockAuthProvider>
        <ExpensesProvider>
          <TestComponent />
        </ExpensesProvider>
      </MockAuthProvider>
    );
    screen.getByText('Delete Expense').click();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  it.skip('should handle delete expense error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockDeleteExpenseErrorResponse)
      })
    } as unknown as ReturnType<typeof supabase.from>);
    render(
      <MockAuthProvider>
        <ExpensesProvider>
          <TestComponent />
        </ExpensesProvider>
      </MockAuthProvider>
    );
    screen.getByText('Delete Expense').click();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to delete expense');
    });
  });

  it.skip('should clear error when clearError is called', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockExpenseErrorResponse)
      })
    } as unknown as ReturnType<typeof supabase.from>);
    render(
      <MockAuthProvider>
        <ExpensesProvider>
          <TestComponent />
        </ExpensesProvider>
      </MockAuthProvider>
    );
    // Trigger an error first
    screen.getByText('Refresh Expenses').click();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load expenses');
    });
    // Clear the error
    screen.getByText('Clear Error').click();
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });
}); 