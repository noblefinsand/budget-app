import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import type { Profile } from '../types/profile';
import { getCurrentBudgetPeriod, generateRecurringDates, formatDueDateForDisplay, formatSpecificDateForDisplay } from '../utils/dateFormat';
import { formatCurrency, parseCurrencyInput } from '../utils/currencyFormat';
import LiveRegion from '../components/LiveRegion';
import { expenseService } from '../services/expenseService';
import type { Expense } from '../types/expense';

// Local interface for expanded expenses with occurrence dates
interface ExpandedExpense extends Expense {
  _occurrenceDate?: Date;
}

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
  
  // Manual period override for early paydays
  const [useManualPeriod, setUseManualPeriod] = useState(false);
  const [manualPeriodStart, setManualPeriodStart] = useState('');
  const [manualPeriodEnd, setManualPeriodEnd] = useState('');
  const [liveMessage, setLiveMessage] = useState('');



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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center" aria-live="polite" aria-busy="true">
        <div className="text-white">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"
            role="status"
            aria-label="Loading budget time"
          ></div>
          Loading...
        </div>
      </div>
    );
  }

  // Calculate current budget period
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;

  if (useManualPeriod && manualPeriodStart && manualPeriodEnd) {
    // Use manual period override
    periodStart = parseLocalDate(manualPeriodStart);
    periodEnd = parseLocalDate(manualPeriodEnd);
  } else if (profile?.paycheck_reference_date && profile?.paycheck_frequency) {
    // Use calculated period based on reference date
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

  // Helper to parse YYYY-MM-DD as local date (same as calendar)
  function parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Expand recurring expenses into all their occurrences within the current period
  function expandRecurringExpenses(expenses: Expense[], periodStart: Date, periodEnd: Date): ExpandedExpense[] {
    const expanded: ExpandedExpense[] = [];
    for (const exp of expenses) {
      if (exp.is_recurring && exp.recurring_frequency && exp.recurring_pattern) {
        const dates = generateRecurringDates(
          exp.due_date,
          exp.recurring_pattern,
          exp.recurring_frequency,
          1 // only need to generate for the current period
        );
        // Filter out dates that are before the original due date (same as calendar)
        const originalDueDate = parseLocalDate(exp.due_date);
        const validDates = dates.filter(date => date >= originalDueDate);
        
        for (const date of validDates) {
          if (date >= periodStart && date <= periodEnd) {
            const dateString = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            expanded.push({
              ...exp,
              id: `${exp.id}-${dateString}`,
              due_date: dateString,
              // Store the actual Date object for display
              _occurrenceDate: date,
            });
          }
        }
      } else {
        // One-time or non-recurring
        const dueDate = parseLocalDate(exp.due_date);
        if (dueDate >= periodStart && dueDate <= periodEnd) {
          expanded.push({
            ...exp,
            _occurrenceDate: dueDate,
          });
        }
      }
    }
    return expanded;
  }

  // Use expanded recurring expenses for periodExpenses
  const periodExpenses = (periodStart && periodEnd)
    ? expandRecurringExpenses(expenses, periodStart, periodEnd)
    : [];

  // Helper to check if an expense is excluded
  function isExcluded(expenseId: string) {
    return excludedExpenseIds.includes(expenseId);
  }

  // Handler for toggling exclude/include
  function handleToggleExclude(expenseId: string) {
    const expense = allPeriodExpenses.find(exp => exp.id === expenseId);
    const isCurrentlyExcluded = excludedExpenseIds.includes(expenseId);
    
    setExcludedExpenseIds(prev =>
      prev.includes(expenseId)
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
    
    if (expense) {
      const action = isCurrentlyExcluded ? 'included' : 'excluded';
      setLiveMessage(`Expense "${expense.name}" ${action} from budget calculations`);
    }
  }

  function handleAddOneTimeExpense(e: React.FormEvent) {
    e.preventDefault();
    setLiveMessage('');
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
    
    // Parse the amount using international number format
    const parsedAmount = parseCurrencyInput(oneTimeAmount, profile?.currency || 'USD');
    if (isNaN(parsedAmount)) {
      setOneTimeTouched(t => ({ ...t, amount: true }));
      setLiveMessage('Please enter a valid amount for the one-time expense');
      return;
    }
    
    const newExpense: Expense = {
      id: `one-time-${Date.now()}`,
      name: oneTimeName,
      amount: parsedAmount,
      due_date: periodStart ? periodStart.toISOString().slice(0, 10) : '',
      is_recurring: false,
      category: 'other',
      notes: null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || '',
      recurring_frequency: null,
      recurring_pattern: null
    };
    setOneTimeExpenses(prev => [...prev, newExpense]);
    setOneTimeName('');
    setOneTimeAmount('');
    setOneTimeTouched({ name: false, amount: false });
    setLiveMessage(`One-time expense "${oneTimeName}" added for ${formatCurrency(parsedAmount, profile?.currency || 'USD')}`);
  }

  function handleRemoveOneTimeExpense(id: string) {
    const expense = oneTimeExpenses.find(exp => exp.id === id);
    setOneTimeExpenses(prev => prev.filter(exp => exp.id !== id));
    if (expense) {
      setLiveMessage(`One-time expense "${expense.name}" removed`);
    }
  }

  // Calculate totals for included and excluded expenses
  const allPeriodExpenses = [...periodExpenses, ...oneTimeExpenses];
  const includedExpenses = allPeriodExpenses.filter(exp => !excludedExpenseIds.includes(exp.id));
  const excludedExpenses = allPeriodExpenses.filter(exp => excludedExpenseIds.includes(exp.id));
  const totalIncluded = includedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExcluded = excludedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const paycheckNum = parseCurrencyInput(paycheckAmount, profile?.currency || 'USD') || 0;
  const remainingBudget = paycheckNum - totalIncluded;

  return (
    <div className="min-h-screen bg-gray-900">
      <Header displayName={displayName} avatarId={avatarId} onLogout={logout} />
      <main id="main-content" className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Paycheck Input */}
          <div className="bg-gray-800 rounded-xl shadow p-6 flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Budget Time</h1>
            <label htmlFor="paycheckAmount" className="block text-gray-300 text-base font-semibold mb-2">Paycheck Amount</label>
            <input
              id="paycheckAmount"
              type="text"
              value={paycheckAmount}
              onChange={e => setPaycheckAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mb-2"
              placeholder="Enter your paycheck amount"
              aria-describedby="paycheck-amount-help"
            />
            <p id="paycheck-amount-help" className="text-gray-400 text-sm">Enter the amount you expect to receive in your paycheck</p>
            <div className="mt-2">
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="manual-period-checkbox"
                    type="checkbox"
                    checked={useManualPeriod}
                    onChange={e => setUseManualPeriod(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-gray-300 text-base font-semibold">Use custom budget period</span>
                </label>
                <span className="text-xs text-gray-400">(for early paydays, etc.)</span>
              </div>
              {useManualPeriod && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-700/30 rounded-lg">
                  <div>
                    <label htmlFor="period-start" className="block text-gray-300 text-sm font-medium mb-1">Period Start</label>
                    <input
                      id="period-start"
                      type="date"
                      value={manualPeriodStart}
                      onChange={e => setManualPeriodStart(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="period-end" className="block text-gray-300 text-sm font-medium mb-1">Period End</label>
                    <input
                      id="period-end"
                      type="date"
                      value={manualPeriodEnd}
                      onChange={e => setManualPeriodEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
            {periodStart && periodEnd && (
              <div className="mt-4">
                <p className="text-gray-300 text-base font-semibold">
                  {useManualPeriod ? 'Custom Period:' : 'Current Period:'}
                </p>
                <p className="text-blue-400 text-lg sm:text-xl font-bold">{formatDate(periodStart)} – {formatDate(periodEnd)}</p>
                {useManualPeriod && (
                  <p className="text-xs text-gray-400 mt-1">
                    Next normal payday: {profile?.paycheck_reference_date && profile?.paycheck_frequency ? 
                      (() => {
                        const normalPeriod = getCurrentBudgetPeriod(profile.paycheck_reference_date, profile.paycheck_frequency);
                        const customPeriodEnd = periodEnd;
                        if (normalPeriod.periodStart <= customPeriodEnd) {
                          const daysInPeriod = profile.paycheck_frequency === 'weekly' ? 7 : 
                                                 profile.paycheck_frequency === 'bi-weekly' ? 14 : 
                                                 profile.paycheck_frequency === 'monthly' ? 30 : 15;
                          const periodsToAdd = Math.ceil((customPeriodEnd.getTime() - normalPeriod.periodStart.getTime()) / (daysInPeriod * 24 * 60 * 60 * 1000));
                          const nextPayday = new Date(normalPeriod.periodStart);
                          nextPayday.setDate(normalPeriod.periodStart.getDate() + (periodsToAdd * daysInPeriod));
                          return formatDate(nextPayday);
                        } else {
                          return formatDate(normalPeriod.periodStart);
                        }
                      })() : 
                      'Not set'
                    }
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Expenses List */}
          <div className="bg-gray-800 rounded-xl shadow p-6 flex flex-col gap-2">
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
                      <span className="ml-1 text-xs text-gray-300">
                        {(exp as ExpandedExpense)._occurrenceDate 
                          ? formatSpecificDateForDisplay((exp as ExpandedExpense)._occurrenceDate!)
                          : formatDueDateForDisplay(exp)
                        }
                      </span>
                      {exp.is_recurring && (
                        <span className="ml-2 text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full">Recurring</span>
                      )}
                      {!exp.is_recurring && (
                        <span className="ml-2 text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded-full">One-Time</span>
                      )}
                      {excluded && (
                        <span className="ml-2 text-xs text-gray-300 bg-gray-700/50 px-2 py-0.5 rounded-full">Excluded</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-base">{formatCurrency(exp.amount, profile?.currency || 'USD')}</span>
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
          </div>

          {/* Add One-Time Expense */}
          <div className="bg-gray-800 rounded-xl shadow p-6 flex flex-col gap-2">
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
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-required="true"
                    aria-invalid={oneTimeTouched.name && !oneTimeName}
                    aria-describedby={oneTimeTouched.name && !oneTimeName ? "one-time-name-error" : undefined}
                  />
                  {oneTimeTouched.name && !oneTimeName && (
                    <span id="one-time-name-error" className="text-xs text-red-400 mt-1">Name is required</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="oneTimeAmount">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="oneTimeAmount"
                    type="text"
                    value={oneTimeAmount}
                    onChange={e => setOneTimeAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-required="true"
                    aria-invalid={oneTimeTouched.amount && !oneTimeAmount}
                    aria-describedby={oneTimeTouched.amount && !oneTimeAmount ? "one-time-amount-error" : undefined}
                  />
                  {oneTimeTouched.amount && !oneTimeAmount && (
                    <span id="one-time-amount-error" className="text-xs text-red-400 mt-1">Amount is required</span>
                  )}
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200 h-full"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar (Summary Widget) */}
        <aside className="w-full lg:w-[350px] flex-shrink-0">
          <div className="sticky top-8">
            <div className="bg-blue-900 rounded-xl shadow-lg p-6 flex flex-col items-center gap-4">
              {/* Amount Left Widget */}
              <div className="text-3xl font-bold text-white">
                {formatCurrency(remainingBudget, profile?.currency || 'USD')}
              </div>
              <div className="text-sm text-gray-200">Amount Left</div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${Math.min(100, (totalIncluded / paycheckNum) * 100)}%` }}
                />
              </div>
              {/* Totals */}
              <div className="flex justify-between w-full text-sm mt-2">
                <span className="text-green-400">Included: {formatCurrency(totalIncluded, profile?.currency || 'USD')}</span>
                <span className="text-gray-300">Excluded: {formatCurrency(totalExcluded, profile?.currency || 'USD')}</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
      
      {/* Live region for screen readers */}
      <LiveRegion message={liveMessage} type="polite" />
    </div>
  );
} 