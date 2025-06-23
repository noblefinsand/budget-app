export type PaycheckFrequency = 'weekly' | 'bi-weekly' | 'monthly' | 'semi-monthly';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_id: string;
  currency: string;
  timezone: string;
  paycheck_frequency: PaycheckFrequency;
  has_completed_welcome: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  display_name?: string;
  avatar_id?: string;
  currency?: string;
  timezone?: string;
  paycheck_frequency?: PaycheckFrequency;
  has_completed_welcome?: boolean;
} 