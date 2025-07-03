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
import ExpenseModal from '../components/ExpenseModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
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
    setShowEditModal(true);
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
    excluded_from_paycheck: boolean;
  }) => {
    if (editingExpense) {
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
            onClick={() => {
              logout();
              setMobileMenuOpen(false);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-base font-medium transition-colors duration-200 text-left"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Navigation */}
      <nav className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center justify-between w-full">
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
      <ExpenseModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        onSave={handleSaveExpense}
        expense={editingExpense}
        mode="edit"
      />
    </div>
  );
} 