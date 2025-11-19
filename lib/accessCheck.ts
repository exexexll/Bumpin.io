/**
 * Access Check Utilities
 * Centralized logic for checking user access
 */

export type PaidStatus = 'unpaid' | 'paid' | 'qr_verified' | 'qr_grace_period' | 'open_signup';

/**
 * Check if user has access to the platform
 * Accepts: paid, qr_verified, qr_grace_period, OR open_signup
 */
export function hasAccess(paidStatus?: string): boolean {
  if (!paidStatus) return false;
  
  return paidStatus === 'paid' ||
         paidStatus === 'qr_verified' ||
         paidStatus === 'qr_grace_period' ||
         paidStatus === 'open_signup';
}

/**
 * Check if user needs to go to paywall/waitlist
 */
export function needsPayment(paidStatus?: string): boolean {
  return !hasAccess(paidStatus);
}

