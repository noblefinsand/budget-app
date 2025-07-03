// Utility for formatting due dates, including recurring logic
import type { Expense } from '../src/types/expense';

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
    // Parse as local date to avoid off-by-one error
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
    case 'monthly': {
      return `${pattern}${getDaySuffix(parseInt(pattern))} of month`;
    }
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
      // Fallback for unknown recurring types
      const [year, month, day] = expense.due_date.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    }
  }
}

export function computeNextDueDate(pattern: string, frequency: string): string {
  const today = new Date();
  switch (frequency) {
    case 'weekly': {
      const [targetDay] = pattern.split(',');
      const targetDayNum = parseInt(targetDay); // 1-7
      const currentDay = today.getDay() === 0 ? 7 : today.getDay();
      let daysUntilNext = targetDayNum - currentDay;
      if (daysUntilNext <= 0) daysUntilNext += 7;
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntilNext);
      return nextDate.toISOString().split('T')[0];
    }
    case 'bi-weekly': {
      // pattern: 'YYYY-MM-DD' (start date)
      return pattern || today.toISOString().split('T')[0];
    }
    case 'monthly': {
      const dayOfMonth = parseInt(pattern);
      let nextMonth = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
      if (nextMonth <= today) {
        nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
      }
      return nextMonth.toISOString().split('T')[0];
    }
    case 'yearly': {
      const [month, day] = pattern.split(',');
      const nextYear = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
      if (nextYear <= today) {
        nextYear.setFullYear(today.getFullYear() + 1);
      }
      return nextYear.toISOString().split('T')[0];
    }
    default:
      return pattern;
  }
} 