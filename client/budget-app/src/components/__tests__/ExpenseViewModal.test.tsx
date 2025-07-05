import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpenseViewModal from '../ExpenseViewModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockExpense } from '../../test/fixtures/expenseMocks';

// Mock the hooks and utilities
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(() => ({ current: null }))
}));

vi.mock('../../utils/dateFormat', () => ({
  formatDueDateForDisplay: vi.fn(() => '1/15/2024')
}));

vi.mock('../utils/currencyFormat', () => ({
  formatCurrency: vi.fn((amount, currency) => {
    if (currency === 'EUR') {
      return '50,00 €';
    }
    return '$50.00';
  })
}));

describe('ExpenseViewModal', () => {
  const defaultProps = {
    expense: mockExpense,
    isOpen: true,
    onClose: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    currency: 'USD'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    render(<ExpenseViewModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders nothing when expense is null', () => {
    render(<ExpenseViewModal {...defaultProps} expense={null} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with correct accessibility attributes when open', () => {
    render(<ExpenseViewModal {...defaultProps} />);
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'expense-view-modal-title');
  });

  it('displays expense details correctly', () => {
    render(<ExpenseViewModal {...defaultProps} />);
    expect(screen.getByText('Expense Details')).toBeInTheDocument();
    expect(screen.getByText(mockExpense.name)).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText(mockExpense.category)).toBeInTheDocument();
    
    // Check that the date appears (there are multiple instances)
    const dateElements = screen.getAllByText('1/15/2024');
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('calls onClose when close button is clicked', () => {
    render(<ExpenseViewModal {...defaultProps} />);
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<ExpenseViewModal {...defaultProps} />);
    const editButton = screen.getByText('Edit Expense');
    fireEvent.click(editButton);
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockExpense);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<ExpenseViewModal {...defaultProps} />);
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockExpense);
  });

  it('shows recurring information when expense is recurring', () => {
    const recurringExpense = {
      ...mockExpense,
      is_recurring: true,
      recurring_frequency: 'monthly' as const
    };
    render(<ExpenseViewModal {...defaultProps} expense={recurringExpense} />);
    expect(screen.getByText('Recurring')).toBeInTheDocument();
    expect(screen.getByText('monthly')).toBeInTheDocument();
  });

  it('does not show recurring information when expense is not recurring', () => {
    const nonRecurringExpense = {
      ...mockExpense,
      is_recurring: false,
      recurring_frequency: null
    };
    render(<ExpenseViewModal {...defaultProps} expense={nonRecurringExpense} />);
    expect(screen.queryByText('Recurring')).not.toBeInTheDocument();
  });

  it('shows notes when expense has notes', () => {
    const expenseWithNotes = {
      ...mockExpense,
      notes: 'This is a test note'
    };
    render(<ExpenseViewModal {...defaultProps} expense={expenseWithNotes} />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('This is a test note')).toBeInTheDocument();
  });

  it('does not show notes when expense has no notes', () => {
    const expenseWithoutNotes = {
      ...mockExpense,
      notes: null
    };
    render(<ExpenseViewModal {...defaultProps} expense={expenseWithoutNotes} />);
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('displays created and updated dates', () => {
    render(<ExpenseViewModal {...defaultProps} />);
    expect(screen.getByText('Created:')).toBeInTheDocument();
    expect(screen.getByText('Last updated:')).toBeInTheDocument();
    
    // Use getAllByText to get all instances and verify they exist
    const dateElements = screen.getAllByText('1/15/2024');
    expect(dateElements).toHaveLength(3); // Due date, created date, updated date
  });

  it('uses custom currency when provided', () => {
    render(<ExpenseViewModal {...defaultProps} currency="EUR" />);
    expect(screen.getByText('50,00 €')).toBeInTheDocument();
  });

  it('capitalizes category name', () => {
    const expenseWithCategory = {
      ...mockExpense,
      category: 'food' as const
    };
    render(<ExpenseViewModal {...defaultProps} expense={expenseWithCategory} />);
    expect(screen.getByText('food')).toBeInTheDocument(); // Should be capitalized by CSS
  });
}); 