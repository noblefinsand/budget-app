import { useEffect, useState } from 'react';
import { expenseService } from '../services/expenseService';
import { profileService } from '../services/profileService';
import { Link } from 'react-router-dom';
import type { Expense, ExpenseCreate, RecurringFrequency, ExpenseCategory } from '../types/expense';
import { CATEGORY_COLORS } from '../types/expense';
import CategorySelect from '../components/CategorySelect';


const FREQUENCIES: RecurringFrequency[] = ['monthly', 'bi-weekly', 'weekly', 'yearly'];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
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

  const handleCategoryChange = (category: ExpenseCategory) => {
    setForm(prev => ({
      ...prev,
      category
    }));
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
    
    if (editingExpense) {
      // Update existing expense
      const updatedExpense = await expenseService.updateExpense(editingExpense.id, {
        ...form,
        amount: Number(form.amount),
        recurring_frequency: form.is_recurring ? form.recurring_frequency : undefined
      });
      if (updatedExpense) {
        setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? updatedExpense : exp));
        setShowEditModal(false);
        setEditingExpense(null);
        resetForm();
      } else {
        setFormError('Failed to update expense.');
      }
    } else {
      // Add new expense
      const newExpense = await expenseService.addExpense({
        ...form,
        amount: Number(form.amount),
        recurring_frequency: form.is_recurring ? form.recurring_frequency : undefined
      });
      if (newExpense) {
        setExpenses(prev => [...prev, newExpense]);
        setShowAddModal(false);
        resetForm();
      } else {
        setFormError('Failed to add expense.');
      }
    }
    setSaving(false);
  };

  const handleEdit = (expense: Expense) => {
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

  const resetForm = () => {
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

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingExpense(null);
    resetForm();
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
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                    <td className="py-2 px-2 font-medium">{exp.name}</td>
                    <td className="py-2 px-2">{formatCurrency(exp.amount)}</td>
                    <td className="py-2 px-2">{exp.due_date}</td>
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
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
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
                  onClick={closeModal}
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
                  onClick={closeModal}
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-white">Delete Expense</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  Are you sure you want to delete this expense?
                </p>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-white font-medium">{deletingExpense.name}</p>
                  <p className="text-gray-400 text-sm">
                    {formatCurrency(deletingExpense.amount)} • Due {deletingExpense.due_date}
                  </p>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-300 hover:text-white font-medium"
                  disabled={deleting === deletingExpense.id}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
                  disabled={deleting === deletingExpense.id}
                >
                  {deleting === deletingExpense.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}