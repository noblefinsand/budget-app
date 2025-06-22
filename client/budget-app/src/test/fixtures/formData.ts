export const validSignUpData = {
  displayName: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  confirmPassword: 'password123',
};

export const invalidSignUpData = {
  displayName: 'takenuser',
  email: 'taken@example.com',
  password: 'password123',
  confirmPassword: 'different123',
};

export const validLoginData = {
  email: 'test@example.com',
  password: 'password123',
};

export const invalidLoginData = {
  email: 'invalid@example.com',
  password: 'wrongpassword',
};

export const resetPasswordData = {
  email: 'test@example.com',
};

export const nonExistentEmail = {
  email: 'nonexistent@example.com',
}; 