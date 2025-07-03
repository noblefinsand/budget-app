import React from 'react';
import type { Expense } from '../types/expense';
import { formatDueDateForDisplay } from '../../utils/dateFormat';

interface ExpenseViewModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export default function ExpenseViewModal({ expense, isOpen, onClose, onEdit, onDelete }: ExpenseViewModalProps) {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-gray-800 rounded-xl shadow-lg w-full md:w-1/2 md:max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 rounded-t-xl px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl md:text-2xl font-bold text-white">Expense Details</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Card layout for all screen sizes */}
          <div className="text-gray-200">
            <div className="bg-gray-800 rounded-lg p-4 border-b border-gray-600">
              <div className="text-sm text-gray-400 mb-1">Name</div>
              <div className="text-white font-medium text-lg">{expense.name}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border-b border-gray-600">
              <div className="text-sm text-gray-400 mb-1">Amount</div>
              <div className="text-white font-medium text-xl text-green-400">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(expense.amount)}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border-b border-gray-600">
              <div className="text-sm text-gray-400 mb-1">Category</div>
              <div className="text-white font-medium capitalize">{expense.category}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border-b border-gray-600">
              <div className="text-sm text-gray-400 mb-1">Due Date</div>
              <div className="text-white font-medium">{formatDueDateForDisplay(expense)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border-b border-gray-600">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className={`font-medium capitalize ${
                expense.status === 'paid' ? 'text-green-400' : 
                expense.status === 'overdue' ? 'text-red-400' : 
                'text-yellow-400'
              }`}>
                {expense.status}
              </div>
            </div>
            {expense.is_recurring && (
              <div className="bg-gray-800 rounded-lg p-4 border-b border-gray-600">
                <div className="text-sm text-gray-400 mb-1">Recurring</div>
                <div className="text-white font-medium capitalize">{expense.recurring_frequency}</div>
              </div>
            )}
            {expense.notes && (
              <div className="bg-gray-800 rounded-lg p-4 border-b border-gray-600">
                <div className="text-sm text-gray-400 mb-1">Notes</div>
                <div className="text-white">{expense.notes}</div>
              </div>
            )}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Additional Info</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Excluded from paycheck:</span>
                  <span className="text-white">{expense.excluded_from_paycheck ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">{new Date(expense.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last updated:</span>
                  <span className="text-white">{new Date(expense.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 rounded-b-xl px-6 py-4 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              onClick={() => onEdit(expense)}
            >
              Edit Expense
            </button>
            <button
              className="w-full sm:w-auto bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 px-6 py-3 rounded-lg font-medium transition-colors"
              onClick={() => onDelete(expense)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 