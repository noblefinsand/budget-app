import { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';
import type { ProfileUpdate } from '../types/profile';
import AvatarSelector from './AvatarSelector';

interface WelcomeModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function WelcomeModal({ isOpen, onComplete }: WelcomeModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileUpdate>({
    display_name: '',
    avatar_id: 'cat',
    currency: 'USD',
    timezone: 'UTC',
    paycheck_frequency: 'bi-weekly'
  });

  // Load current profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCurrentProfile();
    }
  }, [isOpen]);

  const loadCurrentProfile = async () => {
    try {
      const profileData = await profileService.getProfile();
      if (profileData) {
        setFormData({
          display_name: profileData.display_name || '',
          avatar_id: profileData.avatar_id,
          currency: profileData.currency,
          timezone: profileData.timezone,
          paycheck_frequency: profileData.paycheck_frequency
        });
      }
    } catch (error) {
      console.error('Error loading current profile:', error);
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

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const updatedProfile = await profileService.updateProfile({
        ...formData,
        has_completed_welcome: true
      });
      if (updatedProfile) {
        onComplete();
      } else {
        setError('Failed to save profile settings');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    setError(null);

    try {
      const updatedProfile = await profileService.updateProfile({
        has_completed_welcome: true
      });
      if (updatedProfile) {
        onComplete();
      } else {
        setError('Failed to skip welcome setup');
      }
    } catch (error) {
      console.error('Error skipping welcome:', error);
      setError('Failed to skip welcome setup');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to Budget App! 🎉
            </h2>
            <p className="text-gray-400">
              Let's personalize your experience
            </p>
          </div>

          {/* Progress */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              {[1, 2].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`w-3 h-3 rounded-full ${
                    step >= stepNumber ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Avatar */}
          {step === 1 && (
            <div className="space-y-4">
              <AvatarSelector
                selectedAvatar={formData.avatar_id || 'cat'}
                onAvatarSelect={handleAvatarSelect}
              />
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
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
                  How often do you get paid?
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
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-800/50 text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors duration-200"
              >
                Skip for now
              </button>
            )}
            
            {step < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? 'Setting up...' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 