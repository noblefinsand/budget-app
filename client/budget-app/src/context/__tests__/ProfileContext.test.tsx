import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileProvider, useProfile } from '../ProfileContext';
import { mockProfileService } from '../../test/fixtures';

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

  it('should render with initial state', () => {
    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('profile-name')).toHaveTextContent('no-profile');
  });

  it('should load profile successfully', async () => {
    mockProfileService.getProfile.mockResolvedValue({
      id: '1',
      user_id: 'user123',
      display_name: 'Test User',
      avatar_url: 'test-avatar.png',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    });

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User');
    expect(mockProfileService.getProfile).toHaveBeenCalled();
  });

  it('should handle profile load error', async () => {
    mockProfileService.getProfile.mockRejectedValue(new Error('Failed to load profile'));

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Failed to load profile');
  });

  it('should update profile successfully', async () => {
    const updatedProfile = {
      id: '1',
      user_id: 'user123',
      display_name: 'Updated Name',
      avatar_url: 'test-avatar.png',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    };

    mockProfileService.getProfile.mockResolvedValue(updatedProfile);
    mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    screen.getByText('Update Profile').click();

    await waitFor(() => {
      expect(mockProfileService.updateProfile).toHaveBeenCalledWith({ display_name: 'Updated Name' });
    });

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Updated Name');
  });

  it('should handle profile update error', async () => {
    mockProfileService.getProfile.mockResolvedValue({
      id: '1',
      user_id: 'user123',
      display_name: 'Test User',
      avatar_url: 'test-avatar.png',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    });
    mockProfileService.updateProfile.mockRejectedValue(new Error('Update failed'));

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    screen.getByText('Update Profile').click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to update profile');
    });
  });



  it('should refresh profile successfully', async () => {
    const refreshedProfile = {
      id: '1',
      user_id: 'user123',
      display_name: 'Refreshed User',
      avatar_url: 'refreshed-avatar.png',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    };

    mockProfileService.getProfile.mockResolvedValue(refreshedProfile);

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    screen.getByText('Refresh Profile').click();

    await waitFor(() => {
      expect(mockProfileService.getProfile).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  it('should clear error when clearError is called', async () => {
    mockProfileService.getProfile.mockRejectedValue(new Error('Failed to load profile'));

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
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