import { vi } from 'vitest';

export const mockProfileService = {
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  getProfileById: vi.fn(),
  checkDisplayNameAvailability: vi.fn(),
  checkEmailAvailability: vi.fn(),
};

export const mockDisplayNameAvailable = true;
export const mockDisplayNameTaken = false;
export const mockEmailAvailable = true;
export const mockEmailTaken = false;

// Helper functions to set up common mock scenarios
export const setupAvailableCredentials = () => {
  mockProfileService.checkDisplayNameAvailability.mockResolvedValue(mockDisplayNameAvailable);
  mockProfileService.checkEmailAvailability.mockResolvedValue(mockEmailAvailable);
};

export const setupTakenDisplayName = () => {
  mockProfileService.checkDisplayNameAvailability.mockResolvedValue(mockDisplayNameTaken);
  mockProfileService.checkEmailAvailability.mockResolvedValue(mockEmailAvailable);
};

export const setupTakenEmail = () => {
  mockProfileService.checkDisplayNameAvailability.mockResolvedValue(mockDisplayNameAvailable);
  mockProfileService.checkEmailAvailability.mockResolvedValue(mockEmailTaken);
};

export const setupAllTaken = () => {
  mockProfileService.checkDisplayNameAvailability.mockResolvedValue(mockDisplayNameTaken);
  mockProfileService.checkEmailAvailability.mockResolvedValue(mockEmailTaken);
}; 