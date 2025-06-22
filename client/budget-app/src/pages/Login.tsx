import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { LoginCredentials } from '../types/auth';
import { Link, useSearchParams } from 'react-router-dom';
import { profileService } from '../services/profileService';

export default function Login() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailStatus, setResetEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const { login, resetPassword, loading, error, clearError } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Check if we should show email confirmation message
  const showEmailConfirmation = searchParams.get('confirm') === 'email';
  const showPasswordResetSuccess = searchParams.get('message') === 'password-reset-success';

  // Clear any existing auth errors only on initial mount
  useEffect(() => {
    if (clearError) {
      clearError();
    }
  }, []);

  // Debounced function to check email availability for reset
  const checkResetEmail = useCallback(
    debounce(async (email: string) => {
      if (!email || !email.includes('@')) {
        setResetEmailStatus('idle');
        return;
      }

      setResetEmailStatus('checking');
      const isAvailable = await profileService.checkEmailAvailability(email.toLowerCase());
      // For password reset, we want the opposite logic - email should be "taken" (registered)
      setResetEmailStatus(isAvailable ? 'taken' : 'available');
    }, 500),
    []
  );

  // Check reset email when it changes
  useEffect(() => {
    checkResetEmail(resetEmail);
  }, [resetEmail, checkResetEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    await login(credentials);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);
    
    if (!resetEmail || !resetEmail.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (resetEmailStatus === 'taken') {
      setLocalError('Email is not registered');
      return;
    }
    
    try {
      const result = await resetPassword(resetEmail);
      if (result.success) {
        setLocalSuccess('Password reset email sent! Check your inbox for instructions.');
        setResetEmail('');
        setResetEmailStatus('idle');
      } else {
        // Error is already set in the auth context, no need to set local error
      }
    } catch {
      // Error will be handled by the auth context
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const displayError = localError || error;

  // Debounce utility function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  const getResetEmailStatusColor = () => {
    switch (resetEmailStatus) {
      case 'available':
        return 'border-green-500 text-green-400';
      case 'taken':
        return 'border-red-500 text-red-400';
      case 'checking':
        return 'border-yellow-500 text-yellow-400';
      default:
        return 'border-gray-600 text-gray-400';
    }
  };

  const getResetEmailStatusText = () => {
    switch (resetEmailStatus) {
      case 'available':
        return '✓ Email found';
      case 'taken':
        return '✗ Email not registered';
      case 'checking':
        return 'Checking...';
      default:
        return '';
    }
  };

  // Check if reset form is valid
  const isResetFormValid = !loading && resetEmailStatus === 'available';

  const renderLoginForm = () => (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <input
            name="email"
            type="email"
            required
            className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
            placeholder="Email address"
            value={credentials.email}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <input
            name="password"
            type="password"
            required
            className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
            placeholder="Password"
            value={credentials.password}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {displayError && (
        <div className="text-red-400 text-sm text-center bg-red-900/30 border border-red-800/50 rounded-xl p-4">
          {displayError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg"
      >
        {loading ? 'Loading...' : 'Sign In'}
      </button>

      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={() => {
            setShowResetPassword(true);
            setLocalError(null);
            setLocalSuccess(null);
            if (clearError) clearError();
          }}
          className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200 font-medium"
        >
          Forgot your password?
        </button>
        <div>
          <Link
            to="/signup"
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200 font-medium"
          >
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </form>
  );

  const renderResetPasswordForm = () => (
    <form className="space-y-6" onSubmit={handleResetPassword}>
      <div className="space-y-4">
        <div>
          <input
            name="resetEmail"
            type="email"
            required
            className={`w-full px-4 py-4 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base ${getResetEmailStatusColor()}`}
            placeholder="Enter your email address"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
          {resetEmailStatus !== 'idle' && (
            <p className={`text-sm mt-1 ${getResetEmailStatusColor()}`}>
              {getResetEmailStatusText()}
            </p>
          )}
        </div>
      </div>

      {displayError && (
        <div className="text-red-400 text-sm text-center bg-red-900/30 border border-red-800/50 rounded-xl p-4">
          {displayError}
        </div>
      )}

      {localSuccess && (
        <div className="text-green-400 text-sm text-center bg-green-900/30 border border-green-800/50 rounded-xl p-4">
          {localSuccess}
        </div>
      )}

      <button
        type="submit"
        disabled={!isResetFormValid}
        className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg"
      >
        {loading ? 'Sending...' : 'Send Reset Email'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setShowResetPassword(false);
            setLocalError(null);
            setLocalSuccess(null);
            setResetEmail('');
            setResetEmailStatus('idle');
            if (clearError) clearError();
          }}
          className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200 font-medium"
        >
          Back to Sign In
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-3">Budget Me</h1>
            <h2 className="text-xl font-medium text-gray-300 mb-2">
              {showResetPassword ? 'Reset Password' : 'Welcome back'}
            </h2>
            <p className="text-gray-400 text-sm">
              {showResetPassword 
                ? 'Enter your email to receive a password reset link'
                : 'Sign in to continue'
              }
            </p>
          </div>

          {showEmailConfirmation && !showResetPassword && (
            <div className="mb-6 p-4 bg-blue-900/30 border border-blue-800/50 rounded-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-300">
                    Check your email
                  </h3>
                  <div className="mt-2 text-sm text-blue-200">
                    <p>
                      We've sent you a confirmation email. Please check your inbox and click the confirmation link before signing in.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showPasswordResetSuccess && !showResetPassword && (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-800/50 rounded-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-300">
                    Password Reset Successful!
                  </h3>
                  <div className="mt-2 text-sm text-green-200">
                    <p>
                      Your password has been updated successfully. You can now sign in with your new password.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showResetPassword ? renderResetPasswordForm() : renderLoginForm()}
        </div>
      </div>
    </div>
  );
} 