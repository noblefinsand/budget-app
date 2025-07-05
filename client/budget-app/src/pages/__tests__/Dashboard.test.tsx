import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockExpense } from '../../test/fixtures/expenseMocks';

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' })
}));

// Mock the contexts
const mockLogout = vi.fn();
const mockDeleteExpense = vi.fn(() => Promise.resolve(true));
const mockUpdateExpense = vi.fn(() => Promise.resolve(true));

// Create mock context values
const mockAuthContext = {
  user: { email: 'test@example.com' },
  logout: mockLogout
};

const mockProfileContext = {
  profile: {
    display_name: 'Test User',
    avatar_id: 'cat',
    currency: 'USD',
    has_completed_welcome: true
  },
  loading: false
};

const mockExpensesContext = {
  expenses: [mockExpense],
  loading: false,
  deleteExpense: mockDeleteExpense,
  updateExpense: mockUpdateExpense
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

vi.mock('../../context/ProfileContext', () => ({
  useProfile: () => mockProfileContext
}));

vi.mock('../../context/ExpensesContext', () => ({
  useExpenses: () => mockExpensesContext
}));

// Mock child components
vi.mock('../../components/WelcomeModal', () => ({
  __esModule: true,
  default: ({ isOpen, onComplete }: { isOpen: boolean; onComplete: () => void }) => 
    isOpen ? (
      <div data-testid="welcome-modal">
        <button onClick={onComplete}>Complete Welcome</button>
      </div>
    ) : null
}));

vi.mock('../../components/ExpenseCalendar', () => ({
  __esModule: true,
  default: ({ expenses, onEventClick }: { expenses: unknown[]; onEventClick: (expense: unknown) => void }) => (
    <div data-testid="expense-calendar">
      {expenses.map((expense: unknown) => (
        <button 
          key={(expense as { id: string })?.id} 
          onClick={() => onEventClick(expense)}
          data-testid={`calendar-event-${(expense as { id: string })?.id}`}
        >
          {(expense as { name: string })?.name}
        </button>
      ))}
    </div>
  )
}));

vi.mock('../../components/ExpenseViewModal', () => ({
  __esModule: true,
  default: ({ expense, isOpen, onClose, onEdit, onDelete }: { expense: unknown; isOpen: boolean; onClose: () => void; onEdit: (expense: unknown) => void; onDelete: (expense: unknown) => void }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="expense-view-modal">
        <h2>{(expense as { name: string })?.name}</h2>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onEdit(expense)}>Edit</button>
        <button onClick={() => onDelete(expense)}>Delete</button>
      </div>
    );
  }
}));

vi.mock('../../components/ExpenseModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSave, mode }: { isOpen: boolean; onClose: () => void; onSave: (expense: unknown) => Promise<void>; expense: unknown; mode: string }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="expense-modal">
        <h2>{mode === 'edit' ? 'Edit Expense' : 'Add Expense'}</h2>
        <button onClick={onClose}>Close</button>
        <button onClick={async () => {
          try {
            await onSave({
              name: 'Updated Expense',
              amount: 100,
              due_date: '2024-01-20',
              category: 'food',
              is_recurring: false,
              recurring_frequency: null,
              recurring_pattern: null,
              notes: 'Updated notes'
            });
            onClose();
          } catch {
            // Error is handled by the component
          }
        }}>Save</button>
      </div>
    );
  }
}));

vi.mock('../../components/DeleteConfirmationModal', () => ({
  __esModule: true,
  default: ({ expense, isOpen, onClose, onConfirm, isDeleting }: { expense: unknown; isOpen: boolean; onClose: () => void; onConfirm: () => Promise<void>; isDeleting: boolean }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="delete-confirmation-modal">
        <h2>Delete {(expense as { name: string })?.name}?</h2>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    );
  }
}));

vi.mock('../../components/Header', () => ({
  __esModule: true,
  default: ({ displayName, avatarId, onLogout }: { displayName: string; avatarId: string; onLogout: () => void }) => (
    <header data-testid="header">
      <span>Welcome, {displayName}</span>
      <span>Avatar: {avatarId}</span>
      <button onClick={onLogout}>Logout</button>
    </header>
  )
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset context values
    Object.assign(mockProfileContext, {
      profile: {
        display_name: 'Test User',
        avatar_id: 'cat',
        currency: 'USD',
        has_completed_welcome: true
      },
      loading: false
    });
    
    Object.assign(mockExpensesContext, {
      expenses: [mockExpense],
      loading: false,
      deleteExpense: mockDeleteExpense,
      updateExpense: mockUpdateExpense
    });
  });

  it('renders dashboard with header and calendar', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('expense-calendar')).toBeInTheDocument();
  });

  it('displays user information in header', () => {
    render(<Dashboard />);
    expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
    expect(screen.getByText('Avatar: cat')).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    Object.assign(mockProfileContext, {
      profile: null,
      loading: true
    });
    
    render(<Dashboard />);
    expect(screen.getByText('Loading expenses...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows welcome modal for new users', () => {
    Object.assign(mockProfileContext, {
      profile: {
        display_name: 'Test User',
        avatar_id: 'cat',
        currency: 'USD',
        has_completed_welcome: false
      },
      loading: false
    });
    
    render(<Dashboard />);
    expect(screen.getByTestId('welcome-modal')).toBeInTheDocument();
  });

  it('navigates to expenses page when welcome is completed', () => {
    Object.assign(mockProfileContext, {
      profile: {
        display_name: 'Test User',
        avatar_id: 'cat',
        currency: 'USD',
        has_completed_welcome: false
      },
      loading: false
    });
    
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Complete Welcome'));
    expect(mockNavigate).toHaveBeenCalledWith('/expenses');
  });

  it('opens expense view modal when calendar event is clicked', () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByTestId(`calendar-event-${mockExpense.id}`));
    expect(screen.getByTestId('expense-view-modal')).toBeInTheDocument();
    // There may be multiple elements with the same text, so check that at least one matches
    const nameElements = screen.getAllByText(mockExpense.name);
    expect(nameElements.length).toBeGreaterThan(0);
  });

  it('closes expense view modal when close is clicked', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByTestId(`calendar-event-${mockExpense.id}`));
    expect(screen.getByTestId('expense-view-modal')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Close'));
    await waitFor(() => {
      expect(screen.queryByTestId('expense-view-modal')).not.toBeInTheDocument();
    });
  });

  it('opens edit modal when edit is clicked from view modal', () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByTestId(`calendar-event-${mockExpense.id}`));
    fireEvent.click(screen.getByText('Edit'));
    
    expect(screen.getByTestId('expense-modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Expense')).toBeInTheDocument();
  });

  it('opens delete confirmation modal when delete is clicked from view modal', () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByTestId(`calendar-event-${mockExpense.id}`));
    fireEvent.click(screen.getByText('Delete'));
    
    expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
    expect(screen.getByText(`Delete ${mockExpense.name}?`)).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalled();
  });

  it.skip('handles expense update successfully', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByTestId(`calendar-event-${mockExpense.id}`));
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(mockUpdateExpense).toHaveBeenCalledWith(mockExpense.id, {
        name: 'Updated Expense',
        amount: 100,
        due_date: '2024-01-20',
        category: 'food',
        is_recurring: false,
        recurring_frequency: undefined,
        recurring_pattern: null,
        notes: 'Updated notes'
      });
    });
    
    expect(screen.queryByTestId('expense-modal')).not.toBeInTheDocument();
  });

  it('handles expense deletion successfully', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByTestId(`calendar-event-${mockExpense.id}`));
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Delete'));
    
    await waitFor(() => {
      expect(mockDeleteExpense).toHaveBeenCalledWith(mockExpense.id);
    });
    
    expect(screen.queryByTestId('delete-confirmation-modal')).not.toBeInTheDocument();
  });

  it('shows loading state during deletion', async () => {
    mockDeleteExpense.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
    
    render(<Dashboard />);
    fireEvent.click(screen.getByTestId(`calendar-event-${mockExpense.id}`));
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Delete'));
    
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByText('Deleting...')).toBeDisabled();
  });

  it('cancels deletion when cancel is clicked', () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByTestId(`calendar-event-${mockExpense.id}`));
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(screen.queryByTestId('delete-confirmation-modal')).not.toBeInTheDocument();
    expect(mockDeleteExpense).not.toHaveBeenCalled();
  });

  it('closes edit modal when close is clicked', () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByTestId(`calendar-event-${mockExpense.id}`));
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Close'));
    
    expect(screen.queryByTestId('expense-modal')).not.toBeInTheDocument();
  });

  it('handles update failure', async () => {
    mockUpdateExpense.mockResolvedValue(false);
    
    render(<Dashboard />);
    fireEvent.click(screen.getByTestId(`calendar-event-${mockExpense.id}`));
    fireEvent.click(screen.getByText('Edit'));
    
    // The error should be thrown but caught by the component
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(mockUpdateExpense).toHaveBeenCalled();
    });
  });

  it('has correct accessibility attributes', () => {
    render(<Dashboard />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('handles empty expenses array', () => {
    Object.assign(mockExpensesContext, {
      expenses: [],
      loading: false,
      deleteExpense: mockDeleteExpense,
      updateExpense: mockUpdateExpense
    });
    
    render(<Dashboard />);
    expect(screen.getByTestId('expense-calendar')).toBeInTheDocument();
  });
}); 