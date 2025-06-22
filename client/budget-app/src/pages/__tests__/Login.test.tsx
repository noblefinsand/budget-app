import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../Login';
import { AuthProvider } from '../../context/AuthContext';
import supabase from '../../../utils/supabase';
import {
  setupAvailableCredentials,
  validLoginData,
  nonExistentEmail,
  mockAuthResponse,
} from '../../test/fixtures';

function renderLogin() {
  return render(
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form fields and buttons', async () => {
    renderLogin();
    await waitFor(() => expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument());
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it('shows error if email is not registered on reset password', async () => {
    // Mock the email availability check to return true (email is available/not registered)
    setupAvailableCredentials();
    
    renderLogin();
    await waitFor(() => expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/forgot your password/i));
    const emailInput = screen.getByPlaceholderText(/enter your email address/i);
    fireEvent.change(emailInput, { target: { value: nonExistentEmail.email } });
    
    // Wait for the email validation to complete
    await waitFor(() => {
      expect(screen.getByText(/Email not registered/i)).toBeInTheDocument();
    });
  });

  it('calls login on submit', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockAuthResponse as any);
    renderLogin();
    await waitFor(() => expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: validLoginData.email } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: validLoginData.password } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validLoginData.email,
        password: validLoginData.password,
      });
    });
  });
}); 