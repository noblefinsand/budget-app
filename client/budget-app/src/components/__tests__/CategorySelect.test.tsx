import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategorySelect from '../CategorySelect';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExpenseCategory } from '../../types/expense';

describe('CategorySelect', () => {
  const defaultProps = {
    value: 'food' as ExpenseCategory,
    onChange: vi.fn(),
    label: 'Category',
    className: 'custom-class'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with the correct label and value', () => {
    render(<CategorySelect {...defaultProps} />);
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('renders without label when not provided', () => {
    render(<CategorySelect {...defaultProps} label={undefined} />);
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CategorySelect {...defaultProps} />);
    const container = screen.getByText('Food').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', () => {
    render(<CategorySelect {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes dropdown when button is clicked again', () => {
    render(<CategorySelect {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('calls onChange when a category is selected', () => {
    render(<CategorySelect {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const housingOption = screen.getByText('Housing');
    fireEvent.click(housingOption);
    expect(defaultProps.onChange).toHaveBeenCalledWith('housing');
  });

  it('closes dropdown after selecting a category', () => {
    render(<CategorySelect {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const housingOption = screen.getByText('Housing');
    fireEvent.click(housingOption);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<CategorySelect {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-labelledby', 'category-label');
  });

  it('shows all category options when dropdown is open', () => {
    render(<CategorySelect {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const expectedCategories = [
      'Housing', 'Utilities', 'Transportation', 'Food', 'Entertainment',
      'Healthcare', 'Insurance', 'Debt', 'Savings', 'Other'
    ];
    
    expectedCategories.forEach(category => {
      const option = screen.getByRole('option', { name: category });
      expect(option).toBeInTheDocument();
    });
  });

  it('highlights the currently selected category', () => {
    render(<CategorySelect {...defaultProps} value="housing" />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const housingOption = screen.getByRole('option', { name: 'Housing' });
    expect(housingOption).toHaveAttribute('aria-selected', 'true');
  });

  it('capitalizes category names correctly', () => {
    render(<CategorySelect {...defaultProps} value="healthcare" />);
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
  });

  it('falls back to "other" when value is not found', () => {
    render(<CategorySelect {...defaultProps} value={'invalid' as ExpenseCategory} />);
    expect(screen.getByText('Other')).toBeInTheDocument();
  });
}); 