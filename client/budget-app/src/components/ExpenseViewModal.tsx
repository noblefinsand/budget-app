import React from 'react';
import type { Expense } from '../types/expense';

interface ExpenseViewModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  currency?: string;
}

export default function ExpenseViewModal({ expense, isOpen, onClose, onEdit, currency = 'USD' }: ExpenseViewModalProps) {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Expense Details</h2>
        <div className="space-y-2 text-gray-200">
          <div><span className="font-semibold">Name:</span> {expense.name}</div>
          <div><span className="font-semibold">Amount:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(expense.amount)}</div>
          <div><span className="font-semibold">Category:</span> {expense.category}</div>
          <div><span className="font-semibold">Due Date:</span> {new Date(expense.due_date).toLocaleDateString()}</div>
          <div><span className="font-semibold">Status:</span> {expense.status}</div>
          {expense.is_recurring && (
            <div><span className="font-semibold">Recurring:</span> {expense.recurring_frequency}</div>
          )}
          {expense.notes && (
            <div><span className="font-semibold">Notes:</span> {expense.notes}</div>
          )}
        </div>
        <div className="flex justify-end mt-6 space-x-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            onClick={() => onEdit(expense)}
          >
            Edit
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 