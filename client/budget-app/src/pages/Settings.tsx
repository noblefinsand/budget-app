import { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';
import type { ProfileUpdate } from '../types/profile';
import { Link } from 'react-router-dom';
import AvatarSelector from '../components/AvatarSelector';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<ProfileUpdate>({
    display_name: '',
    avatar_id: 'cat',
    currency: 'USD',
    timezone: 'UTC',
    paycheck_frequency: 'bi-weekly'
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await profileService.getProfile();
      if (profileData) {
        setFormData({
          display_name: profileData.display_name || '',
          avatar_id: profileData.avatar_id || 'cat',
          currency: profileData.currency,
          timezone: profileData.timezone,
          paycheck_frequency: profileData.paycheck_frequency
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarSelect = (avatarId: string) => {
    setFormData(prev => ({
      ...prev,
      avatar_id: avatarId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updatedProfile = await profileService.updateProfile(formData);
      if (updatedProfile) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-gray-300 hover:text-white mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-white">Settings</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Section */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="display_name" className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="display_name"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your display name"
                  />
                </div>
                <AvatarSelector
                  selectedAvatar={formData.avatar_id || 'cat'}
                  onAvatarSelect={handleAvatarSelect}
                />
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-300 mb-2">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="paycheck_frequency" className="block text-sm font-medium text-gray-300 mb-2">
                    Paycheck Frequency
                  </label>
                  <select
                    id="paycheck_frequency"
                    name="paycheck_frequency"
                    value={formData.paycheck_frequency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="semi-monthly">Semi-monthly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`rounded-lg p-4 ${
                message.type === 'success' 
                  ? 'bg-green-900/30 border border-green-800/50 text-green-400' 
                  : 'bg-red-900/30 border border-red-800/50 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 