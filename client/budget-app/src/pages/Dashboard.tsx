import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';
import type { Profile } from '../types/profile';
import WelcomeModal from '../components/WelcomeModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const displayName = user?.user_metadata?.display_name || user?.email;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await profileService.getProfile();
      if (profileData) {
        setProfile(profileData);
        
        // Check if user is new (hasn't completed welcome setup)
        const isNewUser = !profileData.has_completed_welcome;
        
        if (isNewUser) {
          setShowWelcomeModal(true);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeModal(false);
    // Reload profile to get updated data
    loadProfile();
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">Budget App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar avatarId={profile?.avatar_id || 'cat'} size="sm" />
                <span className="text-gray-300">Welcome, {displayName}</span>
              </div>
              <Link
                to="/settings"
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Settings
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-2 border-dashed border-gray-600 rounded-xl h-96 flex items-center justify-center bg-gray-800/50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to your Budget Dashboard</h2>
              <p className="text-gray-400">Your budget management features will appear here.</p>
            </div>
          </div>
        </div>
      </main>

      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onComplete={handleWelcomeComplete}
      />
    </div>
  );
} 