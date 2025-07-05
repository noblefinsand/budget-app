import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AvatarSelector from '../AvatarSelector';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { avatarOptions } from '../AvatarSelector';

describe('AvatarSelector', () => {
  const defaultProps = {
    selectedAvatar: 'cat',
    onAvatarSelect: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the label correctly', () => {
    render(<AvatarSelector {...defaultProps} />);
    expect(screen.getByText('Choose Your Avatar')).toBeInTheDocument();
  });

  it('renders all avatar options', () => {
    render(<AvatarSelector {...defaultProps} />);
    
    avatarOptions.forEach(avatar => {
      expect(screen.getByTitle(avatar.name)).toBeInTheDocument();
      expect(screen.getByText(avatar.emoji)).toBeInTheDocument();
    });
  });

  it('shows selected avatar name when an avatar is selected', () => {
    render(<AvatarSelector {...defaultProps} selectedAvatar="dog" />);
    expect(screen.getByText('Selected: Dog')).toBeInTheDocument();
  });

  it('does not show selected text when no avatar is selected', () => {
    render(<AvatarSelector {...defaultProps} selectedAvatar="" />);
    expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
  });

  it('calls onAvatarSelect when an avatar is clicked', () => {
    render(<AvatarSelector {...defaultProps} />);
    const dogButton = screen.getByTitle('Dog');
    fireEvent.click(dogButton);
    expect(defaultProps.onAvatarSelect).toHaveBeenCalledWith('dog');
  });

  it('applies selected styling to the currently selected avatar', () => {
    render(<AvatarSelector {...defaultProps} selectedAvatar="panda" />);
    const pandaButton = screen.getByTitle('Panda');
    expect(pandaButton.className).toMatch(/ring-2 ring-blue-500/);
    expect(pandaButton.className).toMatch(/scale-110/);
  });

  it('does not apply selected styling to non-selected avatars', () => {
    render(<AvatarSelector {...defaultProps} selectedAvatar="cat" />);
    const dogButton = screen.getByTitle('Dog');
    expect(dogButton.className).not.toMatch(/ring-2 ring-blue-500/);
    expect(dogButton.className).not.toMatch(/ring-offset-2 ring-offset-gray-800/);
  });

  it('applies correct background color to each avatar', () => {
    render(<AvatarSelector {...defaultProps} />);
    const catButton = screen.getByTitle('Cat');
    expect(catButton).toHaveStyle({ backgroundColor: 'bg-orange-500' });
  });

  it('has correct accessibility attributes', () => {
    render(<AvatarSelector {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('title');
    });
  });

  it('handles avatar selection correctly', () => {
    render(<AvatarSelector {...defaultProps} />);
    
    // Click on different avatars
    const dogButton = screen.getByTitle('Dog');
    const pandaButton = screen.getByTitle('Panda');
    
    fireEvent.click(dogButton);
    expect(defaultProps.onAvatarSelect).toHaveBeenCalledWith('dog');
    
    fireEvent.click(pandaButton);
    expect(defaultProps.onAvatarSelect).toHaveBeenCalledWith('panda');
  });

  it('shows correct selected avatar name for different selections', () => {
    const { rerender } = render(<AvatarSelector {...defaultProps} selectedAvatar="cat" />);
    expect(screen.getByText('Selected: Cat')).toBeInTheDocument();
    
    rerender(<AvatarSelector {...defaultProps} selectedAvatar="dragon" />);
    expect(screen.getByText('Selected: Dragon')).toBeInTheDocument();
  });

  it('handles empty selectedAvatar gracefully', () => {
    render(<AvatarSelector {...defaultProps} selectedAvatar="" />);
    expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
  });
}); 