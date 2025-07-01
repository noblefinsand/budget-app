import { useState, useMemo, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns';
import type { Expense } from '../types/expense';
import { CATEGORY_COLORS } from '../types/expense';
import { profileService } from '../services/profileService';
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  // Convert expenses to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return expenses.map(expense => {
      // Parse the date string and create a local date to avoid timezone issues
      const dueDate = parseISO(expense.due_date);
      
      return {
        id: expense.id,
        title: `${expense.name} - ${formatCurrency(expense.amount)}`,
        start: dueDate,
        end: dueDate,
        resource: expense,
        color: CATEGORY_COLORS[expense.category],
      };
    });
  }, [expenses, currency, formatCurrency]);

  // Custom event component with category colors
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <>
      <span className="font-semibold truncate text-xs flex-1">{event.resource.name}</span>
      <span className="opacity-90 text-xs ml-1">{formatCurrency(event.resource.amount)}</span>
      {event.resource.is_recurring && (
        <span className="text-xs opacity-75 ml-1 hidden md:inline">🔄</span>
      )}
    </>
  );

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
        {/* Category color key */}
        <div className="flex flex-wrap items-center space-x-4 mt-3">
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
    );
  };

  return (
    <div className={`bg-gray-900 rounded-xl p-2 sm:p-4 w-full md:max-w-5xl md:mx-auto ${className}`}>
      <div className="w-full">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          views={['month']}
          view={Views.MONTH}
          date={currentDate}
          onView={() => {}}
          onNavigate={(date) => setCurrentDate(date)}
          components={{
            event: EventComponent,
            toolbar: CustomToolbar,
          }}
          eventPropGetter={(event) => ({
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
            },
          })}
          onSelectEvent={(event) => onEventClick?.(event.resource)}
          className="expense-calendar"
          dayLayoutAlgorithm="no-overlap"
          popup={true}
        />
      </div>
      <style>{`
        .expense-calendar {
          color: white;
        }
        .expense-calendar .rbc-calendar {
          background-color: #1f2937;
          color: white;
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
          padding: 0;
          border-radius: 6px;
          font-size: 1rem;
        }
        .expense-calendar .rbc-event-content {
          padding: 0;
          display: flex;
          align-items: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-left: 6px;
          padding-right: 6px;
          font-size: 1rem;
        }
        .expense-calendar .rbc-show-more {
          color: #3b82f6 !important;
          background: transparent !important;
          font-weight: 600;
          border-radius: 4px;
          padding: 2px 6px;
          transition: background 0.2s, color 0.2s;
          cursor: pointer;
          font-size: 1rem;
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
            font-size: 0.95rem;
          }
          .expense-calendar .rbc-event,
          .expense-calendar .rbc-event-content,
          .expense-calendar .rbc-show-more {
            padding: 2px 6px;
            border-radius: 5px;
            width: 100%;
            box-sizing: border-box;
          }
          .expense-calendar .rbc-header {
            padding: 4px;
          }
          .expense-calendar .rbc-date-cell {
            padding: 2px 2px 4px 2px;
          }
        }
      `}</style>
    </div>
  );
} 