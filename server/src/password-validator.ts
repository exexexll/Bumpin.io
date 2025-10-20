/**
 * Password Validation Utility
 * Industry-standard password security checks
 * Based on NIST SP 800-63B guidelines
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number; // 0-100
}

/**
 * Common passwords blacklist
 * Source: Top 100 most commonly used passwords
 * NIST recommends screening against known breached/common passwords
 */
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey',
  'password123', '123456789', '12345', '1234567', '1234567890',
  'qwerty123', '000000', '111111', '123123', 'password1',
  'qwertyuiop', 'admin', 'letmein', 'welcome', 'login',
  'dragon', 'master', 'hello', 'freedom', 'whatever',
  'passw0rd', 'trustno1', 'bailey', 'shadow', 'ashley'
];

/**
 * Validate password strength and security
 * 
 * Requirements (NIST-aligned):
 * - Minimum 6 characters (requested)
 * - Recommended 8+ characters (NIST standard)
 * - Not in common password list
 * - Complexity score based on character diversity
 * 
 * @param password - Plain text password to validate
 * @returns Validation result with errors, warnings, and strength
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Guard against null/undefined
  if (!password) {
    return {
      valid: false,
      errors: ['Password is required'],
      warnings: [],
      strength: 'weak',
      score: 0,
    };
  }

  // CRITICAL: Minimum length check (6 characters as requested)
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
    score = 0;
  } else {
    score += 20; // Base score for minimum length
  }

  // RECOMMENDED: 8+ characters (NIST standard)
  if (password.length < 8 && password.length >= 6) {
    warnings.push('For better security, use 8+ characters (NIST recommended)');
  } else if (password.length >= 8) {
    score += 20; // Bonus for meeting NIST standard
  }

  // Check character diversity
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);

  // Score based on diversity (not required, but strengthens password)
  if (hasLowerCase) score += 10;
  if (hasUpperCase) score += 10;
  if (hasNumber) score += 10;
  if (hasSpecial) score += 10;

  // Length bonus (longer is better)
  if (password.length >= 10) score += 10;
  if (password.length >= 12) score += 10;

  // CRITICAL: Common password check (NIST requirement)
  const passwordLower = password.toLowerCase();
  if (COMMON_PASSWORDS.includes(passwordLower)) {
    errors.push('This password is too common. Please choose a unique password.');
    score = Math.min(score, 20); // Cap at weak even if it has diversity
  }

  // Check for sequential characters (weak patterns)
  if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde/.test(passwordLower)) {
    warnings.push('Avoid sequential characters (123, abc, etc.)');
    score -= 5;
  }

  // Check for repeated characters (weak patterns)
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Avoid repeating characters (aaa, 111, etc.)');
    score -= 5;
  }

  // Ensure score stays in range
  score = Math.max(0, Math.min(100, score));

  // Determine strength category
  let strength: 'weak' | 'medium' | 'strong';
  if (score >= 70) {
    strength = 'strong';
  } else if (score >= 40) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  // Additional warnings based on strength
  if (strength === 'weak' && errors.length === 0) {
    warnings.push('Consider adding uppercase, numbers, or special characters');
  }

  // Valid if no errors (warnings are OK)
  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    strength,
    score,
  };
}

/**
 * Generate helpful error message for users
 */
export function getPasswordErrorMessage(result: PasswordValidationResult): string {
  if (result.valid) {
    return '';
  }

  if (result.errors.length > 0) {
    return result.errors[0]; // Return first error
  }

  return 'Password does not meet requirements';
}

/**
 * Check if password meets minimum security requirements
 * Used for quick validation in middleware
 */
export function meetsMinimumRequirements(password: string): boolean {
  if (!password || password.length < 6) {
    return false;
  }

  const passwordLower = password.toLowerCase();
  if (COMMON_PASSWORDS.includes(passwordLower)) {
    return false;
  }

  return true;
}

