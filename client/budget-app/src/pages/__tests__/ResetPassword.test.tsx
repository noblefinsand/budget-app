// Mock Supabase at the very top, before any imports
vi.mock('../../../utils/supabase', () => ({
  default: {
    auth: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import supabase from '../../../utils/supabase';

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock user data
type MockUser = {
  id: string;
  email: string;
  app_metadata: object;
  user_metadata: object;
  aud: string;
  created_at: string;
};
const mockUser: MockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
};

// Mock session data
const mockSession = {
  user: mockUser,
  access_token: 'token',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer',
  expires_at: 1234567890,
};

// Mock window.addEventListener for beforeunload
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

function renderResetPassword() {
  return render(
    <BrowserRouter>
      <ResetPassword />
    </BrowserRouter>
  );
}

describe.skip('ResetPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
    
    // Set up default mock implementations
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: {
        message: 'Password update failed',
        code: 'mock_code',
        status: 400,
        name: 'AuthError',
      } as import('@supabase/supabase-js').AuthError,
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    });
  });

  it('renders invalid reset link when no session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
    });

    expect(screen.getByText(/This password reset link is invalid or has expired/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('navigates to login when back to sign in is clicked in invalid state', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders reset form when session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    });

    expect(screen.getByText('Budget Buddy')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('shows password matching status when passwords are entered', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm New Password');

    // Test matching passwords
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    await waitFor(() => {
      expect(screen.getByText('✓ Passwords match')).toBeInTheDocument();
    });

    // Test non-matching passwords
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });

    await waitFor(() => {
      expect(screen.getByText('✗ Passwords do not match')).toBeInTheDocument();
    });
  });

  it('enables submit button when form is valid', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /update password/i });
    expect(submitButton).toBeDisabled();

    // Fill in matching passwords
    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'password123' } });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it('disables submit button when password is too short', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /update password/i });

    // Fill in short matching passwords
    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: '123' } });

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('handles successful password reset', async () => {
    vi.useFakeTimers();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    // Fill in valid passwords
    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'newpassword123' } });

    const submitButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(submitButton);

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Password Reset Successful!')).toBeInTheDocument();
    });

    // Fast-forward timers to trigger navigation
    vi.runAllTimers();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?message=password-reset-success');
    });

    vi.useRealTimers();
  });

  it('handles password reset error', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: {
        message: 'Password update failed',
        code: 'mock_code',
        status: 400,
        name: 'AuthError',
      } as import('@supabase/supabase-js').AuthError,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    // Fill in valid passwords
    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'newpassword123' } });

    const submitButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password update failed')).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match on submission', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    // Fill in different passwords
    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'different123' } });

    const submitButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText((text) => text.includes('Passwords do not match'))).toBeInTheDocument();
    });
  });

  it('shows error when password is too short on submission', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    // Fill in short matching passwords
    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: '123' } });

    const submitButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText((text) => text.includes('at least 6 characters'))).toBeInTheDocument();
    });
  });

  it('handles back to sign in navigation', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
    renderResetPassword();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }));
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('sets up beforeunload event listener', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
  });

  it('cleans up beforeunload event listener on unmount', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    const { unmount } = renderResetPassword();

    await waitFor(() => {
      expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('provides accessibility features', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    const { container } = renderResetPassword();
    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('New Password')).toHaveAttribute('type', 'password');
    expect(screen.getByPlaceholderText('Confirm New Password')).toHaveAttribute('type', 'password');
  });

  it('shows loading spinner in success state', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    // Fill in valid passwords and submit
    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'newpassword123' } });

    const submitButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(submitButton);

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Password Reset Successful!')).toBeInTheDocument();
    });

    // Check for loading spinner
    expect(screen.getByRole('status', { name: /redirecting to login/i })).toBeInTheDocument();
  });

  it('handles unexpected errors during password reset', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { 
        session: mockSession
      },
      error: null,
    });

    vi.mocked(supabase.auth.updateUser).mockRejectedValue(new Error('Network error'));

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    });

    // Fill in valid passwords
    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), { target: { value: 'newpassword123' } });

    const submitButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
  });
}); 