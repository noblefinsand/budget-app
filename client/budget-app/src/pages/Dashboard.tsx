import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useExpenses } from '../context/ExpensesContext';
import { useState, useEffect } from 'react';
import type { Expense, ExpenseCategory, RecurringFrequency } from '../types/expense';
import WelcomeModal from '../components/WelcomeModal';
import ExpenseCalendar from '../components/ExpenseCalendar';
import ExpenseViewModal from '../components/ExpenseViewModal';
import ExpenseModal from '../components/ExpenseModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { expenses, loading: expensesLoading } = useExpenses();
  const navigate = useNavigate();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const displayName = profile ? (profile.display_name || user?.email || '') : '';
  const avatarId = profile ? (profile.avatar_id || 'cat') : '';
  const loading = profileLoading || expensesLoading;

  useEffect(() => {
    // Check if user is new (hasn't completed welcome setup)
    if (profile && !profile.has_completed_welcome) {
      setShowWelcomeModal(true);
    }
  }, [profile]);

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
    navigate('/expenses');
  };

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense);
  };

  const handleCloseModal = () => setSelectedExpense(null);

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(null);
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setSelectedExpense(null);
    setDeletingExpense(expense);
    setShowDeleteModal(true);
  };

  const { deleteExpense, updateExpense } = useExpenses();

  const confirmDelete = async () => {
    if (!deletingExpense) return;
    
    setDeleting(deletingExpense.id);
    const success = await deleteExpense(deletingExpense.id);
    if (success) {
      // Success is handled by the context
    }
    setDeleting(null);
    setDeletingExpense(null);
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setDeletingExpense(null);
    setShowDeleteModal(false);
  };

  const handleSaveExpense = async (expenseData: {
    name: string;
    amount: number;
    due_date: string;
    category: ExpenseCategory;
    is_recurring: boolean;
    recurring_frequency: RecurringFrequency | null;
    recurring_pattern: string | null;
    notes: string;
  }) => {
    if (editingExpense) {
      const success = await updateExpense(editingExpense.id, {
        name: expenseData.name,
        amount: expenseData.amount,
        due_date: expenseData.due_date,
        category: expenseData.category,
        is_recurring: expenseData.is_recurring,
        recurring_frequency: expenseData.recurring_frequency || undefined,
        recurring_pattern: expenseData.recurring_pattern,
        notes: expenseData.notes
      });
      if (success) {
        setShowEditModal(false);
        setEditingExpense(null);
      } else {
        throw new Error('Failed to update expense.');
      }
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingExpense(null);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header displayName={displayName} avatarId={avatarId} onLogout={logout} onRefresh={() => {}} />
      
      <main id="main-content" className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {loading ? (
            <div className="flex items-center justify-center h-96 bg-gray-800 rounded-xl" aria-live="polite" aria-busy="true">
              <div className="text-center">
                <div 
                  className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"
                  role="status"
                  aria-label="Loading expenses"
                ></div>
                <p className="text-gray-400">Loading expenses...</p>
              </div>
            </div>
          ) : (
            <ExpenseCalendar 
              expenses={expenses}
              onEventClick={handleExpenseClick}
            />
          )}
        </div>
      </main>

      <ExpenseViewModal
        expense={selectedExpense}
        isOpen={!!selectedExpense}
        onClose={handleCloseModal}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
        currency={profile?.currency}
      />
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onComplete={handleWelcomeComplete}
      />
      <ExpenseModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        onSave={handleSaveExpense}
        expense={editingExpense}
        mode="edit"
        currency={profile?.currency}
      />

      <DeleteConfirmationModal
        expense={deletingExpense}
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        isDeleting={deleting === deletingExpense?.id}
        currency={profile?.currency}
      />
    </div>
  );
} 