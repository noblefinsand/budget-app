import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import type { Profile } from '../types/profile';

export default function BudgetTime() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const profileData = await profileService.getProfile();
      setProfile(profileData);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const displayName = profile ? (profile.display_name || user?.email || '') : '';
  const avatarId = profile ? (profile.avatar_id || 'cat') : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header displayName={displayName} avatarId={avatarId} onLogout={logout} />
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-gray-800 rounded-xl p-8 max-w-xl w-full shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-4">Budget Time</h1>
          <p className="text-gray-300 mb-2">This is where you'll enter your paycheck, see your recurring expenses, add one-time expenses, and track your budget for this period.</p>
          <p className="text-gray-400">(Feature coming soon!)</p>
        </div>
      </div>
    </div>
  );
} 