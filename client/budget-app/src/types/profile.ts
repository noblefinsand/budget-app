export type PaycheckFrequency = 'weekly' | 'bi-weekly' | 'monthly' | 'semi-monthly';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  currency: string;
  timezone: string;
  paycheck_frequency: PaycheckFrequency;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  display_name?: string;
  avatar_url?: string;
  currency?: string;
  timezone?: string;
  paycheck_frequency?: PaycheckFrequency;
} 