import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-router-dom
const mockUseLocation = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    Link: ({ children, to, onClick, ...props }: { children: React.ReactNode; to: string; onClick?: () => void; [key: string]: unknown }) => (
      <a href={to} onClick={onClick} {...props}>
        {children}
      </a>
    )
  };
});

// Mock Avatar component
vi.mock('../Avatar', () => ({
  default: ({ avatarId, size }: { avatarId: string; size: string }) => (
    <div data-testid={`avatar-${avatarId}-${size}`}>Avatar</div>
  )
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Header', () => {
  const defaultProps = {
    displayName: 'John Doe',
    avatarId: 'cat',
    onLogout: vi.fn(),
    onRefresh: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/dashboard' });
  });

  it('renders the logo correctly', () => {
    renderWithRouter(<Header {...defaultProps} />);
    expect(screen.getByText('Budget Buddy')).toBeInTheDocument();
  });

  it('renders user information correctly', () => {
    renderWithRouter(<Header {...defaultProps} />);
    expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-cat-sm')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter(<Header {...defaultProps} />);
    expect(screen.getAllByText('Expenses')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByText('Budget Time')).toHaveLength(2);
    expect(screen.getAllByText('Settings')).toHaveLength(2);
  });

  it('calls onLogout when desktop logout button is clicked', () => {
    renderWithRouter(<Header {...defaultProps} />);
    const logoutButtons = screen.getAllByText('Logout');
    const desktopLogoutButton = logoutButtons[0]; // First logout button is desktop
    fireEvent.click(desktopLogoutButton);
    expect(defaultProps.onLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onRefresh when logo is clicked on dashboard', () => {
    renderWithRouter(<Header {...defaultProps} />);
    const logo = screen.getByText('Budget Buddy');
    fireEvent.click(logo);
    expect(defaultProps.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not call onRefresh when logo is clicked on other pages', () => {
    mockUseLocation.mockReturnValue({ pathname: '/expenses' });
    renderWithRouter(<Header {...defaultProps} />);
    const logo = screen.getByText('Budget Buddy');
    fireEvent.click(logo);
    expect(defaultProps.onRefresh).not.toHaveBeenCalled();
  });

  it('opens mobile menu when hamburger button is clicked', () => {
    renderWithRouter(<Header {...defaultProps} />);
    const hamburgerButton = screen.getByLabelText('Open navigation menu');
    fireEvent.click(hamburgerButton);
    
    expect(screen.getByLabelText('Mobile navigation')).toBeInTheDocument();
    expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows skip link for accessibility', () => {
    renderWithRouter(<Header {...defaultProps} />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders mobile menu with user info when open', () => {
    renderWithRouter(<Header {...defaultProps} />);
    const hamburgerButton = screen.getByLabelText('Open navigation menu');
    fireEvent.click(hamburgerButton);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-cat-md')).toBeInTheDocument();
  });

  it('applies active styling to current page in desktop navigation', () => {
    mockUseLocation.mockReturnValue({ pathname: '/expenses' });
    renderWithRouter(<Header {...defaultProps} />);
    
    const expensesLinks = screen.getAllByText('Expenses');
    const desktopExpensesLink = expensesLinks[0]; // First Expenses link is desktop
    expect(desktopExpensesLink.className).toMatch(/bg-green-700/);
  });

  it('applies active styling to current page in mobile navigation', () => {
    mockUseLocation.mockReturnValue({ pathname: '/budget-time' });
    renderWithRouter(<Header {...defaultProps} />);
    
    const hamburgerButton = screen.getByLabelText('Open navigation menu');
    fireEvent.click(hamburgerButton);
    
    const budgetTimeLinks = screen.getAllByText('Budget Time');
    const mobileBudgetTimeLink = budgetTimeLinks[1]; // Second Budget Time link is mobile
    expect(mobileBudgetTimeLink.className).toMatch(/bg-blue-700/);
  });

  it('handles logout from mobile menu', () => {
    renderWithRouter(<Header {...defaultProps} />);
    const hamburgerButton = screen.getByLabelText('Open navigation menu');
    fireEvent.click(hamburgerButton);
    
    const logoutButtons = screen.getAllByText('Logout');
    const mobileLogoutButton = logoutButtons[1]; // Second logout button is mobile
    fireEvent.click(mobileLogoutButton);
    
    expect(defaultProps.onLogout).toHaveBeenCalledTimes(1);
  });
}); 