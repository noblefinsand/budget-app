import { vi } from 'vitest';
import React from 'react';

export const mockNavigate = vi.fn();

export const mockRouter = {
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => {
    return React.createElement('a', { href: to }, children);
  },
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  }),
  useParams: () => ({}),
};

export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
};

export const mockLocationWithSearch = (search: string) => ({
  ...mockLocation,
  search,
}); 