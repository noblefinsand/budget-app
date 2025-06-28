import { useEffect, useState } from 'react';
import { expenseService } from '../services/expenseService';
import { profileService } from '../services/profileService';
import { Link } from 'react-router-dom';
import type { Expense, ExpenseCreate, RecurringFrequency, ExpenseCategory } from '../types/expense';

const CATEGORIES: ExpenseCategory[] = [
  'housing', 'utilities', 'transportation', 'food', 'entertainment', 'healthcare', 'insurance', 'debt', 'savings', 'other'
];
const FREQUENCIES: RecurringFrequency[] = ['monthly', 'bi-weekly', 'weekly', 'yearly'];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ExpenseCreate>({
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

  const handleSave = async () => {
    setFormError(null);
    // Validation
    if (!form.name.trim() || !form.amount || !form.due_date || !form.category) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (form.is_recurring && !form.recurring_frequency) {
      setFormError('Please select a recurring frequency.');
      return;
    }
    setSaving(true);
    const newExpense = await expenseService.addExpense({
      ...form,
      amount: Number(form.amount),
      recurring_frequency: form.is_recurring ? form.recurring_frequency : undefined
    });
    setSaving(false);
    if (newExpense) {
      setExpenses(prev => [...prev, newExpense]);
      setShowAddModal(false);
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
    } else {
      setFormError('Failed to add expense.');
    }
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
            onClick={() => setShowAddModal(true)}
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
            <table className="w-full text-left text-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-2">Name</th>
                  <th className="py-2 px-2">Amount</th>
                  <th className="py-2 px-2">Due Date</th>
                  <th className="py-2 px-2">Recurring</th>
                  <th className="py-2 px-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                    <td className="py-2 px-2 font-medium">{exp.name}</td>
                    <td className="py-2 px-2">{formatCurrency(exp.amount)}</td>
                    <td className="py-2 px-2">{exp.due_date}</td>
                    <td className="py-2 px-2">{exp.is_recurring ? exp.recurring_frequency : 'No'}</td>
                    <td className="py-2 px-2 capitalize">{exp.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">Add Expense</h2>
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
                  <label className="block text-gray-300 mb-1">Category *</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
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
                      {FREQUENCIES.map(freq => (
                        <option key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</option>
                      ))}
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
                  onClick={() => setShowAddModal(false)}
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
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}