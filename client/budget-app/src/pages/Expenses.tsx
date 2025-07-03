import { useEffect, useState } from 'react';
import { expenseService } from '../services/expenseService';
import { profileService } from '../services/profileService';
import { Link } from 'react-router-dom';
import type { Expense, RecurringFrequency, ExpenseCategory } from '../types/expense';
import { CATEGORY_COLORS } from '../types/expense';
import ExpenseModal from '../components/ExpenseModal';
import { formatDueDateForDisplay } from '../../utils/dateFormat';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
    fetchProfile();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    const data = await expenseService.getExpenses();
    setExpenses(data);
    setLoading(false);
  };

  const fetchProfile = async () => {
    const profile = await profileService.getProfile();
    if (profile?.currency) setCurrency(profile.currency);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const handleSaveExpense = async (expenseData: {
    name: string;
    amount: number;
    due_date: string;
    category: ExpenseCategory;
    is_recurring: boolean;
    recurring_frequency: RecurringFrequency | null;
    recurring_pattern: string | null;
    notes: string;
    excluded_from_paycheck: boolean;
  }) => {
    if (modalMode === 'edit' && editingExpense) {
      const updatedExpense = await expenseService.updateExpense(editingExpense.id, {
        name: expenseData.name,
        amount: expenseData.amount,
        due_date: expenseData.due_date,
        category: expenseData.category,
        is_recurring: expenseData.is_recurring,
        recurring_frequency: expenseData.recurring_frequency || undefined,
        recurring_pattern: expenseData.recurring_pattern,
        notes: expenseData.notes,
        excluded_from_paycheck: expenseData.excluded_from_paycheck
      });
      if (updatedExpense) {
        setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? updatedExpense : exp));
        setShowModal(false);
        setEditingExpense(null);
      } else {
        throw new Error('Failed to update expense.');
      }
    } else {
      const newExpense = await expenseService.addExpense({
        name: expenseData.name,
        amount: expenseData.amount,
        due_date: expenseData.due_date,
        category: expenseData.category,
        is_recurring: expenseData.is_recurring,
        recurring_frequency: expenseData.recurring_frequency || undefined,
        recurring_pattern: expenseData.recurring_pattern,
        notes: expenseData.notes,
        excluded_from_paycheck: expenseData.excluded_from_paycheck
      });
      if (newExpense) {
        setExpenses(prev => [...prev, newExpense]);
        setShowModal(false);
      } else {
        throw new Error('Failed to add expense.');
      }
    }
  };

  const handleAddExpense = () => {
    setModalMode('add');
    setEditingExpense(null);
    setShowModal(true);
  };

  const handleEdit = (expense: Expense) => {
    setModalMode('edit');
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleDelete = async (expenseId: string) => {
    const expense = expenses.find(exp => exp.id === expenseId);
    if (!expense) return;
    
    setDeletingExpense(expense);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingExpense) return;
    
    setDeleting(deletingExpense.id);
    const success = await expenseService.deleteExpense(deletingExpense.id);
    if (success) {
      setExpenses(prev => prev.filter(exp => exp.id !== deletingExpense.id));
    }
    setDeleting(null);
    setDeletingExpense(null);
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setDeletingExpense(null);
    setShowDeleteModal(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-gray-300 hover:text-white mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-white">Expenses</h1>
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-end items-center mb-6">
          <button
            onClick={handleAddExpense}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            + Add Expense
          </button>
        </div>

        {/* Expense List/Table */}
        <div className="bg-gray-800 rounded-xl p-4 shadow">
          {loading ? (
            <div className="text-gray-300">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-gray-400">No expenses yet. Add your first expense!</div>
          ) : (
            <>
              {/* Desktop Table View (md and up) */}
              <div className="hidden md:block">
                <table className="w-full text-left text-gray-200">
                  <thead>
                    <tr>
                      <th className="py-2 px-2">Name</th>
                      <th className="py-2 px-2">Amount</th>
                      <th className="py-2 px-2">Due Date</th>
                      <th className="py-2 px-2">Recurring</th>
                      <th className="py-2 px-2">Category</th>
                      <th className="py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(exp => (
                      <tr key={exp.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                        <td className="py-2 px-2 font-medium">{exp.name}</td>
                        <td className="py-2 px-2">{formatCurrency(exp.amount)}</td>
                        <td className="py-2 px-2">{formatDueDateForDisplay(exp)}</td>
                        <td className="py-2 px-2">{exp.is_recurring ? exp.recurring_frequency : 'No'}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-600"
                              style={{ backgroundColor: CATEGORY_COLORS[exp.category] }}
                            />
                            <span className="capitalize">{exp.category}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(exp)}
                              className="text-blue-500 hover:text-blue-700"
                              disabled={deleting === exp.id}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="text-red-500 hover:text-red-700"
                              disabled={deleting === exp.id}
                            >
                              {deleting === exp.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (below md) */}
              <div className="md:hidden space-y-4">
                {expenses.map(exp => (
                  <div key={exp.id} className="bg-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">{exp.name}</h3>
                        <p className="text-gray-400 text-sm">{formatCurrency(exp.amount)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-600"
                          style={{ backgroundColor: CATEGORY_COLORS[exp.category] }}
                        />
                        <span className="text-gray-400 text-sm capitalize">{exp.category}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p>Due: {formatDueDateForDisplay(exp)}</p>
                      <p>Recurring: {exp.is_recurring ? exp.recurring_frequency : 'No'}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleEdit(exp)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                        disabled={deleting === exp.id}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        disabled={deleting === exp.id}
                      >
                        {deleting === exp.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Unified Expense Modal */}
        <ExpenseModal
          isOpen={showModal}
          onClose={closeModal}
          onSave={handleSaveExpense}
          expense={editingExpense}
          mode={modalMode}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-lg w-full max-w-md md:w-1/2 md:max-w-2xl max-h-[90vh] overflow-y-auto relative">
              {/* Header */}
              <div className="sticky top-0 bg-gray-800 rounded-t-xl px-6 py-4 border-b border-gray-700 flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white">Delete Expense</h3>
              </div>
              {/* Content */}
              <div className="px-6 py-4">
                <p className="text-gray-300 mb-2">
                  Are you sure you want to delete this expense?
                </p>
                <div className="bg-gray-700 rounded-lg p-3 mb-2">
                  <p className="text-white font-medium">{deletingExpense.name}</p>
                  <p className="text-gray-400 text-sm">
                    {formatCurrency(deletingExpense.amount)} • Due {formatDueDateForDisplay(deletingExpense)}
                  </p>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  This action cannot be undone.
                </p>
              </div>
              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-800 rounded-b-xl px-6 py-4 border-t border-gray-700">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    onClick={cancelDelete}
                    className="w-full sm:w-auto px-4 py-2 text-gray-300 hover:text-white font-medium"
                    disabled={deleting === deletingExpense.id}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
                    disabled={deleting === deletingExpense.id}
                  >
                    {deleting === deletingExpense.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}