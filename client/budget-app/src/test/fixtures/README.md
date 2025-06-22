# Test Fixtures

This directory contains reusable test fixtures and mocks for the budget app tests.

## Structure

```
src/test/fixtures/
├── README.md           # This file
├── index.ts           # Main export file
├── authMocks.ts       # Authentication-related mocks
├── profileMocks.ts    # Profile service mocks
├── formData.ts        # Form data constants
└── routerMocks.ts     # React Router mocks
```

## Usage

Import fixtures in your test files:

```typescript
import {
  mockUser,
  mockAuthResponse,
  validSignUpData,
  setupAvailableCredentials,
  mockNavigate,
} from '../../test/fixtures';
```

## Available Fixtures

### Auth Mocks (`authMocks.ts`)

- `mockUser`: Mock user object
- `mockSession`: Mock session object
- `mockAuthResponse`: Successful auth response
- `mockAuthErrorResponse`: Failed auth response
- `mockSignUpResponse`: Successful signup response
- `mockSignUpErrorResponse`: Failed signup response
- `mockPasswordResetResponse`: Successful password reset response
- `mockPasswordResetErrorResponse`: Failed password reset response

### Profile Service Mocks (`profileMocks.ts`)

- `mockProfileService`: Mock profile service object
- `setupAvailableCredentials()`: Set up mocks for available display name and email
- `setupTakenDisplayName()`: Set up mocks for taken display name, available email
- `setupTakenEmail()`: Set up mocks for available display name, taken email
- `setupAllTaken()`: Set up mocks for both display name and email taken

### Form Data (`formData.ts`)

- `validSignUpData`: Valid signup form data
- `invalidSignUpData`: Invalid signup form data (taken credentials, mismatched passwords)
- `validLoginData`: Valid login form data
- `invalidLoginData`: Invalid login form data
- `resetPasswordData`: Password reset form data
- `nonExistentEmail`: Non-existent email for testing

### Router Mocks (`routerMocks.ts`)

- `mockNavigate`: Mock navigation function
- `mockRouter`: Complete router mock object
- `mockLocation`: Mock location object
- `mockLocationWithSearch(search)`: Helper to create location with search params

## Benefits

1. **Reusability**: Common mocks and data can be shared across tests
2. **Consistency**: Ensures all tests use the same mock data structure
3. **Maintainability**: Changes to mock data only need to be made in one place
4. **Readability**: Tests are cleaner and more focused on behavior
5. **Type Safety**: TypeScript ensures mock data matches expected interfaces

## Example

Before (inline mocks):
```typescript
const mockUser = {
  id: '1',
  email: 'test@example.com',
  // ... more properties
};
vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
  data: { user: mockUser, session: null },
  error: null,
});
```

After (using fixtures):
```typescript
import { mockAuthResponse } from '../../test/fixtures';

vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockAuthResponse as any);
```

## Adding New Fixtures

1. Create or update the appropriate fixture file
2. Export the new fixtures from `index.ts`
3. Update this README if needed
4. Use the fixtures in your tests 