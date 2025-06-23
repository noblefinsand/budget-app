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
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    // Update the profile in the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    // If display_name was updated, also update the auth user metadata
    if (updates.display_name) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: updates.display_name }
      });

      if (authError) {
        console.error('Error updating auth user metadata:', authError);
        // Don't return null here as the profile was updated successfully
      }
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