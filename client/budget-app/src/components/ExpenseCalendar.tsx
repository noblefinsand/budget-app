import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns';
import type { Expense } from '../types/expense';
import { CATEGORY_COLORS } from '../types/expense';
import { profileService } from '../services/profileService';

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
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);

  // Fetch user's currency preference
  useMemo(() => {
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
    <div 
      className="p-1 text-xs font-medium rounded cursor-pointer hover:opacity-80 transition-opacity"
      style={{ 
        backgroundColor: event.color,
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1px'
      }}
      onClick={() => onEventClick?.(event.resource)}
      title={`${event.resource.name} - ${formatCurrency(event.resource.amount)}`}
    >
      <div className="font-semibold truncate text-xs flex-1">{event.resource.name}</div>
      <div className="opacity-90 text-xs ml-1">{formatCurrency(event.resource.amount)}</div>
      {event.resource.is_recurring && (
        <div className="text-xs opacity-75 ml-1">🔄</div>
      )}
    </div>
  );

  // Custom toolbar with dark theme styling
  const CustomToolbar = (toolbar: { label: string }) => {
    const handleNavigate = (action: string) => {
      if (action === 'PREV') {
        const newDate = new Date(currentDate);
        if (currentView === Views.MONTH) {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (currentView === Views.WEEK) {
          newDate.setDate(newDate.getDate() - 7);
        } else if (currentView === Views.DAY) {
          newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
      } else if (action === 'NEXT') {
        const newDate = new Date(currentDate);
        if (currentView === Views.MONTH) {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (currentView === Views.WEEK) {
          newDate.setDate(newDate.getDate() + 7);
        } else if (currentView === Views.DAY) {
          newDate.setDate(newDate.getDate() + 1);
        }
        setCurrentDate(newDate);
      } else if (action === 'TODAY') {
        setCurrentDate(new Date());
      }
    };

    const handleViewChange = (view: View) => {
      setCurrentView(view);
    };

    return (
    <div className="flex justify-between items-center mb-4 p-4 bg-gray-800 rounded-lg">
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
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleViewChange(Views.MONTH)}
          className={`px-3 py-1 rounded transition-colors ${
            currentView === Views.MONTH 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => handleViewChange(Views.WEEK)}
          className={`px-3 py-1 rounded transition-colors ${
            currentView === Views.WEEK 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => handleViewChange(Views.DAY)}
          className={`px-3 py-1 rounded transition-colors ${
            currentView === Views.DAY 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          Day
        </button>
      </div>
    </div>
    );
  };

  return (
    <div className={`bg-gray-900 rounded-xl p-4 ${className}`}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        views={['month', 'week', 'day']}
        view={currentView}
        date={currentDate}
        onView={(view) => setCurrentView(view)}
        onNavigate={(date) => setCurrentDate(date)}
        components={{
          event: EventComponent,
          toolbar: CustomToolbar,
        }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.color,
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        })}
        className="expense-calendar"
      />
      
             {/* Custom CSS for dark theme */}
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
         }
         .expense-calendar .rbc-month-view {
           border-color: #4b5563;
         }
         .expense-calendar .rbc-date-cell {
           color: white;
           padding: 4px;
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
         }
         .expense-calendar .rbc-event-content {
           padding: 0;
         }
         .expense-calendar .rbc-show-more {
           color: #3b82f6 !important;
           background: transparent !important;
           font-weight: 600;
           border-radius: 4px;
           padding: 2px 6px;
           transition: background 0.2s, color 0.2s;
           cursor: pointer;
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
       `}</style>
    </div>
  );
} 