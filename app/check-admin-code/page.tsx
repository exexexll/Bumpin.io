'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE } from '@/lib/config';

/**
 * Intermediate page that checks if invite code is admin type
 * Then redirects to correct onboarding flow
 */
export default function CheckAdminCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const inviteCode = searchParams.get('inviteCode');
    
    if (!inviteCode) {
      // No code, go to regular onboarding
      router.push('/onboarding');
      return;
    }

    // Check code type on server
    fetch(`${API_BASE}/payment/validate-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inviteCode }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid && data.type === 'admin') {
          // Admin code - redirect to onboarding with admin flag
          router.push(`/onboarding?inviteCode=${inviteCode}&adminCode=true`);
        } else {
          // Regular code - normal onboarding
          router.push(`/onboarding?inviteCode=${inviteCode}`);
        }
      })
      .catch(err => {
        console.error('Code validation failed:', err);
        // Fallback to regular onboarding
        router.push(`/onboarding?inviteCode=${inviteCode}`);
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#ffc46a] border-t-transparent mb-4"></div>
        <p className="text-[#eaeaf0]">Loading...</p>
      </div>
    </div>
  );
}

