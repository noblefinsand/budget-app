import React from 'react';
import type { Expense } from '../types/expense';
import { formatDueDateForDisplay } from '../../utils/dateFormat';
import { formatCurrency } from '../utils/currencyFormat';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface DeleteConfirmationModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  currency?: string;
}

export default function DeleteConfirmationModal({ 
  expense, 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting,
  currency = 'USD'
}: DeleteConfirmationModalProps) {
  // Focus trap for modal
  const modalRef = useFocusTrap({
    isActive: isOpen,
    onEscape: onClose
  });

  if (!isOpen || !expense) return null;



  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div ref={modalRef} className="bg-gray-800 rounded-xl shadow-lg w-full max-w-md md:w-1/2 md:max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 rounded-t-xl px-6 py-4 border-b border-gray-700 flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 id="delete-modal-title" className="text-lg md:text-xl font-bold text-white">Delete Expense</h3>
        </div>
        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-300 mb-2">
            Are you sure you want to delete this expense?
          </p>
          <div className="bg-gray-700 rounded-lg p-3 mb-2">
            <p className="text-white font-medium">{expense.name}</p>
            <p className="text-gray-400 text-sm">
              {formatCurrency(expense.amount, currency)} • Due {formatDueDateForDisplay(expense)}
            </p>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            This action cannot be undone.
          </p>
        </div>
        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 rounded-b-xl px-6 py-4 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-300 hover:text-white font-medium"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="w-full sm:w-auto px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg font-medium disabled:opacity-50 transition-colors duration-200"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 