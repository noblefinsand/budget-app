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
      const [dayOfWeek, startDate] = pattern.split(',');
      const dayIndex = parseInt(dayOfWeek) - 1;
      const dayName = dayNames[dayIndex] || 'Unknown';
      if (startDate) {
        const [year, month, day] = startDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return `${dayName} starting ${date.toLocaleDateString()}`;
      }
      return dayName;
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
      const [year, month, day] = expense.due_date.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    }
  }
}

// Helper to parse YYYY-MM-DD as local date
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Generates recurring dates for an expense based on its pattern and frequency
 * @param dueDate - The original due date
 * @param recurringPattern - The recurring pattern (e.g., "4,2024-01-15" for Thursday weekly starting Jan 15, "2024-01-15" for bi-weekly, "15" for monthly, "1,15" for yearly)
 * @param recurringFrequency - The frequency type
 * @param monthsAhead - How many months ahead to generate dates (default: 12)
 * @returns Array of dates for the recurring expense
 */
export function generateRecurringDates(
  dueDate: string,
  recurringPattern: string,
  recurringFrequency: string,
  monthsAhead: number = 12
): Date[] {
  const startDate = parseLocalDate(dueDate);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + monthsAhead);
  const dates: Date[] = [];
  // Parse the recurring pattern
  const pattern = parseRecurringPattern(recurringPattern, recurringFrequency);
  switch (recurringFrequency) {
    case 'weekly':
      generateWeeklyDates(startDate, pattern as { dayOfWeek: number; startDate: Date | null }, endDate, dates);
      break;
    case 'bi-weekly':
      generateBiWeeklyDates(startDate, pattern as { startDate: Date | null }, endDate, dates);
      break;
    case 'monthly':
      generateMonthlyDates(startDate, pattern as { dayOfMonth: number }, endDate, dates);
      break;
    case 'yearly':
      generateYearlyDates(startDate, pattern as { month: number; day: number }, endDate, dates);
      break;
  }
  return dates;
}

/**
 * Parses the recurring pattern to extract relevant information
 */
function parseRecurringPattern(pattern: string, frequency: string): unknown {
  switch (frequency) {
    case 'weekly': {
      const weeklyParts = pattern.split(',');
      return {
        dayOfWeek: parseInt(weeklyParts[0]),
        startDate: weeklyParts[1] ? parseLocalDate(weeklyParts[1]) : null
      };
    }
    case 'bi-weekly': {
      return {
        startDate: pattern ? parseLocalDate(pattern) : null
      };
    }
    case 'monthly': {
      return { dayOfMonth: parseInt(pattern) };
    }
    case 'yearly': {
      const yearlyParts = pattern.split(',');
      return {
        month: parseInt(yearlyParts[0]),
        day: parseInt(yearlyParts[1])
      };
    }
    default:
      return {};
  }
}

/**
 * Generates weekly recurring dates
 */
function generateWeeklyDates(
  startDate: Date,
  pattern: { dayOfWeek: number; startDate: Date | null },
  endDate: Date,
  dates: Date[]
): void {
  const targetDayOfWeek = pattern.dayOfWeek;
  let currentDate = pattern.startDate ? new Date(pattern.startDate) : new Date(startDate);
  while (currentDate <= endDate) {
    const currentDayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
    if (currentDayOfWeek === targetDayOfWeek) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;
      if (daysUntilTarget <= 0) daysUntilTarget += 7;
      currentDate.setDate(currentDate.getDate() + daysUntilTarget);
    }
  }
}

/**
 * Generates bi-weekly recurring dates
 */
function generateBiWeeklyDates(
  startDate: Date,
  pattern: { startDate: Date | null },
  endDate: Date,
  dates: Date[]
): void {
  let currentDate = pattern.startDate ? new Date(pattern.startDate) : new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 14);
  }
}

/**
 * Generates monthly recurring dates
 */
function generateMonthlyDates(
  startDate: Date,
  pattern: { dayOfMonth: number },
  endDate: Date,
  dates: Date[]
): void {
  const targetDay = pattern.dayOfMonth || startDate.getDate();
  // eslint-disable-next-line prefer-const
  const currentDate = pattern.dayOfMonth
    ? new Date(startDate.getFullYear(), startDate.getMonth(), targetDay)
    : new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
    if (currentDate.getDate() !== targetDay) {
      currentDate.setDate(0);
      currentDate.setDate(targetDay);
    }
  }
}

/**
 * Generates yearly recurring dates
 */
function generateYearlyDates(
  startDate: Date,
  pattern: { month: number; day: number },
  endDate: Date,
  dates: Date[]
): void {
  // eslint-disable-next-line prefer-const
  const currentDate = (pattern.month && pattern.day)
    ? new Date(startDate.getFullYear(), pattern.month - 1, pattern.day)
    : new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setFullYear(currentDate.getFullYear() + 1);
  }
} 