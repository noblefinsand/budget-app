import React from 'react';
import { render, screen, act } from '@testing-library/react';
import LiveRegion from '../LiveRegion';
import { describe, it, expect, vi } from 'vitest';

describe('LiveRegion', () => {
  it('renders with the correct aria-live type', () => {
    render(<LiveRegion message="Hello" type="assertive" />);
    const region = screen.getByLabelText('Live region');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('defaults to polite aria-live', () => {
    render(<LiveRegion message="Hello" />);
    const region = screen.getByLabelText('Live region');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('applies additional className if provided', () => {
    render(<LiveRegion message="Hello" className="custom-class" />);
    const region = screen.getByLabelText('Live region');
    expect(region.className).toMatch(/custom-class/);
  });

  it('updates the message and clears before setting new message', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<LiveRegion message="First" />);
    const region = screen.getByLabelText('Live region');
    expect(region.textContent).toBe(''); // Initially empty due to clear
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(region.textContent).toBe('First');
    rerender(<LiveRegion message="Second" />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(region.textContent).toBe('Second');
    vi.useRealTimers();
  });
}); 