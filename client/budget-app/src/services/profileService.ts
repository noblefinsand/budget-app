import supabase from '../../utils/supabase';
import type { Profile, ProfileUpdate } from '../types/profile';

export const profileService = {
  // Get current user's profile
  async getProfile(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  // Update current user's profile
  async updateProfile(updates: ProfileUpdate): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data;
  },

  // Get profile by user ID (for admin purposes)
  async getProfileById(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile by ID:', error);
      return null;
    }

    return data;
  },

  // Check if display name is available
  async checkDisplayNameAvailability(displayName: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('check_display_name_availability', {
        display_name_to_check: displayName
      });

    if (error) {
      console.error('Error checking display name availability:', error);
      return false;
    }

    return data;
  },

  // Check if email is available
  async checkEmailAvailability(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('check_email_availability', {
        email_to_check: email
      });

    if (error) {
      console.error('Error checking email availability:', error);
      return false;
    }

    return data;
  }
}; 