
import type { RecurringFrequency } from '../types/expense';

interface RecurringDateSelectorProps {
  frequency: RecurringFrequency;
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const DAYS_OF_WEEK = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
];

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function RecurringDateSelector({ frequency, value, onChange, label }: RecurringDateSelectorProps) {
  const renderSelector = () => {
    switch (frequency) {
      case 'weekly':
        return (
          <div className="space-y-2">
            <select
              value={value.split(',')[0] || ''}
              onChange={(e) => {
                const startDate = value.split(',')[1] || '';
                onChange(`${e.target.value},${startDate}`);
              }}
              className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select day of week</option>
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={value.split(',')[1] || ''}
              onChange={(e) => {
                const dayOfWeek = value.split(',')[0] || '';
                onChange(`${dayOfWeek},${e.target.value}`);
              }}
              className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start date"
            />
          </div>
        );

      case 'bi-weekly':
        return (
          <div className="space-y-2">
            <input
              type="date"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start date"
            />
          </div>
        );

      case 'monthly':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select day of month</option>
            {DAYS_OF_MONTH.map(day => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        );

      case 'yearly':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={value.split(',')[0] || ''}
              onChange={(e) => {
                const day = value.split(',')[1] || '';
                onChange(`${e.target.value},${day}`);
              }}
              className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Month</option>
              {MONTHS.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={value.split(',')[1] || ''}
              onChange={(e) => {
                const month = value.split(',')[0] || '';
                onChange(`${month},${e.target.value}`);
              }}
              className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Day</option>
              {DAYS_OF_MONTH.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <label className="block text-gray-300 mb-1">{label}</label>
      {renderSelector()}
      <p className="text-xs text-gray-400 mt-1">
        {(() => {
          switch (frequency) {
            case 'weekly':
              return 'Select which day of the week this expense occurs and the start date';
            case 'bi-weekly':
              return 'Select the start date for bi-weekly recurrence.';
            case 'monthly':
              return 'Select which day of the month this expense occurs';
            case 'yearly':
              return 'Select the month and day for yearly recurrence';
            default:
              return '';
          }
        })()}
      </p>
    </div>
  );
} 