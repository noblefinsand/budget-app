import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import type { Profile } from '../types/profile';
import { getCurrentBudgetPeriod } from '../utils/dateFormat';
import { expenseService } from '../services/expenseService';
import type { Expense } from '../types/expense';

export default function BudgetTime() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paycheckAmount, setPaycheckAmount] = useState('');
  const [oneTimeName, setOneTimeName] = useState('');
  const [oneTimeAmount, setOneTimeAmount] = useState('');
  const [oneTimeExpenses, setOneTimeExpenses] = useState<Expense[]>([]);
  const [oneTimeTouched, setOneTimeTouched] = useState<{ name: boolean; amount: boolean }>({ name: false, amount: false });
  const [excludedExpenseIds, setExcludedExpenseIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const profileData = await profileService.getProfile();
      setProfile(profileData);
      setLoading(false);
    };
    fetchProfile();
    // Fetch expenses
    const fetchExpenses = async () => {
      const data = await expenseService.getExpenses();
      setExpenses(data);
    };
    fetchExpenses();
  }, []);

  const displayName = profile ? (profile.display_name || user?.email || '') : '';
  const avatarId = profile ? (profile.avatar_id || 'cat') : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Calculate current budget period
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;
  if (profile?.paycheck_reference_date && profile?.paycheck_frequency) {
    const period = getCurrentBudgetPeriod(
      profile.paycheck_reference_date,
      profile.paycheck_frequency
    );
    periodStart = period.periodStart;
    periodEnd = period.periodEnd;
  }

  function formatDate(date: Date | null) {
    if (!date) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Helper to check if a date is within the current period
  function isWithinPeriod(dateStr: string, start: Date, end: Date) {
    const d = new Date(dateStr);
    return d >= start && d <= end;
  }

  // Filter expenses for current period
  const periodExpenses = expenses.filter(exp => {
    if (!periodStart || !periodEnd) return false;
    return isWithinPeriod(exp.due_date, periodStart, periodEnd);
  });

  // Helper to check if an expense is excluded
  function isExcluded(expenseId: string) {
    return excludedExpenseIds.includes(expenseId);
  }

  // Handler for toggling exclude/include
  function handleToggleExclude(expenseId: string) {
    setExcludedExpenseIds(prev =>
      prev.includes(expenseId)
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  }

  function handleAddOneTimeExpense(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (!oneTimeName.trim()) {
      setOneTimeTouched(t => ({ ...t, name: true }));
      valid = false;
    }
    if (!oneTimeAmount) {
      setOneTimeTouched(t => ({ ...t, amount: true }));
      valid = false;
    }
    if (!valid) return;
    const newExpense: Expense = {
      id: `one-time-${Date.now()}`,
      name: oneTimeName,
      amount: parseFloat(oneTimeAmount),
      due_date: periodStart ? periodStart.toISOString().slice(0, 10) : '',
      is_recurring: false,
      category: 'other',
      notes: null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || '',
      recurring_frequency: null,
      recurring_pattern: null,
      excluded_from_paycheck: false
    };
    setOneTimeExpenses(prev => [...prev, newExpense]);
    setOneTimeName('');
    setOneTimeAmount('');
    setOneTimeTouched({ name: false, amount: false });
  }

  function handleRemoveOneTimeExpense(id: string) {
    setOneTimeExpenses(prev => prev.filter(exp => exp.id !== id));
  }

  // Calculate totals for included and excluded expenses
  const allPeriodExpenses = [...periodExpenses, ...oneTimeExpenses];
  const includedExpenses = allPeriodExpenses.filter(exp => !excludedExpenseIds.includes(exp.id));
  const excludedExpenses = allPeriodExpenses.filter(exp => excludedExpenseIds.includes(exp.id));
  const totalIncluded = includedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExcluded = excludedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const paycheckNum = parseFloat(paycheckAmount) || 0;
  const remainingBudget = paycheckNum - totalIncluded;

  return (
    <div className="min-h-screen bg-gray-900">
      <Header displayName={displayName} avatarId={avatarId} onLogout={logout} />
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gray-800 rounded-xl shadow-lg max-w-3xl w-full mx-auto p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Budget Time</h1>
            <div className="mb-6">
              <label htmlFor="paycheckAmount" className="block text-gray-300 text-base font-semibold mb-2">Paycheck Amount</label>
              <input
                id="paycheckAmount"
                type="number"
                min="0"
                step="0.01"
                value={paycheckAmount}
                onChange={e => setPaycheckAmount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mb-2"
                placeholder="Enter your paycheck amount"
              />
            </div>
            {periodStart && periodEnd && (
              <div className="mb-4">
                <p className="text-gray-300 text-base font-semibold">Current Period:</p>
                <p className="text-blue-400 text-lg sm:text-xl font-bold">{formatDate(periodStart)} – {formatDate(periodEnd)}</p>
              </div>
            )}
            {/* Responsive description text */}
            <p className="text-gray-300 mb-2 text-base hidden sm:block">
              This is where you'll enter your paycheck, see your recurring expenses, add one-time expenses, and track your budget for this period.
            </p>
            <p className="text-gray-300 mb-2 text-base sm:hidden">
              Enter your paycheck and track your budget.
            </p>
            <div className="mt-6">
              <h2 className="text-xl text-white font-semibold mb-2">Expenses This Period</h2>
              <ul className="divide-y divide-gray-700">
                {[...periodExpenses, ...oneTimeExpenses].map(exp => {
                  const isLocalOneTime = oneTimeExpenses.some(e => e.id === exp.id);
                  const excluded = isExcluded(exp.id);
                  return (
                    <li
                      key={exp.id}
                      className={`py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${excluded ? 'opacity-50' : ''}`}
                    >
                      <span className="text-gray-200 text-base flex items-center gap-3">
                        {exp.name}
                        {exp.is_recurring && (
                          <span className="ml-2 text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full">Recurring</span>
                        )}
                        {!exp.is_recurring && (
                          <span className="ml-2 text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded-full">One-Time</span>
                        )}
                        {excluded && (
                          <span className="ml-2 text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">Excluded</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-base">${exp.amount.toFixed(2)}</span>
                        {/* Exclude Switch: only for non-local (not oneTimeExpenses) */}
                        {!isLocalOneTime && (
                          <label className="flex items-center gap-2 cursor-pointer select-none ml-2">
                            <span className="text-xs text-gray-400">Exclude</span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={excluded}
                              onClick={() => handleToggleExclude(exp.id)}
                              className={`relative inline-flex h-5 w-10 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${excluded ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                              <span
                                className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ${excluded ? 'translate-x-5' : 'translate-x-0'}`}
                              />
                            </button>
                          </label>
                        )}
                        {/* Remove button for local one-time expenses (only if not excluded) */}
                        {isLocalOneTime && !excluded && (
                          <button
                            onClick={() => handleRemoveOneTimeExpense(exp.id)}
                            className="text-red-400 hover:text-red-600 text-xs font-semibold px-2 py-1 rounded transition-colors duration-200 ml-2"
                            title="Remove one-time expense"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {/* Summary Section */}
              <div className="mt-6 bg-gray-700/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-gray-300 text-base font-semibold">Summary</div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-base">
                  <span className="text-gray-200">Included: <span className="font-bold text-green-400">${totalIncluded.toFixed(2)}</span></span>
                  <span className="text-gray-400">Excluded: <span className="font-bold">${totalExcluded.toFixed(2)}</span></span>
                  <span className="text-gray-200">Remaining: <span className={`font-bold ${remainingBudget < 0 ? 'text-red-400' : 'text-blue-400'}`}>${remainingBudget.toFixed(2)}</span></span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h2 className="text-xl text-white font-semibold mb-2">Add One-Time Expense</h2>
              <form onSubmit={handleAddOneTimeExpense} className="mb-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="oneTimeName">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="oneTimeName"
                      type="text"
                      value={oneTimeName}
                      onChange={e => setOneTimeName(e.target.value)}
                      onBlur={() => setOneTimeTouched(t => ({ ...t, name: true }))}
                      placeholder="Expense name"
                      className={`w-full px-4 py-3 md:py-0 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 md:h-12 ${oneTimeTouched.name && !oneTimeName.trim() ? 'border-red-500' : 'border-gray-600'}`}
                    />
                  </div>
                  <div className="w-full md:w-40 flex flex-col">
                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="oneTimeAmount">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="oneTimeAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={oneTimeAmount}
                      onChange={e => setOneTimeAmount(e.target.value)}
                      onBlur={() => setOneTimeTouched(t => ({ ...t, amount: true }))}
                      placeholder="Amount"
                      className={`w-full px-4 py-3 md:py-0 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 md:h-12 ${oneTimeTouched.amount && !oneTimeAmount ? 'border-red-500' : 'border-gray-600'}`}
                    />
                  </div>
                  <div className="flex items-end md:items-end pt-5 md:pt-0">
                    <button
                      type="submit"
                      disabled={!oneTimeName.trim() || !oneTimeAmount}
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 md:py-0 rounded-lg font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center md:h-12"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 