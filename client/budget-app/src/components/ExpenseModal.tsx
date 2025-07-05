import { useState, useEffect } from 'react';
import type { Expense, ExpenseCategory, RecurringFrequency } from '../types/expense';
import CategorySelect from './CategorySelect';
import RecurringDateSelector from './RecurringDateSelector';
import { parseCurrencyInput } from '../utils/currencyFormat';
import { useFocusTrap } from '../hooks/useFocusTrap';
import LiveRegion from './LiveRegion';

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
  }) => Promise<void>;
  expense?: Expense | null;
  mode: 'add' | 'edit';
  currency?: string;
}

const FREQUENCIES: RecurringFrequency[] = ['monthly', 'bi-weekly', 'weekly', 'yearly'];

export default function ExpenseModal({ isOpen, onClose, onSave, expense, mode, currency = 'USD' }: ExpenseModalProps) {
  const [form, setForm] = useState<{
    name: string;
    amount: string;
    due_date: string;
    category: ExpenseCategory;
    is_recurring: boolean;
    recurring_frequency: RecurringFrequency | undefined;
    notes: string;
  }>({
    name: '',
    amount: '',
    due_date: '',
    category: 'other',
    is_recurring: false,
    recurring_frequency: undefined,
    notes: '',
  });
  const [recurringDateValue, setRecurringDateValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  // Focus trap for modal
  const modalRef = useFocusTrap({
    isActive: isOpen,
    onEscape: onClose
  });

  // Reset form when modal opens/closes or expense changes
  useEffect(() => {
    if (isOpen) {
      if (expense && mode === 'edit') {
        setForm({
          name: expense.name,
          amount: expense.amount.toString(),
          due_date: expense.due_date,
          category: expense.category,
          is_recurring: expense.is_recurring,
          recurring_frequency: expense.recurring_frequency || undefined,
          notes: expense.notes || '',
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
          amount: '',
          due_date: '',
          category: 'other',
          is_recurring: false,
          recurring_frequency: undefined,
          notes: '',
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
    } else if (name === 'amount') {
      // Handle amount input with international number parsing
      setForm(prev => ({
        ...prev,
        [name]: value
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
    setLiveMessage('');
    if (!form.name.trim() || !form.amount || !form.category) {
      const errorMsg = 'Please fill in all required fields.';
      setFormError(errorMsg);
      setLiveMessage(errorMsg);
      return;
    }
    
    // Validate date fields based on whether it's recurring or not
    if (form.is_recurring) {
      if (!form.recurring_frequency) {
        const errorMsg = 'Please select a recurring frequency.';
        setFormError(errorMsg);
        setLiveMessage(errorMsg);
        return;
      }
      if (!recurringDateValue) {
        const errorMsg = 'Please select a date for the recurring expense.';
        setFormError(errorMsg);
        setLiveMessage(errorMsg);
        return;
      }
    } else {
      if (!form.due_date) {
        const errorMsg = 'Please select a due date.';
        setFormError(errorMsg);
        setLiveMessage(errorMsg);
        return;
      }
    }
    
    setSaving(true);

    // Parse the amount using international number format
    const parsedAmount = parseCurrencyInput(form.amount, currency);
    if (isNaN(parsedAmount)) {
      const errorMsg = 'Please enter a valid amount.';
      setFormError(errorMsg);
      setLiveMessage(errorMsg);
      setSaving(false);
      return;
    }

    // Prepare the data for storage
    const expenseData = {
      ...form,
      amount: parsedAmount,
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
      const successMsg = mode === 'add' ? 'Expense added successfully' : 'Expense updated successfully';
      setLiveMessage(successMsg);
      onClose();
    } catch {
      const errorMsg = 'Failed to save expense.';
      setFormError(errorMsg);
      setLiveMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
    >
      <div ref={modalRef} className="bg-gray-800 rounded-xl shadow-lg w-full md:w-1/2 md:max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 rounded-t-xl px-6 py-4 border-b border-gray-700">
          <h2 id="expense-modal-title" className="text-xl md:text-2xl font-bold text-white">
            {mode === 'add' ? 'Add Expense' : 'Edit Expense'}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
        
        <div className="space-y-4">
          <div>
            <label htmlFor="expense-name" className="block text-gray-300 mb-1">Name *</label>
            <input
              id="expense-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="expense-amount" className="block text-gray-300 mb-1">Amount *</label>
            <input
              id="expense-amount"
              type="text"
              name="amount"
              value={form.amount}
              onChange={handleFormChange}
              className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              aria-required="true"
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
              id="expense-recurring"
              type="checkbox"
              name="is_recurring"
              checked={form.is_recurring}
              onChange={handleFormChange}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <label htmlFor="expense-recurring" className="text-gray-300">Recurring</label>
          </div>

          {form.is_recurring && (
            <div>
              <label htmlFor="expense-frequency" className="block text-gray-300 mb-1">Frequency *</label>
              <select
                id="expense-frequency"
                name="recurring_frequency"
                value={form.recurring_frequency || ''}
                onChange={handleFormChange}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-required="true"
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
              <label htmlFor="expense-due-date" className="block text-gray-300 mb-1">Due Date *</label>
              <input
                id="expense-due-date"
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleFormChange}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-required="true"
              />
            </div>
          )}

          <div>
            <label htmlFor="expense-notes" className="block text-gray-300 mb-1">Notes</label>
            <input
              id="expense-notes"
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

        {/* Live region for screen readers */}
        <LiveRegion message={liveMessage} type="assertive" />

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