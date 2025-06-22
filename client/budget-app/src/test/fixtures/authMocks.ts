import type { User, Session } from '@supabase/supabase-js';

export const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
};

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: 1234567890,
  token_type: 'bearer',
  user: mockUser,
};

export const mockAuthResponse = {
  data: { user: mockUser, session: mockSession },
  error: null,
};

export const mockAuthErrorResponse = {
  data: { user: null, session: null },
  error: { message: 'Invalid credentials' },
};

export const mockSignUpResponse = {
  data: { user: null, session: null },
  error: null,
};

export const mockSignUpErrorResponse = {
  data: { user: null, session: null },
  error: { message: 'Email already registered' },
};

export const mockPasswordResetResponse = {
  data: {},
  error: null,
};

export const mockPasswordResetErrorResponse = {
  data: {},
  error: { message: 'User not found' },
}; 