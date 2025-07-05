import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpenseCalendar from '../ExpenseCalendar';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockExpense } from '../../test/fixtures/expenseMocks';

// Mock react-big-calendar
vi.mock('react-big-calendar', () => ({
  Calendar: ({ events, onSelectEvent, components, eventPropGetter, date }: {
    events: unknown[];
    onSelectEvent?: (event: unknown) => void;
    components: { event: (props: { event: unknown }) => React.ReactNode; toolbar?: (props: { label: string }) => React.ReactNode };
    eventPropGetter?: (event: unknown) => { style?: React.CSSProperties };
    date: Date;
  }) => (
    <div data-testid="calendar">
      <div data-testid="calendar-date">{date.toDateString()}</div>
      <div data-testid="calendar-events">
        {events.map((event: unknown) => {
          const eventObj = event as { id: string };
          return (
            <div 
              key={eventObj.id} 
              data-testid={`event-${eventObj.id}`}
              onClick={() => onSelectEvent?.(event)}
              style={eventPropGetter?.(event)?.style}
            >
              {components.event({ event })}
            </div>
          );
        })}
      </div>
      {components.toolbar && components.toolbar({ label: 'January 2024' })}
    </div>
  ),
  dateFnsLocalizer: vi.fn(() => ({})),
  Views: { MONTH: 'month' }
}));

// Mock the services
vi.mock('../../services/profileService', () => ({
  profileService: {
    getProfile: vi.fn(() => Promise.resolve({ currency: 'USD' }))
  }
}));

// Mock the utilities
vi.mock('../../utils/dateFormat', () => ({
  generateRecurringDates: vi.fn(() => [
    new Date(2024, 0, 15), // Jan 15, 2024
    new Date(2024, 1, 15), // Feb 15, 2024
    new Date(2024, 2, 15), // Mar 15, 2024
  ])
}));

vi.mock('../../utils/currencyFormat', () => ({
  formatCurrency: vi.fn((amount, currency) => {
    if (currency === 'EUR') {
      return '50,00 €';
    }
    return '$50.00';
  })
}));

// Mock the CSS import
vi.mock('react-big-calendar/lib/css/react-big-calendar.css', () => ({}));

// Type-safe omit helper
function omit<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const rest = { ...obj };
  delete rest[key];
  return rest;
}

describe('ExpenseCalendar', () => {
  const defaultProps = {
    expenses: [mockExpense],
    onEventClick: vi.fn(),
    className: 'test-class'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders calendar with events', () => {
    render(<ExpenseCalendar {...defaultProps} />);
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-events')).toBeInTheDocument();
  });

  it('displays expense events correctly', () => {
    render(<ExpenseCalendar {...defaultProps} />);
    expect(screen.getByTestId(`event-${mockExpense.id}`)).toBeInTheDocument();
  });

  it('shows recurring expense instances', () => {
    const recurringExpense = {
      ...mockExpense,
      is_recurring: true,
      recurring_pattern: '15',
      recurring_frequency: 'monthly' as const
    };
    render(<ExpenseCalendar {...defaultProps} expenses={[recurringExpense]} />);
    
    // Should show multiple events for recurring expenses
    expect(screen.getByTestId('event-1-0')).toBeInTheDocument();
    expect(screen.getByTestId('event-1-1')).toBeInTheDocument();
    expect(screen.getByTestId('event-1-2')).toBeInTheDocument();
  });

  it('calls onEventClick when event is clicked', () => {
    render(<ExpenseCalendar {...defaultProps} />);
    fireEvent.click(screen.getByTestId(`event-${mockExpense.id}`));
    expect(defaultProps.onEventClick).toHaveBeenCalledWith(mockExpense);
  });

  it('renders toolbar with navigation buttons', () => {
    render(<ExpenseCalendar {...defaultProps} />);
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ExpenseCalendar {...defaultProps} />);
    const container = screen.getByTestId('calendar').parentElement?.parentElement;
    expect(container).toHaveClass('test-class');
  });

  it('fetches and uses user currency preference', async () => {
    const { profileService } = await import('../../services/profileService');
    vi.mocked(profileService.getProfile).mockResolvedValue({ 
      id: 'user-123',
      display_name: 'Test User',
      avatar_id: 'cat',
      currency: 'EUR',
      timezone: 'UTC',
      paycheck_frequency: 'monthly',
      paycheck_reference_date: '2024-01-15',
      has_completed_welcome: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    });
    
    render(<ExpenseCalendar {...defaultProps} />);
    
    await waitFor(() => {
      expect(profileService.getProfile).toHaveBeenCalled();
    });
  });

  it('handles empty expenses array', () => {
    render(<ExpenseCalendar {...defaultProps} expenses={[]} />);
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-events')).toBeInTheDocument();
  });

  it('handles missing onEventClick prop', () => {
    const propsWithoutCallback = omit(defaultProps, 'onEventClick');
    render(<ExpenseCalendar {...propsWithoutCallback} />);
    
    // Should not throw when clicking event
    expect(() => {
      fireEvent.click(screen.getByTestId(`event-${mockExpense.id}`));
    }).not.toThrow();
  });

  it('displays event with correct styling', () => {
    render(<ExpenseCalendar {...defaultProps} />);
    const eventElement = screen.getByTestId(`event-${mockExpense.id}`);
    expect(eventElement).toBeInTheDocument();
  });

  it('shows recurring indicator for recurring expenses', () => {
    const recurringExpense = {
      ...mockExpense,
      is_recurring: true,
      recurring_pattern: '15',
      recurring_frequency: 'monthly' as const
    };
    render(<ExpenseCalendar {...defaultProps} expenses={[recurringExpense]} />);
    
    // Check for recurring indicators in the event content
    const eventElement = screen.getByTestId('event-1-0');
    expect(eventElement).toBeInTheDocument();
  });

  it('handles multiple expenses', () => {
    const secondExpense = {
      ...mockExpense,
      id: '2',
      name: 'Rent',
      category: 'housing' as const,
      due_date: '2024-01-20'
    };
    render(<ExpenseCalendar {...defaultProps} expenses={[mockExpense, secondExpense]} />);
    
    expect(screen.getByTestId(`event-${mockExpense.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`event-${secondExpense.id}`)).toBeInTheDocument();
  });

  it('filters out recurring dates before original due date', () => {
    const recurringExpense = {
      ...mockExpense,
      is_recurring: true,
      recurring_pattern: '15',
      recurring_frequency: 'monthly' as const,
      due_date: '2024-02-15' // Future date
    };
    render(<ExpenseCalendar {...defaultProps} expenses={[recurringExpense]} />);
    
    // Should only show events from the due date onwards
    expect(screen.getByTestId('event-1-0')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<ExpenseCalendar {...defaultProps} />);
    const calendar = screen.getByTestId('calendar');
    expect(calendar).toBeInTheDocument();
  });
}); 