import { useEffect, useState } from 'react';
import { expenseService } from '../services/expenseService';
import { profileService } from '../services/profileService';
import type { Expense, RecurringFrequency, ExpenseCategory } from '../types/expense';
import type { Profile } from '../types/profile';
import { CATEGORY_COLORS } from '../types/expense';
import ExpenseModal from '../components/ExpenseModal';
import { formatDueDateForDisplay } from '../../utils/dateFormat';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user } = useAuth();

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
    setProfile(profile);
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

  const displayName = profile ? (profile.display_name || user?.email || '') : '';
  const avatarId = profile ? (profile.avatar_id || 'cat') : '';

  return (
    <div className="min-h-screen bg-gray-900">
      <Header displayName={displayName} avatarId={avatarId} onLogout={() => { /* TODO: implement logout */ }} />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Add Button */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Expenses</h1>
              <p className="text-gray-400 mt-1 hidden md:block">Manage your recurring and one-time expenses</p>
            </div>
            {expenses.length > 0 && (
              <button
                onClick={handleAddExpense}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 shadow w-full md:w-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Expense
              </button>
            )}
          </div>
          {/* Show subheading on mobile below the button, if desired */}
          <p className="text-gray-400 mt-2 md:hidden text-sm">Manage your expenses</p>
        </div>

        {/* Modern Card Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No expenses yet</h3>
            <p className="text-gray-400 mb-6">Start tracking your expenses to better manage your budget</p>
            <button
              onClick={handleAddExpense}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
            >
              Add your first expense
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenses.map(exp => (
              <div
                key={exp.id}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors duration-200 border border-gray-700 hover:border-gray-600 shadow-lg"
              >
                {/* Header: Name and Amount */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-white text-lg leading-tight pr-2">{exp.name}</h3>
                  <span className="text-xl font-bold text-green-400 flex-shrink-0">
                    {formatCurrency(exp.amount)}
                  </span>
                </div>

                {/* Category and Recurring Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-600"
                      style={{ backgroundColor: CATEGORY_COLORS[exp.category] }}
                    />
                    <span className="text-gray-300 text-sm capitalize">{exp.category}</span>
                  </div>
                  {exp.is_recurring && (
                    <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full font-medium">
                      {exp.recurring_frequency}
                    </span>
                  )}
                </div>

                {/* Due Date */}
                <div className="mb-4">
                  <p className="text-gray-400 text-sm">Due</p>
                  <p className="text-white font-medium">{formatDueDateForDisplay(exp)}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleEdit(exp)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    disabled={deleting === exp.id}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    disabled={deleting === exp.id}
                  >
                    {deleting === exp.id ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
                    className="w-full sm:w-auto px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg font-medium disabled:opacity-50 transition-colors duration-200"
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