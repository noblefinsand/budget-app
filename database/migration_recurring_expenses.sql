-- Migration to support recurring expenses
-- Add recurring_pattern field while keeping due_date as DATE

-- First, let's backup existing data (optional but recommended)
-- CREATE TABLE expenses_backup AS SELECT * FROM expenses;

-- Update the due_date column type
ALTER TABLE expenses ALTER COLUMN due_date TYPE DATE;

-- Add a comment to document the new format
COMMENT ON COLUMN expenses.due_date IS 'For one-time expenses: YYYY-MM-DD format. For recurring expenses: due_date contains the next occurrence date';

-- Add the new recurring_pattern column
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_pattern TEXT;

-- Add a comment to document the new field
COMMENT ON COLUMN expenses.recurring_pattern IS 'For recurring expenses: "4,2024-01-15" (weekly Thursday starting Jan 15), "2024-01-15" (bi-weekly start date), "15" (monthly 15th), "1,15" (yearly January 15th). NULL for one-time expenses.';

-- Add a check constraint to ensure data consistency
ALTER TABLE expenses ADD CONSTRAINT check_recurring_consistency 
CHECK (
  (is_recurring = false AND recurring_pattern IS NULL) OR
  (is_recurring = true AND recurring_pattern IS NOT NULL AND recurring_frequency IS NOT NULL)
); 