import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpenseModal from '../ExpenseModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockExpense } from '../../test/fixtures/expenseMocks';

// Mock child components
vi.mock('../CategorySelect', () => ({
  __esModule: true,
  default: ({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) => (
    <select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>
      <option value="other">Other</option>
      <option value="food">Food</option>
      <option value="housing">Housing</option>
    </select>
  )
}));

vi.mock('../RecurringDateSelector', () => ({
  __esModule: true,
  default: ({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) => (
    <div>
      <label htmlFor="recurring-date">{label}</label>
      <input id="recurring-date" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}));

vi.mock('../LiveRegion', () => ({
  __esModule: true,
  default: ({ message }: { message?: string }) => message ? <div data-testid="live-region">{message}</div> : null
}));

describe('ExpenseModal', () => {
  const onClose = vi.fn();
  const onSave = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    render(<ExpenseModal isOpen={false} onClose={onClose} onSave={onSave} mode="add" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders add mode with empty fields', () => {
    render(<ExpenseModal isOpen={true} onClose={onClose} onSave={onSave} mode="add" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toHaveValue('');
    expect(screen.getByLabelText('Amount *')).toHaveValue('');
    expect(screen.getByLabelText('Category *')).toHaveValue('other');
    expect(screen.getByLabelText('Due Date *')).toHaveValue('');
    expect(screen.getByLabelText('Notes')).toHaveValue('');
    expect(screen.getByRole('button', { name: /Add Expense/i })).toBeInTheDocument();
  });

  it('renders edit mode with expense data', () => {
    render(<ExpenseModal isOpen={true} onClose={onClose} onSave={onSave} mode="edit" expense={mockExpense} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toHaveValue(mockExpense.name);
    expect(screen.getByLabelText('Amount *')).toHaveValue(String(mockExpense.amount));
    expect(screen.getByLabelText('Category *')).toHaveValue(mockExpense.category);
    expect(screen.getByLabelText('Due Date *')).toHaveValue(mockExpense.due_date);
    expect(screen.getByLabelText('Notes')).toHaveValue('');
    expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<ExpenseModal isOpen={true} onClose={onClose} onSave={onSave} mode="add" />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('validates required fields and shows error', async () => {
    render(<ExpenseModal isOpen={true} onClose={onClose} onSave={onSave} mode="add" />);
    fireEvent.click(screen.getByRole('button', { name: /Add Expense/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Please fill in all required fields.').length).toBeGreaterThan(0);
      expect(screen.getByTestId('live-region')).toHaveTextContent('Please fill in all required fields.');
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('validates amount is a number', async () => {
    render(<ExpenseModal isOpen={true} onClose={onClose} onSave={onSave} mode="add" />);
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Groceries' } });
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: 'notanumber' } });
    fireEvent.change(screen.getByLabelText('Due Date *'), { target: { value: '2024-01-15' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Expense/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Please enter a valid amount.').length).toBeGreaterThan(0);
      expect(screen.getByTestId('live-region')).toHaveTextContent('Please enter a valid amount.');
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with correct data in add mode', async () => {
    render(<ExpenseModal isOpen={true} onClose={onClose} onSave={onSave} mode="add" />);
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Groceries' } });
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '123.45' } });
    fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'food' } });
    fireEvent.change(screen.getByLabelText('Due Date *'), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Weekly groceries' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Expense/i }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows and handles recurring fields', async () => {
    render(<ExpenseModal isOpen={true} onClose={onClose} onSave={onSave} mode="add" />);
    fireEvent.click(screen.getByLabelText('Recurring'));
    expect(screen.getByLabelText('Frequency *')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Frequency *'), { target: { value: 'monthly' } });
    expect(screen.getByLabelText('Date *')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Date *'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Rent' } });
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'housing' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Expense/i }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('validates recurring fields', async () => {
    render(<ExpenseModal isOpen={true} onClose={onClose} onSave={onSave} mode="add" />);
    fireEvent.click(screen.getByLabelText('Recurring'));
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Groceries' } });
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Due Date *'), { target: { value: '2024-01-15' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Expense/i }));
    await waitFor(() => {
      expect(screen.getByTestId('live-region')).toHaveTextContent('Please select a recurring frequency.');
    });
  });

  it('shows saving state', async () => {
    const slowSave = vi.fn(() => new Promise<void>(res => setTimeout(res, 100)));
    render(<ExpenseModal isOpen={true} onClose={onClose} onSave={slowSave} mode="add" />);
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Groceries' } });
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '123.45' } });
    fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'food' } });
    fireEvent.change(screen.getByLabelText('Due Date *'), { target: { value: '2024-01-15' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Expense/i }));
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    await waitFor(() => expect(slowSave).toHaveBeenCalled());
  });

  it('shows error if onSave throws', async () => {
    const errorSave = vi.fn(() => Promise.reject<void>());
    render(<ExpenseModal isOpen={true} onClose={onClose} onSave={errorSave} mode="add" />);
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Groceries' } });
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '123.45' } });
    fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'food' } });
    fireEvent.change(screen.getByLabelText('Due Date *'), { target: { value: '2024-01-15' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Expense/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Failed to save expense.').length).toBeGreaterThan(0);
      expect(screen.getByTestId('live-region')).toHaveTextContent('Failed to save expense.');
    });
  });

  it('has correct accessibility attributes', () => {
    render(<ExpenseModal isOpen={true} onClose={onClose} onSave={onSave} mode="add" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'expense-modal-title');
    expect(screen.getByLabelText('Name *')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('Amount *')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('Due Date *')).toHaveAttribute('aria-required', 'true');
  });
}); 