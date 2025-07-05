import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Avatar from './Avatar';

interface HeaderProps {
  displayName: string;
  avatarId: string;
  onLogout: () => void;
  onRefresh?: () => void;
}

export default function Header({ displayName, avatarId, onLogout, onRefresh }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/dashboard' && onRefresh) {
      e.preventDefault();
      onRefresh();
    }
  };

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>
      <nav className="bg-gray-800 shadow-lg border-b border-gray-700 relative z-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* Mobile slide-out menu */}
      <div
        id="mobile-menu"
        className={`fixed top-0 left-0 h-full z-50 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          w-2/3 max-w-xs md:hidden flex flex-col`}
        style={{ minWidth: 220 }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col items-center p-4 border-b border-gray-700">
          <Avatar avatarId={avatarId} size="md" />
          <span className="text-white font-semibold text-lg mt-2">{displayName}</span>
        </div>
        <nav className="flex flex-col p-4 space-y-2">
          <Link
            to="/expenses"
            className={`$${location.pathname.startsWith('/expenses') ? 'bg-green-700' : 'bg-green-600'} hover:bg-green-700 text-white px-4 py-2 rounded-lg text-base font-medium transition-colors duration-200`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Expenses
          </Link>
          <Link
            to="/budget-time"
            className={`$${location.pathname.startsWith('/budget-time') ? 'bg-blue-700' : 'bg-blue-600'} hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-base font-medium transition-colors duration-200`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Budget Time
          </Link>
          <Link
            to="/settings"
            className={`$${location.pathname.startsWith('/settings') ? 'bg-gray-600' : 'bg-gray-700'} hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-base font-medium transition-colors duration-200`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Settings
          </Link>
          <button
            onClick={() => {
              onLogout();
              setMobileMenuOpen(false);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-base font-medium transition-colors duration-200 text-left"
          >
            Logout
          </button>
        </nav>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 w-full">
          {/* Left: Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link
              to="/dashboard"
              onClick={handleLogoClick}
              className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors duration-200 cursor-pointer"
            >
              Budget Buddy
            </Link>
          </div>
          {/* Center: Main nav (desktop/tablet only) */}
          <div className="hidden md:flex items-center space-x-2 ml-8">
            <Link
              to="/expenses"
              className={`$${location.pathname.startsWith('/expenses') ? 'bg-green-700' : 'bg-green-600'} hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200`}
            >
              Expenses
            </Link>
            <Link
              to="/budget-time"
              className={`$${location.pathname.startsWith('/budget-time') ? 'bg-blue-700' : 'bg-blue-600'} hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200`}
            >
              Budget Time
            </Link>
            <Link
              to="/settings"
              className={`$${location.pathname.startsWith('/settings') ? 'bg-gray-600' : 'bg-gray-700'} hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200`}
            >
              Settings
            </Link>
          </div>
          {/* Right: User actions (desktop/tablet only) */}
          <div className="hidden md:flex items-center space-x-4 ml-auto">
            <Avatar avatarId={avatarId} size="sm" />
            <span className="text-gray-300">Welcome, {displayName}</span>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Logout
            </button>
          </div>
          {/* Mobile: Hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white ml-auto"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
    </>
  );
} 