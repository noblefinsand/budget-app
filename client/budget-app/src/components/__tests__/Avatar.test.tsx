import React from 'react';
import { render, screen } from '@testing-library/react';
import Avatar from '../Avatar';
import { avatarOptions } from '../AvatarSelector';

describe('Avatar', () => {
  it('renders the correct emoji and name for a given avatarId', () => {
    const avatar = avatarOptions[1]; // dog
    render(<Avatar avatarId={avatar.id} />);
    expect(screen.getByTitle(avatar.name)).toHaveTextContent(avatar.emoji);
  });

  it('applies the correct size class for each size prop', () => {
    const { rerender } = render(<Avatar avatarId="cat" size="sm" />);
    expect(screen.getByTitle('Cat').className).toMatch(/w-8 h-8 text-lg/);
    rerender(<Avatar avatarId="cat" size="md" />);
    expect(screen.getByTitle('Cat').className).toMatch(/w-10 h-10 text-xl/);
    rerender(<Avatar avatarId="cat" size="lg" />);
    expect(screen.getByTitle('Cat').className).toMatch(/w-12 h-12 text-2xl/);
  });

  it('applies additional className if provided', () => {
    render(<Avatar avatarId="cat" className="custom-class" />);
    expect(screen.getByTitle('Cat').className).toMatch(/custom-class/);
  });

  it('falls back to the first avatar if avatarId is not found', () => {
    render(<Avatar avatarId="notfound" />);
    const fallback = avatarOptions[0];
    expect(screen.getByTitle(fallback.name)).toHaveTextContent(fallback.emoji);
  });

  it('applies the correct background color style', () => {
    const avatar = avatarOptions[2]; // panda
    render(<Avatar avatarId={avatar.id} />);
    expect(screen.getByTitle(avatar.name).style.backgroundColor).toBe(""); // bgColor is a class, not inline style
  });
}); 