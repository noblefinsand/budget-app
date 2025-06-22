import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordMatchStatus, setPasswordMatchStatus] = useState<'idle' | 'matching' | 'not-matching'>('idle');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const navigate = useNavigate();

  // Check if we're in recovery mode when component mounts
  useEffect(() => {
    const checkRecoveryMode = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsRecoveryMode(true);
      }
    };

    checkRecoveryMode();
  }, []);

  // Clean up recovery session if user leaves without completing reset
  useEffect(() => {
    const handleBeforeUnload = () => {
      // If user leaves without completing reset, clear the session
      if (isRecoveryMode && !success) {
        supabase.auth.signOut();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRecoveryMode, success]);

  // Check password matching when either password field changes
  useEffect(() => {
    if (!password || !confirmPassword) {
      setPasswordMatchStatus('idle');
      return;
    }

    if (password === confirmPassword) {
      setPasswordMatchStatus('matching');
    } else {
      setPasswordMatchStatus('not-matching');
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Success! Show success message and redirect
      setSuccess(true);
      
      // Clear the recovery session after successful password reset
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login?message=password-reset-success');
      }, 2000);

    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = async () => {
    // Clear the recovery session when user goes back without completing reset
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getPasswordMatchStatusColor = () => {
    switch (passwordMatchStatus) {
      case 'matching':
        return 'border-green-500 text-green-400';
      case 'not-matching':
        return 'border-red-500 text-red-400';
      default:
        return 'border-gray-600 text-gray-400';
    }
  };

  const getPasswordMatchStatusText = () => {
    switch (passwordMatchStatus) {
      case 'matching':
        return '✓ Passwords match';
      case 'not-matching':
        return '✗ Passwords do not match';
      default:
        return '';
    }
  };

  // Check if form is valid
  const isFormValid = !loading && passwordMatchStatus === 'matching' && password.length >= 6;

  // Show error if not in recovery mode
  if (!isRecoveryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h2>
              <p className="text-gray-300 mb-4">
                This password reset link is invalid or has expired. Please request a new password reset.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
              <p className="text-gray-300">
                Your password has been updated successfully. You will be redirected to the login page shortly.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-3">Budget Me</h1>
            <h2 className="text-xl font-medium text-gray-300 mb-2">
              Reset Your Password
            </h2>
            <p className="text-gray-400 text-sm">
              Enter your new password below
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  className={`w-full px-4 py-4 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base ${getPasswordMatchStatusColor()}`}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {passwordMatchStatus !== 'idle' && (
                  <p className={`text-sm mt-1 ${getPasswordMatchStatusColor()}`}>
                    {getPasswordMatchStatusText()}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/30 border border-red-800/50 rounded-xl p-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToSignIn}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 