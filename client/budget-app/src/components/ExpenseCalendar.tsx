import { useState, useMemo, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import type { Expense } from '../types/expense';
import { CATEGORY_COLORS } from '../types/expense';
import { profileService } from '../services/profileService';
import { generateRecurringDates } from '../utils/dateFormat';
import { formatCurrency } from '../utils/currencyFormat';
import React from 'react';

// Import calendar styles
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { enUS } from 'date-fns/locale/en-US';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Expense;
  color: string;
}

interface ExpenseCalendarProps {
  expenses: Expense[];
  onEventClick?: (expense: Expense) => void;
  className?: string;
}

// Helper to parse YYYY-MM-DD as local date
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function ExpenseCalendar({ expenses, onEventClick, className = '' }: ExpenseCalendarProps) {
  const [currency, setCurrency] = useState('USD');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch user's currency preference
  useEffect(() => {
    const fetchCurrency = async () => {
      const profile = await profileService.getProfile();
      if (profile?.currency) setCurrency(profile.currency);
    };
    fetchCurrency();
  }, []);



  // Convert expenses to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    
    expenses.forEach(expense => {
      if (expense.is_recurring && expense.recurring_pattern && expense.recurring_frequency) {
        // Generate multiple events for recurring expenses
        const recurringDates = generateRecurringDates(
          expense.due_date,
          expense.recurring_pattern,
          expense.recurring_frequency,
          12 // Generate 12 months ahead
        );
        // Filter out dates that are before the original due date
        const originalDueDate = parseLocalDate(expense.due_date);
        const validDates = recurringDates.filter(date => date >= originalDueDate);
        validDates.forEach((date, index) => {
          allEvents.push({
            id: `${expense.id}-${index}`,
            title: `${expense.name} - ${formatCurrency(expense.amount, currency)}`,
            start: date,
            end: date,
            resource: expense,
            color: CATEGORY_COLORS[expense.category],
          });
        });
      } else {
        // Single event for non-recurring expenses
        const dueDate = parseLocalDate(expense.due_date);
        allEvents.push({
          id: expense.id,
          title: `${expense.name} - ${formatCurrency(expense.amount, currency)}`,
          start: dueDate,
          end: dueDate,
          resource: expense,
          color: CATEGORY_COLORS[expense.category],
        });
      }
    });
    return allEvents;
  }, [expenses, currency]);

  // Custom event component with category colors
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    // Check if this is a recurring event (has index in ID)
    const isRecurringInstance = event.id.includes('-');
    
    return (
      <>
        <span className="font-semibold truncate text-xs flex-1">{event.resource.name}</span>
        <span className="opacity-90 text-xs ml-1">{formatCurrency(event.resource.amount, currency)}</span>
        {event.resource.is_recurring && (
          <span 
            className="text-xs opacity-75 ml-1 hidden md:inline"
            title={isRecurringInstance ? 'Recurring expense instance' : 'Recurring expense'}
          >
            {isRecurringInstance ? '🔄' : '📅'}
          </span>
        )}
      </>
    );
  };

  // Custom toolbar with dark theme styling
  const CustomToolbar = (toolbar: { label: string }) => {
    const handleNavigate = (action: string) => {
      const newDate = new Date(currentDate);
      if (action === 'PREV') {
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
      } else if (action === 'NEXT') {
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
      } else if (action === 'TODAY') {
        setCurrentDate(new Date());
      }
    };

    return (
      <div className="mb-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleNavigate('PREV')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              ‹
            </button>
            <button
              onClick={() => handleNavigate('TODAY')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => handleNavigate('NEXT')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              ›
            </button>
          </div>
          <h2 className="text-xl font-semibold text-white">
            {toolbar.label}
          </h2>
        </div>
        {/* Category color key - horizontally scrollable on mobile */}
        <div className="mt-3 overflow-x-auto">
          <div className="flex flex-nowrap items-center space-x-4 min-w-max">
            {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
              <div key={category} className="flex items-center space-x-1 mb-1">
                <span
                  className="inline-block w-4 h-4 rounded-full border border-white/20 mr-1"
                  style={{ backgroundColor: color }}
                  title={category}
                />
                <span className="text-xs text-gray-300 capitalize">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gray-900 rounded-xl p-2 sm:p-4 w-full max-w-full overflow-hidden ${className}`}>
      <div className="w-full">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          views={['month']}
          view={Views.MONTH}
          date={currentDate}
          onView={() => {}}
          onNavigate={(date) => setCurrentDate(date)}
          components={{
            event: EventComponent,
            toolbar: CustomToolbar,
          }}
          eventPropGetter={(event) => {
            // Check if this is a recurring event instance
            const isRecurringInstance = event.id.includes('-');
            
            return {
              style: {
                backgroundColor: event.color,
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                fontSize: '1rem',
                opacity: isRecurringInstance ? 0.8 : 1,
              },
            };
          }}
          onSelectEvent={(event) => onEventClick?.(event.resource)}
          className="expense-calendar"
          dayLayoutAlgorithm="no-overlap"
          popup={true}
        />
      </div>
      <style>{`
        .expense-calendar {
          color: white;
          max-width: 100%;
          overflow-x: hidden;
        }
        .expense-calendar .rbc-calendar {
          background-color: #1f2937;
          color: white;
          max-width: 100%;
          overflow-x: hidden;
        }
        .expense-calendar .rbc-header {
          background-color: #374151;
          color: white;
          border-color: #4b5563;
          padding: 8px;
          font-weight: 600;
          font-size: 1rem;
        }
        .expense-calendar .rbc-month-view {
          border-color: #4b5563;
        }
        .expense-calendar .rbc-date-cell {
          color: white;
          padding: 4px 4px 8px 4px;
          font-size: 1rem;
        }
        .expense-calendar .rbc-off-range-bg {
          background-color: #374151;
        }
        .expense-calendar .rbc-off-range {
          color: #9ca3af;
        }
        .expense-calendar .rbc-today {
          background-color: #1e40af;
        }
        .expense-calendar .rbc-event {
          background-color: transparent;
          border: none;
          padding: 1px 6px;
          border-radius: 6px;
          font-size: 0.95rem;
          min-height: 16px;
          display: flex;
          align-items: center;
          white-space: normal;
        }
        .expense-calendar .rbc-event-content {
          padding: 0;
          display: flex;
          align-items: center;
          font-size: 0.95rem;
          min-height: 12px;
          word-break: break-word;
        }
        .expense-calendar .rbc-show-more {
          color: #3b82f6 !important;
          background: transparent !important;
          font-weight: 600;
          border-radius: 4px;
          padding: 1px 6px;
          transition: background 0.2s, color 0.2s;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .expense-calendar .rbc-show-more:hover {
          background: #2563eb !important;
          color: #fff !important;
        }
        .expense-calendar .rbc-time-view {
          border-color: #4b5563;
        }
        .expense-calendar .rbc-time-header {
          background-color: #374151;
          border-color: #4b5563;
        }
        .expense-calendar .rbc-time-content {
          border-color: #4b5563;
        }
        .expense-calendar .rbc-timeslot-group {
          border-color: #4b5563;
        }
        .expense-calendar .rbc-time-slot {
          border-color: #4b5563;
        }
        /* Custom dark theme for the popup overlay */
        .expense-calendar .rbc-overlay {
          background: #1f2937 !important;
          color: #fff !important;
          border-radius: 12px !important;
          border: 1px solid #374151 !important;
          box-shadow: 0 4px 24px 0 rgba(0,0,0,0.4);
        }
        .expense-calendar .rbc-overlay-header {
          background: #1f2937 !important;
          color: #fff !important;
          border-bottom: 1px solid #374151 !important;
        }
        /* Responsive adjustments for mobile */
        @media (max-width: 768px) {
          .expense-calendar .rbc-header,
          .expense-calendar .rbc-date-cell,
          .expense-calendar .rbc-event,
          .expense-calendar .rbc-event-content,
          .expense-calendar .rbc-show-more {
            font-size: 0.8rem;
          }
          .expense-calendar .rbc-event,
          .expense-calendar .rbc-event-content,
          .expense-calendar .rbc-show-more {
            padding: 1px 3px;
            border-radius: 4px;
            width: 100%;
            box-sizing: border-box;
            max-width: 100%;
          }
          .expense-calendar .rbc-header {
            padding: 4px 2px;
            font-size: 0.8rem;
          }
          .expense-calendar .rbc-date-cell {
            padding: 2px 2px 4px 2px;
            font-size: 0.8rem;
          }
        }
        /* Ensure no horizontal scroll on all screen sizes */
        .expense-calendar .rbc-month-view,
        .expense-calendar .rbc-time-view {
          max-width: 100%;
          overflow-x: hidden;
        }
        @media (max-width: 640px) {
          .expense-calendar .min-w-max {
            min-width: 600px;
          }
        }
      `}</style>
    </div>
  );
} 