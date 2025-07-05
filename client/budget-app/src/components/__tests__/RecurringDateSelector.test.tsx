import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RecurringDateSelector from '../RecurringDateSelector';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('RecurringDateSelector', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    label: 'Recurring Date'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Weekly frequency', () => {
    it('renders weekly selector with day and date inputs', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="weekly" />);
      
      expect(screen.getByText('Recurring Date')).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Day select
      expect(screen.getByPlaceholderText('Start date')).toBeInTheDocument();
      expect(screen.getByText('Select which day of the week this expense occurs and the start date')).toBeInTheDocument();
    });

    it('shows all days of the week in select', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="weekly" />);
      
      const select = screen.getByDisplayValue('');
      fireEvent.click(select);
      
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      expect(screen.getByText('Wednesday')).toBeInTheDocument();
      expect(screen.getByText('Thursday')).toBeInTheDocument();
      expect(screen.getByText('Friday')).toBeInTheDocument();
      expect(screen.getByText('Saturday')).toBeInTheDocument();
      expect(screen.getByText('Sunday')).toBeInTheDocument();
    });

    it('calls onChange when day is selected', () => {
      render(<RecurringDateSelector {...defaultProps} value="," frequency="weekly" />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('1,');
    });

    it('calls onChange when date is selected', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="weekly" />);
      
      const dateInput = screen.getByPlaceholderText('Start date');
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(',2024-01-15');
    });

    it('maintains both values when updating day', () => {
      render(<RecurringDateSelector {...defaultProps} value="1,2024-01-15" frequency="weekly" />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('1');
      fireEvent.change(select, { target: { value: '2' } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('2,2024-01-15');
    });

    it('maintains both values when updating date', () => {
      render(<RecurringDateSelector {...defaultProps} value="1,2024-01-15" frequency="weekly" />);
      
      const dateInput = screen.getByDisplayValue('2024-01-15');
      fireEvent.change(dateInput, { target: { value: '2024-02-15' } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('1,2024-02-15');
    });
  });

  describe('Bi-weekly frequency', () => {
    it('renders bi-weekly selector with date input', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="bi-weekly" />);
      
      expect(screen.getByText('Recurring Date')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Start date')).toBeInTheDocument();
      expect(screen.getByText('Select the start date for bi-weekly recurrence.')).toBeInTheDocument();
    });

    it('calls onChange when date is selected', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="bi-weekly" />);
      
      const dateInput = screen.getByPlaceholderText('Start date');
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('2024-01-15');
    });

    it('displays current value', () => {
      render(<RecurringDateSelector {...defaultProps} value="2024-01-15" frequency="bi-weekly" />);
      
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
    });
  });

  describe('Monthly frequency', () => {
    it('renders monthly selector with day select', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="monthly" />);
      
      expect(screen.getByText('Recurring Date')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Select which day of the month this expense occurs')).toBeInTheDocument();
    });

    it('shows all days of the month in select', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="monthly" />);
      
      const select = screen.getByRole('combobox');
      fireEvent.click(select);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument();
    });

    it('calls onChange when day is selected', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="monthly" />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '15' } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('15');
    });

    it('displays current value', () => {
      render(<RecurringDateSelector {...defaultProps} value="15" frequency="monthly" />);
      
      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    });
  });

  describe('Yearly frequency', () => {
    it('renders yearly selector with month and day selects', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="yearly" />);
      
      expect(screen.getByText('Recurring Date')).toBeInTheDocument();
      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2); // Month and day selects
      expect(screen.getByText('Select the month and day for yearly recurrence')).toBeInTheDocument();
    });

    it('shows all months in first select', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="yearly" />);
      
      const selects = screen.getAllByRole('combobox');
      fireEvent.click(selects[0]);
      
      expect(screen.getByText('January')).toBeInTheDocument();
      expect(screen.getByText('June')).toBeInTheDocument();
      expect(screen.getByText('December')).toBeInTheDocument();
    });

    it('shows all days in second select', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="yearly" />);
      
      const selects = screen.getAllByRole('combobox');
      fireEvent.click(selects[1]);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument();
    });

    it('calls onChange when month is selected', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="yearly" />);
      
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '6' } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('6,');
    });

    it('calls onChange when day is selected', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="yearly" />);
      
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[1], { target: { value: '15' } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(',15');
    });

    it('maintains both values when updating month', () => {
      render(<RecurringDateSelector {...defaultProps} value="6,15" frequency="yearly" />);
      
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '7' } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('7,15');
    });

    it('maintains both values when updating day', () => {
      render(<RecurringDateSelector {...defaultProps} value="6,15" frequency="yearly" />);
      
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[1], { target: { value: '20' } });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('6,20');
    });

    it('displays current values', () => {
      render(<RecurringDateSelector {...defaultProps} value="6,15" frequency="yearly" />);
      
      const selects = screen.getAllByRole('combobox');
      expect(selects[0]).toHaveValue('6');
      expect(selects[1]).toHaveValue('15');
    });
  });

  describe('Invalid frequency', () => {
    it('renders nothing for invalid frequency', () => {
      render(<RecurringDateSelector {...defaultProps} frequency={'invalid' as 'weekly' | 'bi-weekly' | 'monthly' | 'yearly'} />);
      
      expect(screen.getByText('Recurring Date')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper label association', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="monthly" />);
      
      const label = screen.getByText('Recurring Date');
      expect(label).toBeInTheDocument();
    });

    it('has proper form controls', () => {
      render(<RecurringDateSelector {...defaultProps} frequency="monthly" />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });
}); 