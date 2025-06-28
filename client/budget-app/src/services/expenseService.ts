import supabase from '../../utils/supabase';
import type { Expense, ExpenseCreate, ExpenseUpdate } from '../types/expense';

export const expenseService = {
  // Fetch all expenses for the current user
  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
    return data || [];
  },

  // Add a new expense
  async addExpense(expense: ExpenseCreate): Promise<Expense | null> {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }
    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expense, user_id: user.id }])
      .select()
      .single();
    if (error) {
      console.error('Error adding expense:', error);
      return null;
    }
    return data;
  },

  // Update an expense
  async updateExpense(id: string, updates: ExpenseUpdate): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating expense:', error);
      return null;
    }
    return data;
  },

  // Delete an expense
  async deleteExpense(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
    return true;
  }
}; 