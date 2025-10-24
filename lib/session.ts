/**
 * Client-side session management using localStorage
 * 
 * ⚠️ SECURITY WARNING - FOR DEMO/DEVELOPMENT ONLY
 * 
 * This implementation stores session tokens in localStorage which has CRITICAL security issues:
 * 1. XSS Vulnerability: Any JavaScript on the page can read localStorage
 * 2. Browser Extension Access: Extensions can access all localStorage data
 * 3. No Encryption: Tokens stored in plain text
 * 4. Visible in DevTools: Anyone with physical access can see tokens
 * 5. Session Hijacking Risk: Stolen tokens can be used indefinitely until expiry
 * 
 * PRODUCTION MIGRATION REQUIRED:
 * - Backend: Use httpOnly cookies with secure flag
 * - Backend: Set sameSite: 'strict' for CSRF protection
 * - Backend: Use HTTPS only (secure: true)
 * - Frontend: Remove all localStorage session code
 * - Frontend: Cookies automatically sent with requests (no client code needed)
 * 
 * Example production implementation in backend:
 * ```typescript
 * res.cookie('session_token', sessionToken, {
 *   httpOnly: true,  // Not accessible to JavaScript
 *   secure: true,    // HTTPS only
 *   sameSite: 'strict', // CSRF protection
 *   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
 * });
 * ```
 */

const SESSION_KEY = 'bumpin_session';

export interface SessionData {
  sessionToken: string;
  userId: string;
  accountType: 'guest' | 'permanent';
}

export function saveSession(data: SessionData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }
}

export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Safari Session Persistence Fix
 * 
 * Safari on iOS aggressively clears memory when tabs are backgrounded,
 * which can sometimes affect localStorage access timing.
 * 
 * This ensures the session is force-saved before the page unloads/backgrounds.
 */
if (typeof window !== 'undefined') {
  // pagehide event fires before page is unloaded (Safari-compatible)
  window.addEventListener('pagehide', () => {
    const session = getSession();
    if (session) {
      // Force re-save to ensure persistence
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      console.log('[Session] Force-saved session on pagehide (Safari fix)');
    }
  });

  // Also handle visibilitychange for Safari iOS
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const session = getSession();
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        console.log('[Session] Force-saved session on visibility change (Safari fix)');
      }
    }
  });
}

