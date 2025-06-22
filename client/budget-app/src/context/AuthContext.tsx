import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import supabase from '../../utils/supabase';
import type { AuthState, LoginCredentials, SignUpCredentials } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, error: null }));
    
    const { error } = await supabase.auth.signInWithPassword(credentials);
    
    if (error) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  };

  const signUp = async (credentials: SignUpCredentials) => {
    setState(prev => ({ ...prev, error: null }));
    
    const { error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          display_name: credentials.displayName
        }
      }
    });
        
    if (error) {
      setState(prev => ({ ...prev, error: error.message }));
    }
    // Don't automatically set the user - let them confirm their email first
    // The user will be set when they confirm their email and sign in
  };

  const logout = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setState(prev => ({ ...prev, error: error.message, loading: false }));
    }
  };

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, error: null }));
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      setState(prev => ({ ...prev, error: error.message }));
      return { success: false, error: error.message };
    }
    
    return { success: true };
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const value: AuthContextType = {
    ...state,
    login,
    signUp,
    logout,
    resetPassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 