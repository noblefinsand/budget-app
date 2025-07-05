import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import BudgetTime from '../BudgetTime';
import { profileService } from '../../services/profileService';
import { expenseService } from '../../services/expenseService';
import { useAuth } from '../../context/AuthContext';
import type { ExpenseCategory, RecurringFrequency } from '../../types/expense';
import type { PaycheckFrequency } from '../../types/profile';

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock services
vi.mock('../../services/profileService');
vi.mock('../../services/expenseService');

// Mock context
vi.mock('../../context/AuthContext');
const mockUseAuth = vi.mocked(useAuth);

// Mock child components
vi.mock('../../components/Header', () => ({
  default: ({ displayName, onLogout }: { displayName: string; onLogout: () => void }) => (
    <header data-testid="header">
      <span>Header: {displayName}</span>
      <button onClick={onLogout}>Logout</button>
    </header>
  ),
}));

vi.mock('../../components/LiveRegion', () => ({
  default: ({ message }: { message?: string }) => (
    <div data-testid="live-region" aria-live="polite">
      {message}
    </div>
  ),
}));

// Mock utilities
vi.mock('../../utils/dateFormat', () => ({
  getCurrentBudgetPeriod: vi.fn(() => ({
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-15'),
  })),
  generateRecurringDates: vi.fn(() => [new Date('2024-01-05')]),
  formatDueDateForDisplay: vi.fn(() => 'Jan 5'),
  formatSpecificDateForDisplay: vi.fn(() => 'Jan 5'),
}));

vi.mock('../../utils/currencyFormat', () => ({
  formatCurrency: vi.fn((amount: number) => `$${amount.toFixed(2)}`),
  parseCurrencyInput: vi.fn((input: string) => {
    const parsed = parseFloat(input.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? NaN : parsed;
  }),
}));

function renderBudgetTime() {
  return render(
    <BrowserRouter>
      <BudgetTime />
    </BrowserRouter>
  );
}

describe('BudgetTime Page', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockProfile = {
    id: 'profile-123',
    user_id: 'user-123',
    display_name: 'Test User',
    avatar_id: 'cat',
    currency: 'USD',
    paycheck_reference_date: '2024-01-01',
    paycheck_frequency: 'bi-weekly' as PaycheckFrequency,
    timezone: 'UTC',
    has_completed_welcome: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockExpenses = [
    {
      id: 'expense-1',
      name: 'Rent',
      amount: 1200,
      due_date: '2024-01-05',
      is_recurring: true,
      category: 'housing' as ExpenseCategory,
      notes: null,
      status: 'pending' as import('../../types/expense').ExpenseStatus,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'user-123',
      recurring_frequency: 'monthly' as RecurringFrequency,
      recurring_pattern: 'monthly',
    },
    {
      id: 'expense-2',
      name: 'Groceries',
      amount: 300,
      due_date: '2024-01-10',
      is_recurring: false,
      category: 'food' as ExpenseCategory,
      notes: null,
      status: 'pending' as import('../../types/expense').ExpenseStatus,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'user-123',
      recurring_frequency: null,
      recurring_pattern: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      logout: vi.fn(),
      login: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn(),
      clearError: vi.fn(),
      error: null,
      loading: false,
    });

    vi.mocked(profileService.getProfile).mockResolvedValue(mockProfile);
    vi.mocked(expenseService.getExpenses).mockResolvedValue(mockExpenses);
  });

  it('renders loading state initially', () => {
    renderBudgetTime();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading budget time')).toBeInTheDocument();
  });

  it('renders main content after loading', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByText('Budget Time')).toBeInTheDocument();
    });

    expect(screen.getByText('Header: Test User')).toBeInTheDocument();
    expect(screen.getByLabelText('Paycheck Amount')).toBeInTheDocument();
    expect(screen.getByText('Expenses This Period')).toBeInTheDocument();
    expect(screen.getByText('Add One-Time Expense')).toBeInTheDocument();
    expect(screen.getAllByText('Amount Left')).toHaveLength(2); // Mobile + Desktop summaries
  });

  it('displays current period information', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByText('Current Period:')).toBeInTheDocument();
    });

    expect(screen.getByText(/Dec 31, 2023 – Jan 14, 2024/)).toBeInTheDocument();
  });

  it('allows manual period override', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByLabelText('Use custom budget period')).toBeInTheDocument();
    });

    const manualPeriodCheckbox = screen.getByLabelText('Use custom budget period');
    fireEvent.click(manualPeriodCheckbox);

    expect(screen.getByLabelText('Period Start')).toBeInTheDocument();
    expect(screen.getByLabelText('Period End')).toBeInTheDocument();
    expect(screen.getByText('Custom Period:')).toBeInTheDocument();
  });

  it('handles paycheck amount input', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByLabelText('Paycheck Amount')).toBeInTheDocument();
    });

    const paycheckInput = screen.getByLabelText('Paycheck Amount');
    fireEvent.change(paycheckInput, { target: { value: '2500' } });

    expect(paycheckInput).toHaveValue('2500');
  });

  it('displays expenses with correct information', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getAllByText(/300\.00/)).toHaveLength(5); // Multiple instances expected (mobile + desktop + expense list)
    expect(screen.getAllByText('One-Time')).toHaveLength(1); // Only one instance expected
  });

  it('allows excluding expenses', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    const excludeSwitch = screen.getByRole('switch', { name: /exclude/i });
    fireEvent.click(excludeSwitch);

    expect(excludeSwitch).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Excluded')).toBeInTheDocument();
  });

  it('handles adding one-time expenses', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Name/);
    const amountInput = screen.getByLabelText('Amount *');
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(nameInput, { target: { value: 'Movie Tickets' } });
    fireEvent.change(amountInput, { target: { value: '50' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Movie Tickets')).toBeInTheDocument();
    });

    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getAllByText('One-Time')).toHaveLength(2); // Two instances expected (original + new)
  });

  it('validates one-time expense form', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Amount is required')).toBeInTheDocument();
  });

  it('allows removing one-time expenses', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    });

    // Add a one-time expense first
    const nameInput = screen.getByLabelText(/Name/);
    const amountInput = screen.getByLabelText('Amount *');
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(nameInput, { target: { value: 'Movie Tickets' } });
    fireEvent.change(amountInput, { target: { value: '50' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Movie Tickets')).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('Movie Tickets')).not.toBeInTheDocument();
    });
  });

  it('calculates budget correctly', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByLabelText('Paycheck Amount')).toBeInTheDocument();
    });

    const paycheckInput = screen.getByLabelText('Paycheck Amount');
    fireEvent.change(paycheckInput, { target: { value: '2500' } });

    // Wait for calculations to update
    await waitFor(() => {
      expect(screen.getAllByText(/2200\.00/)).toHaveLength(2); // Mobile + Desktop summaries
    });

    expect(screen.getAllByText(/Included:.*300\.00/)).toHaveLength(2); // Mobile + Desktop
    expect(screen.getAllByText(/Excluded:.*0\.00/)).toHaveLength(2); // Mobile + Desktop
  });

  it('updates calculations when expenses are excluded', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    const excludeSwitch = screen.getByRole('switch', { name: /exclude/i });
    fireEvent.click(excludeSwitch);

    await waitFor(() => {
      // Now we have both mobile and desktop summaries, so we expect multiple instances
      expect(screen.getAllByText(/Included:.*0\.00/)).toHaveLength(2); // Mobile + Desktop
      expect(screen.getAllByText(/Excluded:.*300\.00/)).toHaveLength(2); // Mobile + Desktop
    });
  });

  it('handles manual period date inputs', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByLabelText('Use custom budget period')).toBeInTheDocument();
    });

    const manualPeriodCheckbox = screen.getByLabelText('Use custom budget period');
    fireEvent.click(manualPeriodCheckbox);

    const startInput = screen.getByLabelText('Period Start');
    const endInput = screen.getByLabelText('Period End');

    fireEvent.change(startInput, { target: { value: '2024-01-10' } });
    fireEvent.change(endInput, { target: { value: '2024-01-25' } });

    expect(startInput).toHaveValue('2024-01-10');
    expect(endInput).toHaveValue('2024-01-25');
  });

  it('provides accessibility features', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByText('Budget Time')).toBeInTheDocument();
    });

    // Check for proper form structure
    expect(screen.getByLabelText('Paycheck Amount')).toHaveAttribute('aria-describedby');
    expect(screen.getByLabelText(/Name/)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('Amount *')).toHaveAttribute('aria-required', 'true');
    
    // Check for live region
    expect(screen.getByTestId('live-region')).toHaveAttribute('aria-live', 'polite');
    
    // Check for main content landmark
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('handles logout', async () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      login: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn(),
      clearError: vi.fn(),
      error: null,
      loading: false,
    });

    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('displays live messages for user actions', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    const excludeSwitch = screen.getByRole('switch', { name: /exclude/i });
    fireEvent.click(excludeSwitch);

    await waitFor(() => {
      expect(screen.getByTestId('live-region')).toHaveTextContent(/excluded from budget calculations/);
    });
  });

  it.skip('shows progress bar for budget usage', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByLabelText('Paycheck Amount')).toBeInTheDocument();
    });

    const paycheckInput = screen.getByLabelText('Paycheck Amount');
    fireEvent.change(paycheckInput, { target: { value: '2000' } });

    // Progress bar should be visible (using a more flexible query)
    const progressBar = screen.getByText('Amount Left').closest('div')?.querySelector('.bg-green-500');
    expect(progressBar).toBeTruthy();
    
    // Alternative: check that the progress bar container exists
    const progressContainer = screen.getByText('Amount Left').closest('div')?.querySelector('.bg-gray-700');
    expect(progressContainer).toBeTruthy();
  });

  it('handles currency formatting correctly', async () => {
    const mockProfileWithEUR = {
      ...mockProfile,
      currency: 'EUR',
    };

    vi.mocked(profileService.getProfile).mockResolvedValue(mockProfileWithEUR);

    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByText('Budget Time')).toBeInTheDocument();
    });

    // Currency formatting should be applied - now we have more instances due to mobile + desktop summaries
    expect(screen.getAllByText(/300\.00/)).toHaveLength(5); // Multiple instances expected (mobile + desktop + expense list)
  });

  it('displays next payday information for manual periods', async () => {
    renderBudgetTime();

    await waitFor(() => {
      expect(screen.getByLabelText('Use custom budget period')).toBeInTheDocument();
    });

    const manualPeriodCheckbox = screen.getByLabelText('Use custom budget period');
    fireEvent.click(manualPeriodCheckbox);

    const startInput = screen.getByLabelText('Period Start');
    const endInput = screen.getByLabelText('Period End');

    fireEvent.change(startInput, { target: { value: '2024-01-10' } });
    fireEvent.change(endInput, { target: { value: '2024-01-25' } });

    await waitFor(() => {
      expect(screen.getByText(/Next normal payday:/)).toBeInTheDocument();
    });
  });
}); 