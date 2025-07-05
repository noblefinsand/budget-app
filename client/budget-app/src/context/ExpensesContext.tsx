import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { expenseService } from '../services/expenseService';
import type { Expense, ExpenseCreate, ExpenseUpdate, ExpenseCategory } from '../types/expense';
import { useAuth } from './AuthContext';

interface ExpensesContextType {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  addExpense: (expense: ExpenseCreate) => Promise<boolean>;
  updateExpense: (id: string, updates: ExpenseUpdate) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  refreshExpenses: () => Promise<void>;
  clearError: () => void;
  getExpensesByCategory: (category: ExpenseCategory) => Expense[];
  getRecurringExpenses: () => Expense[];
  getOneTimeExpenses: () => Expense[];
  searchExpenses: (searchTerm: string) => Expense[];
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

interface ExpensesProviderProps {
  children: ReactNode;
}

export const ExpensesProvider = ({ children }: ExpensesProviderProps) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const expensesData = await expenseService.getExpenses();
      setExpenses(expensesData);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: ExpenseCreate): Promise<boolean> => {
    try {
      setError(null);
      const newExpense = await expenseService.addExpense(expense);
      if (newExpense) {
        setExpenses(prev => [...prev, newExpense]);
        return true;
      } else {
        setError('Failed to add expense');
        return false;
      }
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense');
      return false;
    }
  };

  const updateExpense = async (id: string, updates: ExpenseUpdate): Promise<boolean> => {
    try {
      setError(null);
      const updatedExpense = await expenseService.updateExpense(id, updates);
      if (updatedExpense) {
        setExpenses(prev => prev.map(exp => exp.id === id ? updatedExpense : exp));
        return true;
      } else {
        setError('Failed to update expense');
        return false;
      }
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense');
      return false;
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await expenseService.deleteExpense(id);
      if (success) {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
        return true;
      } else {
        setError('Failed to delete expense');
        return false;
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense');
      return false;
    }
  };

  const refreshExpenses = async () => {
    await loadExpenses();
  };

  const clearError = () => {
    setError(null);
  };

  // Utility functions
  const getExpensesByCategory = (category: ExpenseCategory): Expense[] => {
    return expenses.filter(exp => exp.category === category);
  };

  const getRecurringExpenses = (): Expense[] => {
    return expenses.filter(exp => exp.is_recurring);
  };

  const getOneTimeExpenses = (): Expense[] => {
    return expenses.filter(exp => !exp.is_recurring);
  };

  const searchExpenses = (searchTerm: string): Expense[] => {
    if (!searchTerm.trim()) return expenses;
    
    const term = searchTerm.toLowerCase();
    return expenses.filter(exp => 
      exp.name.toLowerCase().includes(term) ||
      (exp.notes && exp.notes.toLowerCase().includes(term))
    );
  };

  useEffect(() => {
    if (user) {
      loadExpenses();
    } else {
      // Clear expenses when user logs out
      setExpenses([]);
      setError(null);
      setLoading(false);
    }
  }, [user]);

  const value: ExpensesContextType = {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses,
    clearError,
    getExpensesByCategory,
    getRecurringExpenses,
    getOneTimeExpenses,
    searchExpenses,
  };

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = (): ExpensesContextType => {
  const context = useContext(ExpensesContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpensesProvider');
  }
  return context;
}; 