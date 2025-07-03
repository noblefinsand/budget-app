// Utility for formatting due dates, including recurring logic
import type { Expense } from '../types/expense';

export function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function formatDueDateForDisplay(expense: Expense): string {
  if (!expense.is_recurring || !expense.recurring_frequency) {
    const [year, month, day] = expense.due_date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }
  const pattern = expense.recurring_pattern || '';
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  switch (expense.recurring_frequency) {
    case 'weekly': {
      const dayIndex = parseInt(pattern) - 1;
      return dayNames[dayIndex] || 'Unknown';
    }
    case 'bi-weekly': {
      // pattern is now a date string (YYYY-MM-DD)
      if (!pattern) return 'Unknown';
      const [year, month, day] = pattern.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    }
    case 'monthly':
      return `${pattern}${getDaySuffix(parseInt(pattern))} of month`;
    case 'yearly': {
      const [month, day] = pattern.split(',');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = parseInt(month) - 1;
      const monthName = monthNames[monthIndex] || 'Unknown';
      return `${monthName} ${day}${getDaySuffix(parseInt(day))}`;
    }
    default: {
      const [year, month, day] = expense.due_date.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    }
  }
} 