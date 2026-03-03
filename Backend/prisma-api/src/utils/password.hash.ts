import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hash password using bcrypt
 * @param plainText - Plain text password to hash
 * @returns Hashed password
 */
export const hashPassword = async (plainText: string): Promise<string> => {
  try {
    return await bcrypt.hash(plainText, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare password with hash
 * @param plainText - Plain text password to compare
 * @param hash - Hashed password from database
 * @returns true if password matches, false otherwise
 */
export const comparePassword = async (
  plainText: string,
  hash: string,
): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainText, hash);
  } catch (error) {
    throw new Error('Failed to compare password');
  }
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns { valid: boolean, error?: string }
 */
export const validatePasswordStrength = (
  password: string,
): { valid: boolean; error?: string } => {
  // Check length
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  // Check uppercase
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  // Check lowercase
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  // Check number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
};
