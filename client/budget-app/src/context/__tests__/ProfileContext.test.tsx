import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileProvider, useProfile } from '../ProfileContext';
import { AuthProvider } from '../AuthContext';
import { mockProfileService } from '../../test/fixtures';

// Mock AuthProvider for testing
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

// Test component to access profile context
function TestComponent() {
  const { 
    profile, 
    loading, 
    error, 
    updateProfile, 
    refreshProfile,
    clearError 
  } = useProfile();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="profile-name">{profile?.display_name || 'no-profile'}</div>
      <button onClick={() => updateProfile({ display_name: 'Updated Name' })}>Update Profile</button>
      <button onClick={() => refreshProfile()}>Refresh Profile</button>
      <button onClick={() => clearError()}>Clear Error</button>
    </div>
  );
}

describe('ProfileContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('should render with initial state', () => {
    render(
      <MockAuthProvider>
        <ProfileProvider>
          <TestComponent />
        </ProfileProvider>
      </MockAuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('profile-name')).toHaveTextContent('no-profile');
  });

  it.skip('should load profile successfully', async () => {
    mockProfileService.getProfile.mockResolvedValue({
      data: { name: 'Test User', email: 'test@example.com' },
      error: null
    });

    render(
      <MockAuthProvider>
        <ProfileProvider>
          <TestComponent />
        </ProfileProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User');
    expect(mockProfileService.getProfile).toHaveBeenCalled();
  });

  it.skip('should handle profile load error', async () => {
    mockProfileService.getProfile.mockResolvedValue({
      data: null,
      error: { message: 'Failed to load profile' }
    });

    render(
      <MockAuthProvider>
        <ProfileProvider>
          <TestComponent />
        </ProfileProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load profile');
    });
  });

  it.skip('should update profile successfully', async () => {
    mockProfileService.updateProfile.mockResolvedValue({
      data: { name: 'Updated User', email: 'updated@example.com' },
      error: null
    });

    render(
      <MockAuthProvider>
        <ProfileProvider>
          <TestComponent />
        </ProfileProvider>
      </MockAuthProvider>
    );

    screen.getByText('Update Profile').click();

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Updated User');
    });
    expect(mockProfileService.updateProfile).toHaveBeenCalled();
  });

  it.skip('should handle profile update error', async () => {
    mockProfileService.updateProfile.mockResolvedValue({
      data: null,
      error: { message: 'Failed to update profile' }
    });

    render(
      <MockAuthProvider>
        <ProfileProvider>
          <TestComponent />
        </ProfileProvider>
      </MockAuthProvider>
    );

    screen.getByText('Update Profile').click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to update profile');
    });
  });

  it.skip('should refresh profile successfully', async () => {
    mockProfileService.getProfile.mockResolvedValue({
      data: { name: 'Refreshed User', email: 'refreshed@example.com' },
      error: null
    });

    render(
      <MockAuthProvider>
        <ProfileProvider>
          <TestComponent />
        </ProfileProvider>
      </MockAuthProvider>
    );

    screen.getByText('Refresh Profile').click();

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Refreshed User');
    });

    await waitFor(() => {
      expect(mockProfileService.getProfile).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  it.skip('should clear error when clearError is called', async () => {
    mockProfileService.getProfile.mockResolvedValue({
      data: null,
      error: { message: 'Failed to load profile' }
    });

    render(
      <MockAuthProvider>
        <ProfileProvider>
          <TestComponent />
        </ProfileProvider>
      </MockAuthProvider>
    );

    // Trigger an error first
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load profile');
    });

    // Clear the error
    screen.getByText('Clear Error').click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });
}); 