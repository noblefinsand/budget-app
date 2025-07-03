// Test to demonstrate the July 1st issue
function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function generateWeeklyDates(startDate, pattern, endDate) {
  const targetDayOfWeek = pattern.dayOfWeek; // 1-7, where 1=Monday, 7=Sunday
  
  // Use the pattern start date if available, otherwise use the expense start date
  let currentDate = pattern.startDate ? new Date(pattern.startDate) : new Date(startDate);
  
  // Convert JavaScript's 0-6 (Sunday-Saturday) to our 1-7 (Monday-Sunday) format
  const currentDayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
  
  // If the start date is already on the target day of the week, use it as the first occurrence
  if (currentDayOfWeek === targetDayOfWeek) {
    // Start date is already on the target day, so use it as the first occurrence
  } else {
    // Calculate days until the next occurrence of the target day of week
    let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Move to next week
    }
    
    // Set the first occurrence to the target day of week
    currentDate.setDate(currentDate.getDate() + daysUntilTarget);
  }
  
  const dates = [];
  // Generate all weekly occurrences
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return dates;
}

// Test with Tuesday (day 2) starting from 2024-07-01 (which is a Tuesday)
const startDate = parseLocalDate('2024-07-01');
const endDate = new Date('2024-08-01');
const pattern = { dayOfWeek: 2, startDate: parseLocalDate('2024-07-01') }; // Tuesday starting July 1

console.log('Current issue:');
console.log('Start date (July 1st):', startDate.toDateString());
console.log('Start date day of week:', startDate.getDay() === 0 ? 7 : startDate.getDay(), '(should be 2 for Tuesday)');
console.log('Target day of week:', pattern.dayOfWeek, '(Tuesday)');
console.log('Pattern start date:', pattern.startDate.toDateString());

const dates = generateWeeklyDates(startDate, pattern, endDate);

console.log('\nGenerated dates:');
dates.forEach((date, index) => {
  console.log(`${index + 1}. ${date.toDateString()} (${date.getDay() === 0 ? 'Sunday' : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay() - 1]})`);
});

console.log('\nThe issue: July 1st is a Tuesday, but the first occurrence is July 15th instead of July 1st!'); 