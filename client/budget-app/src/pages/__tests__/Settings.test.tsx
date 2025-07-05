import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Settings from '../Settings';
import { AuthProvider } from '../../context/AuthContext';
import { ProfileProvider } from '../../context/ProfileContext';
import { useProfile as useProfileHook } from '../../context/ProfileContext';
import { useAuth as useAuthHook } from '../../context/AuthContext';
import type { Profile } from '../../types/profile';

// Mock profile data
const mockProfile: Profile = {
  id: 'user-123',
  display_name: 'Test User',
  avatar_id: 'cat',
  currency: 'USD',
  timezone: 'UTC',
  paycheck_frequency: 'bi-weekly',
  paycheck_reference_date: '2024-01-15',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  has_completed_welcome: true
};

// Mock child components
vi.mock('../../components/Header', () => ({
  default: ({ onLogout }: { displayName: string; avatarId: string; onLogout: () => void }) => (
    <header data-testid="header">
      <span>Header</span>
      <button onClick={onLogout}>Logout</button>
    </header>
  )
}));

vi.mock('../../components/AvatarSelector', () => ({
  default: ({ selectedAvatar, onAvatarSelect }: { selectedAvatar: string; onAvatarSelect: (avatar: string) => void }) => (
    <div data-testid="avatar-selector">
      <button onClick={() => onAvatarSelect('dog')}>Select Dog</button>
      <button onClick={() => onAvatarSelect('cat')}>Select Cat</button>
      <span>Selected: {selectedAvatar}</span>
    </div>
  )
}));

vi.mock('../../components/LiveRegion', () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="live-region" aria-live="polite">
      {message}
    </div>
  )
}));

// Mock the profile service
vi.mock('../../services/profileService', () => ({
  profileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    getProfileById: vi.fn(),
    checkDisplayNameAvailability: vi.fn(),
    checkEmailAvailability: vi.fn(),
  }
}));

// Mock useProfile and useAuth hooks, but keep the real Providers
vi.mock('../../context/ProfileContext', async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, { useProfile: vi.fn() });
});
vi.mock('../../context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, { useAuth: vi.fn() });
});

function renderSettings() {
  return render(
    <AuthProvider>
      <ProfileProvider>
        <Settings />
      </ProfileProvider>
    </AuthProvider>
  );
}

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for useProfile (loading state)
    vi.mocked(useProfileHook).mockReturnValue({
      profile: null,
      loading: true,
      error: null,
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    // Default mock for useAuth
    vi.mocked(useAuthHook).mockReturnValue({
      user: null,
      loading: false,
      logout: vi.fn(),
      login: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn(),
      clearError: vi.fn(),
      error: null
    });
  });

  it('renders loading state initially', () => {
    renderSettings();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading settings')).toBeInTheDocument();
  });

  it('renders settings form when profile is loaded', async () => {
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paycheck frequency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reference paycheck date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
  });

  it('populates form with profile data', async () => {
    const mockUpdateProfile = vi.fn();
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockProfile.display_name || '')).toBeInTheDocument();
    });
    // Check that the form fields are rendered with the profile data
    expect(screen.getByDisplayValue(mockProfile.display_name || '')).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toHaveValue(mockProfile.currency);
    expect(screen.getByLabelText(/timezone/i)).toHaveValue(mockProfile.timezone);
    expect(screen.getByLabelText(/paycheck frequency/i)).toHaveValue(mockProfile.paycheck_frequency);
    expect(screen.getByLabelText(/reference paycheck date/i)).toHaveValue(mockProfile.paycheck_reference_date || '');
  });

  it('shows validation errors for required fields', async () => {
    const mockUpdateProfile = vi.fn();
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });
    // Clear required fields to trigger validation
    const displayNameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(displayNameInput, { target: { value: '' } });
    fireEvent.blur(displayNameInput);
    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
    });
  });

  it('handles form submission successfully', async () => {
    const mockUpdateProfile = vi.fn().mockResolvedValue(true);
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
    });
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        display_name: mockProfile.display_name,
        avatar_id: mockProfile.avatar_id,
        currency: mockProfile.currency,
        timezone: mockProfile.timezone,
        paycheck_frequency: mockProfile.paycheck_frequency,
        paycheck_reference_date: mockProfile.paycheck_reference_date
      });
    });
    await waitFor(() => {
      expect(screen.getAllByText('Settings saved successfully!')).toHaveLength(2);
    });
  });

  it('handles form submission failure', async () => {
    const mockUpdateProfile = vi.fn().mockResolvedValue(false);
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
    });
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getAllByText('Failed to save settings')).toHaveLength(2);
    });
  });

  it('handles avatar selection', async () => {
    const mockUpdateProfile = vi.fn();
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByTestId('avatar-selector')).toBeInTheDocument();
    });
    const dogButton = screen.getByText('Select Dog');
    fireEvent.click(dogButton);
    // The avatar selection should update the form state
    await waitFor(() => {
      expect(screen.getByText('Selected: dog')).toBeInTheDocument();
    });
  });

  it('shows error message from context', async () => {
    const mockUpdateProfile = vi.fn();
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: 'Profile update failed',
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('Profile update failed')).toBeInTheDocument();
    });
  });

  it('disables save button when form has errors', async () => {
    const mockUpdateProfile = vi.fn();
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });
    // Clear required field to create validation error
    const displayNameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(displayNameInput, { target: { value: '' } });
    fireEvent.blur(displayNameInput);
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      expect(saveButton).toBeDisabled();
    });
  });

  it('shows saving state during form submission', async () => {
    let resolveUpdateProfile: (value: boolean) => void;
    const updateProfilePromise = new Promise<boolean>((resolve) => {
      resolveUpdateProfile = resolve;
    });
    const mockUpdateProfile = vi.fn().mockReturnValue(updateProfilePromise);
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
    });
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving.../i })).toBeDisabled();
    });
    // Resolve the promise
    resolveUpdateProfile!(true);
    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });
  });

  it('handles all form field changes', async () => {
    const mockUpdateProfile = vi.fn();
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });
    // Test display name change
    const displayNameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(displayNameInput, { target: { value: 'New Name' } });
    expect(displayNameInput).toHaveValue('New Name');
    // Test currency change
    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'EUR' } });
    expect(currencySelect).toHaveValue('EUR');
    // Test timezone change
    const timezoneSelect = screen.getByLabelText(/timezone/i);
    fireEvent.change(timezoneSelect, { target: { value: 'America/New_York' } });
    expect(timezoneSelect).toHaveValue('America/New_York');
    // Test paycheck frequency change
    const frequencySelect = screen.getByLabelText(/paycheck frequency/i);
    fireEvent.change(frequencySelect, { target: { value: 'monthly' } });
    expect(frequencySelect).toHaveValue('monthly');
    // Test reference date change
    const dateInput = screen.getByLabelText(/reference paycheck date/i);
    fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
    expect(dateInput).toHaveValue('2024-01-15');
  });

  it('validates all required fields', async () => {
    const mockUpdateProfile = vi.fn();
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });
    // Clear all required fields
    const displayNameInput = screen.getByLabelText(/display name/i);
    const currencySelect = screen.getByLabelText(/currency/i);
    const timezoneSelect = screen.getByLabelText(/timezone/i);
    const frequencySelect = screen.getByLabelText(/paycheck frequency/i);
    const dateInput = screen.getByLabelText(/reference paycheck date/i);
    fireEvent.change(displayNameInput, { target: { value: '' } });
    fireEvent.change(currencySelect, { target: { value: '' } });
    fireEvent.change(timezoneSelect, { target: { value: '' } });
    fireEvent.change(frequencySelect, { target: { value: '' } });
    fireEvent.change(dateInput, { target: { value: '' } });
    fireEvent.blur(displayNameInput);
    fireEvent.blur(currencySelect);
    fireEvent.blur(timezoneSelect);
    fireEvent.blur(frequencySelect);
    fireEvent.blur(dateInput);
    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
      expect(screen.getByText('Currency is required')).toBeInTheDocument();
      expect(screen.getByText('Timezone is required')).toBeInTheDocument();
      expect(screen.getByText('Paycheck frequency is required')).toBeInTheDocument();
      expect(screen.getByText('Reference paycheck date is required')).toBeInTheDocument();
    });
  });

  it('provides accessibility features', async () => {
    const mockUpdateProfile = vi.fn();
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
    // Check for proper labels and required field indicators
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paycheck frequency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reference paycheck date/i)).toBeInTheDocument();
    // Check for required field indicators
    const requiredSpans = screen.getAllByText('*');
    expect(requiredSpans).toHaveLength(5);
    // Check for live region
    expect(screen.getByTestId('live-region')).toBeInTheDocument();
  });

  it('handles logout from header', async () => {
    const mockLogout = vi.fn();
    vi.mocked(useAuthHook).mockReturnValue({
      user: null,
      loading: false,
      logout: mockLogout,
      login: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn(),
      clearError: vi.fn(),
      error: null
    });
    const mockUpdateProfile = vi.fn();
    vi.mocked(useProfileHook).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      refreshProfile: vi.fn(),
      clearError: vi.fn()
    });
    renderSettings();
    await waitFor(() => {
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });
}); 