import { useState, useEffect } from 'react';
import type { Expense, ExpenseCategory, RecurringFrequency } from '../types/expense';
import CategorySelect from './CategorySelect';
import RecurringDateSelector from './RecurringDateSelector';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: {
    name: string;
    amount: number;
    due_date: string;
    category: ExpenseCategory;
    is_recurring: boolean;
    recurring_frequency: RecurringFrequency | null;
    recurring_pattern: string | null;
    notes: string;
    excluded_from_paycheck: boolean;
  }) => Promise<void>;
  expense?: Expense | null;
  mode: 'add' | 'edit';
}

const FREQUENCIES: RecurringFrequency[] = ['monthly', 'bi-weekly', 'weekly', 'yearly'];

export default function ExpenseModal({ isOpen, onClose, onSave, expense, mode }: ExpenseModalProps) {
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
  const [recurringDateValue, setRecurringDateValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens/closes or expense changes
  useEffect(() => {
    if (isOpen) {
      if (expense && mode === 'edit') {
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
        
        // Set the recurring date value for display
        if (expense.is_recurring && expense.recurring_frequency && expense.recurring_pattern) {
          setRecurringDateValue(expense.recurring_pattern);
        } else {
          setRecurringDateValue('');
        }
      } else {
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
        setRecurringDateValue('');
      }
      setFormError(null);
    }
  }, [isOpen, expense, mode]);

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
    if (!form.name.trim() || !form.amount || !form.category) {
      setFormError('Please fill in all required fields.');
      return;
    }
    
    // Validate date fields based on whether it's recurring or not
    if (form.is_recurring) {
      if (!form.recurring_frequency) {
        setFormError('Please select a recurring frequency.');
        return;
      }
      if (!recurringDateValue) {
        setFormError('Please select a date for the recurring expense.');
        return;
      }
    } else {
      if (!form.due_date) {
        setFormError('Please select a due date.');
        return;
      }
    }
    
    setSaving(true);

    // Prepare the data for storage
    const expenseData = {
      ...form,
      amount: Number(form.amount),
      recurring_frequency: form.is_recurring ? form.recurring_frequency || null : null,
      recurring_pattern: form.is_recurring && form.recurring_frequency
        ? (form.recurring_frequency === 'bi-weekly' ? recurringDateValue : recurringDateValue)
        : null,
      status: 'pending' as const,
      updated_at: new Date().toISOString()
    };
    
    if (form.is_recurring && form.recurring_frequency) {
      if (form.recurring_frequency === 'weekly') {
        // For weekly, the start date is the second part of the pattern
        expenseData.due_date = recurringDateValue.split(',')[1];
      } else if (form.recurring_frequency === 'bi-weekly') {
        // For bi-weekly, the pattern is just the start date
        expenseData.due_date = recurringDateValue;
      } else if (form.recurring_frequency === 'monthly') {
        // For monthly, use the current month and the selected day
        const today = new Date();
        const day = parseInt(recurringDateValue, 10);
        expenseData.due_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else if (form.recurring_frequency === 'yearly') {
        // For yearly, use the selected month and day in the current year
        const today = new Date();
        const [month, day] = recurringDateValue.split(',');
        expenseData.due_date = `${today.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    try {
      await onSave(expenseData);
      onClose();
    } catch {
      setFormError('Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-lg w-full md:w-1/2 md:max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 rounded-t-xl px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {mode === 'add' ? 'Add Expense' : 'Edit Expense'}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
        
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

          {form.is_recurring && form.recurring_frequency ? (
            <RecurringDateSelector
              frequency={form.recurring_frequency}
              value={recurringDateValue}
              onChange={setRecurringDateValue}
              label="Date *"
            />
          ) : (
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

          {formError && <div className="text-red-400 text-sm">{formError}</div>}
        </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 rounded-b-xl px-6 py-4 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              disabled={saving}
            >
              {saving ? 'Saving...' : (mode === 'add' ? 'Add Expense' : 'Update')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 