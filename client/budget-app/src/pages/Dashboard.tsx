import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';
import { expenseService } from '../services/expenseService';
import type { Profile } from '../types/profile';
import type { Expense, ExpenseCategory, RecurringFrequency } from '../types/expense';
import WelcomeModal from '../components/WelcomeModal';
import ExpenseCalendar from '../components/ExpenseCalendar';
import ExpenseViewModal from '../components/ExpenseViewModal';
import CategorySelect from '../components/CategorySelect';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<{
    name: string;
    amount: number;
    due_date: string;
    category: ExpenseCategory;
    is_recurring: boolean;
    recurring_frequency: RecurringFrequency | undefined;
    notes: string;
    excluded_from_paycheck: boolean;
  }>({
    name: '',
    amount: 0,
    due_date: '',
    category: 'other',
    is_recurring: false,
    recurring_frequency: undefined,
    notes: '',
    excluded_from_paycheck: false
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = user?.user_metadata?.display_name || user?.email;

  useEffect(() => {
    loadProfile();
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const expensesData = await expenseService.getExpenses();
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const profileData = await profileService.getProfile();
      if (profileData) {
        setProfile(profileData);
        
        // Check if user is new (hasn't completed welcome setup)
        const isNewUser = !profileData.has_completed_welcome;
        
        if (isNewUser) {
          setShowWelcomeModal(true);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
    // Reload profile to get updated data
    loadProfile();
  };

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense);
  };

  const handleCloseModal = () => setSelectedExpense(null);

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(null);
    setEditingExpense(expense);
    setForm({
      name: expense.name,
      amount: expense.amount,
      due_date: expense.due_date,
      category: expense.category,
      is_recurring: expense.is_recurring,
      recurring_frequency: expense.recurring_frequency || undefined,
      notes: expense.notes || '',
      excluded_from_paycheck: expense.excluded_from_paycheck
    });
    setShowEditModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCategoryChange = (category: ExpenseCategory) => {
    setForm(prev => ({
      ...prev,
      category
    }));
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingExpense(null);
    setForm({
      name: '',
      amount: 0,
      due_date: '',
      category: 'other',
      is_recurring: false,
      recurring_frequency: undefined,
      notes: '',
      excluded_from_paycheck: false
    });
    setFormError(null);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!form.name.trim() || !form.amount || !form.due_date || !form.category) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (form.is_recurring && !form.recurring_frequency) {
      setFormError('Please select a recurring frequency.');
      return;
    }
    setSaving(true);
    if (editingExpense) {
      const updatedExpense = await expenseService.updateExpense(editingExpense.id, {
        ...form,
        amount: Number(form.amount),
        category: form.category,
        recurring_frequency: form.is_recurring ? form.recurring_frequency : undefined
      });
      if (updatedExpense) {
        setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? updatedExpense : exp));
        closeEditModal();
      } else {
        setFormError('Failed to update expense.');
      }
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* Mobile slide-out menu */}
      <div
        className={`fixed top-0 left-0 h-full z-50 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          w-2/3 max-w-xs md:hidden flex flex-col`}
        style={{ minWidth: 220 }}
      >
        <div className="flex items-center p-4 border-b border-gray-700">
          <span className="text-white font-semibold text-lg">Budget Buddy</span>
        </div>
        <nav className="flex flex-col p-4 space-y-2">
          <Link
            to="/expenses"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-base font-medium transition-colors duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            Expenses
          </Link>
          <Link
            to="/settings"
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-base font-medium transition-colors duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            Settings
          </Link>
          <button
            onClick={() => { setMobileMenuOpen(false); logout(); }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-base font-medium transition-colors duration-200 text-left"
          >
            Logout
          </button>
        </nav>
      </div>
      <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Hamburger for mobile */}
            <button
              className="md:hidden flex items-center justify-center p-2 rounded text-gray-200 hover:text-blue-400 focus:outline-none"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              {/* Hamburger SVG */}
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Desktop/tablet: Budget Buddy dashboard link */}
            <button 
              onClick={() => {
                loadProfile();
                loadExpenses();
              }}
              className="hidden md:inline text-xl font-semibold text-white hover:text-blue-400 transition-colors duration-200 cursor-pointer"
            >
              Budget Buddy
            </button>
            {/* Mobile: avatar and username only */}
            <div className="flex items-center space-x-3 md:hidden">
              <Avatar avatarId={profile?.avatar_id || 'cat'} size="sm" />
              <span className="text-white font-semibold text-lg">{displayName}</span>
            </div>
            {/* Desktop/tablet nav actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Avatar avatarId={profile?.avatar_id || 'cat'} size="sm" />
              <span className="text-gray-300">Welcome, {displayName}</span>
              <Link
                to="/expenses"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Expenses
              </Link>
              <Link
                to="/settings"
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Settings
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex items-center justify-center h-96 bg-gray-800 rounded-xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading expenses...</p>
              </div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="border-2 border-dashed border-gray-600 rounded-xl h-96 flex items-center justify-center bg-gray-800/50">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">No expenses yet</h3>
                <p className="text-gray-400 mb-4">Add your first expense to see it on the calendar</p>
                <Link
                  to="/expenses"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Add Expense
                </Link>
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
        currency={profile?.currency || 'USD'}
      />
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onComplete={handleWelcomeComplete}
      />
      {/* Edit Expense Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Edit Expense</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Due Date *</label>
                <input
                  type="date"
                  name="due_date"
                  value={form.due_date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <CategorySelect
                  value={form.category}
                  onChange={handleCategoryChange}
                  label="Category *"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_recurring"
                  checked={form.is_recurring}
                  onChange={handleFormChange}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <label className="text-gray-300">Recurring</label>
              </div>
              {form.is_recurring && (
                <div>
                  <label className="block text-gray-300 mb-1">Frequency *</label>
                  <select
                    name="recurring_frequency"
                    value={form.recurring_frequency || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select frequency</option>
                    <option value="monthly">Monthly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-gray-300 mb-1">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="excluded_from_paycheck"
                  checked={form.excluded_from_paycheck}
                  onChange={handleFormChange}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <label className="text-gray-300">Exclude from paycheck calculation</label>
              </div>
              {formError && <div className="text-red-400 text-sm">{formError}</div>}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={closeEditModal}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 