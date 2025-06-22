import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { SignUpCredentials } from '../types/auth';
import { Link, useNavigate } from 'react-router-dom';
import { profileService } from '../services/profileService';

export default function SignUp() {
  const [credentials, setCredentials] = useState<SignUpCredentials>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [displayNameStatus, setDisplayNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [passwordMatchStatus, setPasswordMatchStatus] = useState<'idle' | 'matching' | 'not-matching'>('idle');
  const { signUp, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Clear any existing auth errors only on initial mount
  useEffect(() => {
    if (clearError) {
      clearError();
    }
  }, []);

  const checkDisplayName = useCallback(
    debounce(async (displayName: string) => {
      if (!displayName || displayName.length < 2) {
        setDisplayNameStatus('idle');
        return;
      }

      setDisplayNameStatus('checking');
      const isAvailable = await profileService.checkDisplayNameAvailability(displayName);
      setDisplayNameStatus(isAvailable ? 'available' : 'taken');
    }, 500),
    []
  );

  // Debounced function to check email availability
  const checkEmail = useCallback(
    debounce(async (email: string) => {
      if (!email || !email.includes('@')) {
        setEmailStatus('idle');
        return;
      }

      setEmailStatus('checking');
      const isAvailable = await profileService.checkEmailAvailability(email.toLowerCase());
      setEmailStatus(isAvailable ? 'available' : 'taken');
    }, 500),
    []
  );

  // Check display name when it changes
  useEffect(() => {
    checkDisplayName(credentials.displayName);
  }, [credentials.displayName, checkDisplayName]);

  // Check email when it changes
  useEffect(() => {
    checkEmail(credentials.email);
  }, [credentials.email, checkEmail]);

  // Check password matching when either password field changes
  useEffect(() => {
    if (!credentials.password || !credentials.confirmPassword) {
      setPasswordMatchStatus('idle');
      return;
    }

    if (credentials.password === credentials.confirmPassword) {
      setPasswordMatchStatus('matching');
    } else {
      setPasswordMatchStatus('not-matching');
    }
  }, [credentials.password, credentials.confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (credentials.password !== credentials.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (displayNameStatus === 'taken') {
      setLocalError('Display name is already taken');
      return;
    }

    if (emailStatus === 'taken') {
      setLocalError('Email is already registered');
      return;
    }
    
    try {
      await signUp({
        ...credentials,
        email: credentials.email.toLowerCase(), // Convert to lowercase for submission
      });
      // Redirect to login page with email confirmation message
      navigate('/login?confirm=email');
    } catch {
      // Error will be handled by the auth context
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value, // Allow visual case for all fields
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

  const getDisplayNameStatusColor = () => {
    switch (displayNameStatus) {
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

  const getDisplayNameStatusText = () => {
    switch (displayNameStatus) {
      case 'available':
        return '✓ Available';
      case 'taken':
        return '✗ Already taken';
      case 'checking':
        return 'Checking...';
      default:
        return '';
    }
  };

  const getEmailStatusColor = () => {
    switch (emailStatus) {
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

  const getEmailStatusText = () => {
    switch (emailStatus) {
      case 'available':
        return '✓ Available';
      case 'taken':
        return '✗ Already registered';
      case 'checking':
        return 'Checking...';
      default:
        return '';
    }
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

  // Check if form is valid for submission
  const isFormValid = !loading && 
    displayNameStatus === 'available' && 
    emailStatus === 'available' && 
    passwordMatchStatus === 'matching';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-3">Budget Me</h1>
            <h2 className="text-xl font-medium text-gray-300 mb-2">
              Create your account
            </h2>
            <p className="text-gray-400 text-sm">
              Start managing your finances today
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <input
                  name="displayName"
                  type="text"
                  required
                  className={`w-full px-4 py-4 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base ${getDisplayNameStatusColor()}`}
                  placeholder="Display Name"
                  value={credentials.displayName}
                  onChange={handleInputChange}
                />
                {displayNameStatus !== 'idle' && (
                  <p className={`text-sm mt-1 ${getDisplayNameStatusColor()}`}>
                    {getDisplayNameStatusText()}
                  </p>
                )}
              </div>
              <div>
                <input
                  name="email"
                  type="email"
                  required
                  className={`w-full px-4 py-4 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base ${getEmailStatusColor()}`}
                  placeholder="Email address"
                  value={credentials.email}
                  onChange={handleInputChange}
                />
                {emailStatus !== 'idle' && (
                  <p className={`text-sm mt-1 ${getEmailStatusColor()}`}>
                    {getEmailStatusText()}
                  </p>
                )}
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
              <div>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className={`w-full px-4 py-4 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base ${getPasswordMatchStatusColor()}`}
                  placeholder="Confirm Password"
                  value={credentials.confirmPassword}
                  onChange={handleInputChange}
                />
                {passwordMatchStatus !== 'idle' && (
                  <p className={`text-sm mt-1 ${getPasswordMatchStatusColor()}`}>
                    {getPasswordMatchStatusText()}
                  </p>
                )}
              </div>
            </div>

            {displayError && (
              <div className="text-red-400 text-sm text-center bg-red-900/30 border border-red-800/50 rounded-xl p-4">
                {displayError}
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg"
            >
              {loading ? 'Loading...' : 'Create Account'}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200 font-medium"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
