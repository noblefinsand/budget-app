import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { mockRouter } from './fixtures/routerMocks';
import { mockProfileService } from './fixtures/profileMocks';

// Mock Supabase
vi.mock('../../utils/supabase', () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      setSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
      update: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    rpc: vi.fn(),
  },
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: mockRouter.useNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    Link: mockRouter.Link,
    useLocation: mockRouter.useLocation,
    useParams: mockRouter.useParams,
  };
});

// Mock profile service
vi.mock('../services/profileService', () => ({
  profileService: mockProfileService,
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})); 