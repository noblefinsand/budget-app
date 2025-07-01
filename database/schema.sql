-- Create paycheck frequency enum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE paycheck_frequency AS ENUM ('weekly', 'bi-weekly', 'monthly', 'semi-monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profile table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT UNIQUE NOT NULL,
  avatar_id TEXT DEFAULT 'cat',
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  paycheck_frequency paycheck_frequency DEFAULT 'bi-weekly',
  has_completed_welcome BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if display name already exists
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', 'User')
  ) THEN
    RAISE EXCEPTION 'Display name already taken';
  END IF;

  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;

-- Trigger to automatically update updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to check if display name is available
CREATE OR REPLACE FUNCTION public.check_display_name_availability(display_name_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if display name exists in profiles table
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE display_name = display_name_to_check
  ) THEN
    RETURN FALSE;
  END IF;

  -- Check if display name exists in user metadata
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE raw_user_meta_data->>'display_name' = display_name_to_check
  ) THEN
    RETURN FALSE;
  END IF;

  -- If not found in either place, it's available
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if email is available
CREATE OR REPLACE FUNCTION public.check_email_availability(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if email exists in auth.users table
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = email_to_check
  ) THEN
    RETURN FALSE;
  END IF;

  -- If not found, it's available
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create expense category enum
DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM ('housing', 'utilities', 'transportation', 'food', 'entertainment', 'healthcare', 'insurance', 'debt', 'savings', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create expense status enum
DO $$ BEGIN
    CREATE TYPE expense_status AS ENUM ('pending', 'paid', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create recurring frequency enum
DO $$ BEGIN
    CREATE TYPE recurring_frequency AS ENUM ('monthly', 'bi-weekly', 'weekly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  category expense_category NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency recurring_frequency,
  status expense_status DEFAULT 'pending',
  notes TEXT,
  excluded_from_paycheck BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

-- Create policies for expenses
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_expenses_updated_at ON expenses;

-- Trigger to automatically update updated_at for expenses
CREATE TRIGGER handle_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 