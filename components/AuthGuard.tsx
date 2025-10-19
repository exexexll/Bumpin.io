'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getEventStatus } from '@/lib/api';
import BanNotification from './BanNotification';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Protects routes from unauthorized access
 * Redirects to onboarding if no session exists
 * Shows ban notification if user is banned
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [eventCheckComplete, setEventCheckComplete] = useState(false);

  useEffect(() => {
    const session = getSession();
    
    // Public routes that don't require authentication
    const publicRoutes = [
      '/', 
      '/onboarding', 
      '/login', 
      '/manifesto', 
      '/blacklist',
      '/event-wait', // Event wait page is semi-public (requires session but not full access)
      // Legal pages - must be publicly accessible
      '/terms-of-service',
      '/privacy-policy',
      '/acceptable-use',
      '/cookie-policy',
      '/community-guidelines',
      '/content-policy',
    ];
    
    // Admin routes bypass event checks
    const isAdminRoute = pathname?.startsWith('/admin');
    
    // Check if current route is public
    const isPublicRoute = publicRoutes.includes(pathname || '');
    
    // If not public and no session, redirect to onboarding
    if (!isPublicRoute && !session) {
      console.log('[AuthGuard] No session found, redirecting to onboarding');
      router.push('/onboarding');
      return;
    }

    // EVENT MODE CHECK: Only check once per pathname change
    if (session && !isPublicRoute && !isAdminRoute && pathname !== '/event-wait') {
      const eventRestrictedRoutes = ['/main', '/history', '/tracker', '/refilm', '/settings'];
      const isEventRestricted = eventRestrictedRoutes.some(route => pathname?.startsWith(route));
      
      if (isEventRestricted) {
        // Check event status
        getEventStatus(session.sessionToken)
          .then(status => {
            if (status.eventModeEnabled && !status.canAccess) {
              console.log('[AuthGuard] Event mode ON, blocking access - redirect to wait page');
              router.push('/event-wait');
            }
            setEventCheckComplete(true);
          })
          .catch(err => {
            console.error('[AuthGuard] Event check failed, allowing access:', err);
            setEventCheckComplete(true); // Fail open on error
          });
      } else {
        setEventCheckComplete(true);
      }
    } else {
      setEventCheckComplete(true);
    }
  }, [pathname, router]);

  // Show nothing while checking event access (prevents flash of wrong content)
  if (!eventCheckComplete) {
    return null;
  }

  return (
    <>
      <BanNotification />
      {children}
    </>
  );
}

