import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteConfirmationModal from '../DeleteConfirmationModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockExpense } from '../../test/fixtures/expenseMocks';

// Mock the hooks and utilities
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(() => ({ current: null }))
}));

vi.mock('../../utils/dateFormat', () => ({
  formatDueDateForDisplay: vi.fn(() => 'Jan 15, 2024')
}));

vi.mock('../utils/currencyFormat', () => ({
  formatCurrency: vi.fn(() => '$50.00')
}));

describe('DeleteConfirmationModal', () => {
  const defaultProps = {
    expense: mockExpense,
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    isDeleting: false,
    currency: 'USD'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    render(<DeleteConfirmationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders nothing when expense is null', () => {
    render(<DeleteConfirmationModal {...defaultProps} expense={null} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with correct accessibility attributes when open', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'delete-modal-title');
  });

  it('displays expense details correctly', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Delete Expense')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this expense?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByText(mockExpense.name)).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when delete button is clicked', async () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state when isDeleting is true', () => {
    render(<DeleteConfirmationModal {...defaultProps} isDeleting={true} />);
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('disables buttons when isDeleting is true', () => {
    render(<DeleteConfirmationModal {...defaultProps} isDeleting={true} />);
    const cancelButton = screen.getByText('Cancel');
    const deleteButton = screen.getByText('Deleting...');
    expect(cancelButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  it('uses custom currency when provided', () => {
    render(<DeleteConfirmationModal {...defaultProps} currency="EUR" />);
    // Check that the formatted currency is displayed (actual rendered value)
    expect(screen.getByText(/50,00 €/)).toBeInTheDocument();
  });
}); 