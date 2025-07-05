import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WelcomeModal from '../WelcomeModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the services
vi.mock('../../services/profileService', () => ({
  profileService: {
    getProfile: vi.fn(() => Promise.resolve({
      display_name: 'Test User',
      avatar_id: 'cat',
      currency: 'USD',
      timezone: 'UTC',
      paycheck_frequency: 'bi-weekly',
      paycheck_reference_date: '2024-01-15'
    })),
    updateProfile: vi.fn(() => Promise.resolve({ success: true }))
  }
}));

// Mock the hooks
vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(() => ({ current: null }))
}));

// Mock AvatarSelector
vi.mock('../AvatarSelector', () => ({
  __esModule: true,
  default: ({ selectedAvatar, onAvatarSelect }: { selectedAvatar: string; onAvatarSelect: (avatar: string) => void }) => (
    <div data-testid="avatar-selector">
      <button onClick={() => onAvatarSelect('dog')}>Select Dog</button>
      <button onClick={() => onAvatarSelect('cat')}>Select Cat</button>
      <span data-testid="selected-avatar">{selectedAvatar}</span>
    </div>
  )
}));

describe('WelcomeModal', () => {
  const defaultProps = {
    isOpen: true,
    onComplete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    render(<WelcomeModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Welcome to Budget Buddy!')).not.toBeInTheDocument();
  });

  it('renders step 1 (avatar selection) by default', () => {
    render(<WelcomeModal {...defaultProps} />);
    expect(screen.getByText('Welcome to Budget Buddy! 🎉')).toBeInTheDocument();
    expect(screen.getByText('Let\'s personalize your experience')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-selector')).toBeInTheDocument();
    expect(screen.getByText('Skip for now')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('shows progress indicators', () => {
    render(<WelcomeModal {...defaultProps} />);
    const progressDots = screen.getAllByRole('generic').filter(el => 
      el.className.includes('w-3 h-3 rounded-full')
    );
    expect(progressDots).toHaveLength(3);
  });

  it('navigates to step 2 when Next is clicked', () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
    expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
    expect(screen.getByLabelText('How often do you get paid?')).toBeInTheDocument();
    expect(screen.getByLabelText('Reference Paycheck Date *')).toBeInTheDocument();
  });

  it('navigates to step 3 when Next is clicked from step 2', () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Next')); // Go to step 2
    fireEvent.click(screen.getByText('Next')); // Go to step 3
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('1. Add Recurring Expenses:')).toBeInTheDocument();
    expect(screen.getByText('2. See Your Calendar:')).toBeInTheDocument();
    expect(screen.getByText('3. Budget Time!')).toBeInTheDocument();
  });

  it('navigates back to previous step', () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Next')); // Go to step 2
    fireEvent.click(screen.getByText('Back')); // Go back to step 1
    expect(screen.getByTestId('avatar-selector')).toBeInTheDocument();
  });

  it('handles avatar selection', () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Dog'));
    expect(screen.getByTestId('selected-avatar')).toHaveTextContent('dog');
  });

  it('handles form input changes in step 2', () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Next')); // Go to step 2
    
    fireEvent.change(screen.getByLabelText('Currency'), { target: { value: 'EUR' } });
    fireEvent.change(screen.getByLabelText('Timezone'), { target: { value: 'America/New_York' } });
    fireEvent.change(screen.getByLabelText('How often do you get paid?'), { target: { value: 'weekly' } });
    fireEvent.change(screen.getByLabelText('Reference Paycheck Date *'), { target: { value: '2024-01-20' } });
    
    expect(screen.getByLabelText('Currency')).toHaveValue('EUR');
    expect(screen.getByLabelText('Timezone')).toHaveValue('America/New_York');
    expect(screen.getByLabelText('How often do you get paid?')).toHaveValue('weekly');
    expect(screen.getByLabelText('Reference Paycheck Date *')).toHaveValue('2024-01-20');
  });

  it('calls onComplete when Finish is clicked', async () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Next')); // Go to step 2
    fireEvent.click(screen.getByText('Next')); // Go to step 3
    fireEvent.click(screen.getByText('Finish'));
    
    await waitFor(() => {
      expect(defaultProps.onComplete).toHaveBeenCalled();
    });
  });

  it('calls onComplete when Skip is clicked', async () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Skip for now'));
    
    await waitFor(() => {
      expect(defaultProps.onComplete).toHaveBeenCalled();
    });
  });

  it('shows loading state when Finish is clicked', async () => {
    const { profileService } = await import('../../services/profileService');
    vi.mocked(profileService.updateProfile).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(null), 100))
    );
    
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Next')); // Go to step 2
    fireEvent.click(screen.getByText('Next')); // Go to step 3
    fireEvent.click(screen.getByText('Finish'));
    
    expect(screen.getByText('Finishing...')).toBeInTheDocument();
  });

  it('shows loading state when Skip is clicked', async () => {
    const { profileService } = await import('../../services/profileService');
    vi.mocked(profileService.updateProfile).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(null), 100))
    );
    
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Skip for now'));
    
    expect(screen.getByText('Skip for now')).toBeDisabled();
  });

  it('shows error message when update fails', async () => {
    const { profileService } = await import('../../services/profileService');
    vi.mocked(profileService.updateProfile).mockRejectedValue(new Error('Update failed'));
    
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Next')); // Go to step 2
    fireEvent.click(screen.getByText('Next')); // Go to step 3
    fireEvent.click(screen.getByText('Finish'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to save profile settings')).toBeInTheDocument();
    });
  });

  it('shows error message when skip fails', async () => {
    const { profileService } = await import('../../services/profileService');
    vi.mocked(profileService.updateProfile).mockRejectedValue(new Error('Skip failed'));
    
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Skip for now'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to skip welcome setup')).toBeInTheDocument();
    });
  });

  it('loads current profile data when opened', async () => {
    const { profileService } = await import('../../services/profileService');
    render(<WelcomeModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(profileService.getProfile).toHaveBeenCalled();
    });
  });

  it('has correct accessibility attributes', () => {
    render(<WelcomeModal {...defaultProps} />);
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'welcome-modal-title');
    expect(screen.getByText('Welcome to Budget Buddy! 🎉')).toHaveAttribute('id', 'welcome-modal-title');
  });

  it('disables buttons during loading', async () => {
    const { profileService } = await import('../../services/profileService');
    vi.mocked(profileService.updateProfile).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(null), 100))
    );
    
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Next')); // Go to step 2
    fireEvent.click(screen.getByText('Next')); // Go to step 3
    fireEvent.click(screen.getByText('Finish'));
    
    expect(screen.getByText('Finishing...')).toBeDisabled();
  });

  it('clears error when navigating between steps', async () => {
    const { profileService } = await import('../../services/profileService');
    vi.mocked(profileService.updateProfile).mockRejectedValue(new Error('Update failed'));
    
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Next')); // Go to step 2
    fireEvent.click(screen.getByText('Next')); // Go to step 3
    fireEvent.click(screen.getByText('Finish'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to save profile settings')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Back')); // Go back to step 2
    expect(screen.queryByText('Failed to save profile settings')).not.toBeInTheDocument();
  });
}); 