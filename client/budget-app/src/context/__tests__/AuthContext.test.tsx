import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import supabase from '../../../utils/supabase';
import {
  mockAuthResponse,
  mockAuthErrorResponse,
  mockSignUpResponse,
  mockSignUpErrorResponse,
  mockPasswordResetResponse,
  mockPasswordResetErrorResponse,
  validLoginData,
  validSignUpData,
  resetPasswordData,
} from '../../test/fixtures';

// Test component to access auth context
function TestComponent() {
  const { user, loading, error, login, signUp, logout, resetPassword, clearError } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => login(validLoginData)}>
        Login
      </button>
      <button onClick={() => signUp(validSignUpData)}>
        Sign Up
      </button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => resetPassword(resetPasswordData.email)}>Reset Password</button>
      <button onClick={() => clearError()}>Clear Error</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with initial state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should handle successful login', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockAuthResponse as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    screen.getByText('Login').click();

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith(validLoginData);
    });
  });

  it('should handle login error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockAuthErrorResponse as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    screen.getByText('Login').click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('should handle successful sign up', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.signUp).mockResolvedValue(mockSignUpResponse as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    screen.getByText('Sign Up').click();

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: validSignUpData.email,
        password: validSignUpData.password,
        options: {
          data: {
            display_name: validSignUpData.displayName,
          },
        },
      });
    });
  });

  it('should handle sign up error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.signUp).mockResolvedValue(mockSignUpErrorResponse as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    screen.getByText('Sign Up').click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Email already registered');
    });
  });

  it('should handle logout', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    screen.getByText('Logout').click();

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it('should handle password reset', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue(mockPasswordResetResponse as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    screen.getByText('Reset Password').click();

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(resetPasswordData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    });
  });

  it('should handle password reset error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue(mockPasswordResetErrorResponse as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    screen.getByText('Reset Password').click();

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(resetPasswordData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    });
  });

  it('should clear error when clearError is called', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockAuthErrorResponse as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Trigger an error first
    screen.getByText('Login').click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });

    // Clear the error
    screen.getByText('Clear Error').click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });
}); 