'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/Container';
import { API_BASE } from '@/lib/config';
import { AdminQRScanner } from '@/components/AdminQRScanner';
import { USCCardScanner } from '@/components/usc-verification/USCCardScanner';
import Link from 'next/link';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  'Washington DC'
];

export default function WaitlistPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [school, setSchool] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [uscEmail, setUscEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !state || !school.trim() || !email.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/waitlist/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          state,
          school: school.trim(),
          email: email.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setSubmitted(true);
      
      // Prevent back button after submit
      window.history.pushState(null, '', window.location.href);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4 pt-24">
        <Container>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-md mx-auto"
          >
            <div className="text-6xl">✅</div>
            <h1 className="font-playfair text-4xl font-bold text-[#eaeaf0]">
              You&apos;re on the list!
            </h1>
            <p className="text-[#eaeaf0]/70 text-lg">
              We&apos;ll notify you at <strong>{email}</strong> when we expand access.
            </p>
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-6">
              <p className="text-sm text-blue-200 mb-4">
                <strong>Want access now?</strong>
              </p>
              <div className="space-y-2 text-[#eaeaf0]/70 text-sm">
                <p>🎓 <strong>USC students:</strong> Scan your campus card</p>
                <p>🎟️ <strong>Have an invite?</strong> Use a friend&apos;s QR code</p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-block rounded-xl bg-white/10 px-6 py-3 font-medium text-[#eaeaf0] hover:bg-white/20 transition-all"
            >
              ← Back to Homepage
            </Link>
          </motion.div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4 pt-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto space-y-8"
        >
          <div className="text-center space-y-4">
            <h1 className="font-playfair text-4xl font-bold text-[#eaeaf0]">
              Join the Waitlist
            </h1>
            <p className="text-[#eaeaf0]/70">
              BUMPIN is currently invite-only. Join our waitlist to be notified when we expand access.
            </p>
            <div className="relative">
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="text-[#eaeaf0]/50 text-sm font-medium">OR</span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>
              
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-6 space-y-4">
                <h2 className="text-center font-playfair text-xl font-bold text-blue-300">
                  🎓 USC Students
                </h2>
                <p className="text-center text-blue-200 text-sm">
                  Scan admin QR code OR your USC campus card
                </p>
                
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="w-full rounded-xl bg-blue-500 px-6 py-3 font-bold text-white hover:bg-blue-600 transition-all"
                >
                  📱 Scan QR Code or Barcode
                </button>
                
                <p className="text-xs text-center text-blue-200/70">
                  QR codes available at campus events. Card barcode on back of USC ID.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#eaeaf0]">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-[#eaeaf0] placeholder-[#eaeaf0]/50 focus:outline-none focus:ring-2 focus:ring-[#ffc46a]"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#eaeaf0]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-[#eaeaf0] placeholder-[#eaeaf0]/50 focus:outline-none focus:ring-2 focus:ring-[#ffc46a]"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#eaeaf0]">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-[#eaeaf0] focus:outline-none focus:ring-2 focus:ring-[#ffc46a]"
                required
              >
                <option value="">Select your state</option>
                {US_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#eaeaf0]">
                School (Current or Previous)
              </label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-[#eaeaf0] placeholder-[#eaeaf0]/50 focus:outline-none focus:ring-2 focus:ring-[#ffc46a]"
                placeholder="University of Southern California"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#ffc46a] px-6 py-3 font-bold text-[#0a0a0c] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Join Waitlist'}
            </button>

            <p className="text-center text-sm text-[#eaeaf0]/50">
              Already have an account?{' '}
              <Link href="/login" className="text-[#ffc46a] hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </motion.div>

        {/* QR Code Scanner Modal */}
        {showQRScanner && (
          <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-[#0a0a0c] p-6 border border-white/10"
              >
                <h2 className="font-playfair text-2xl font-bold text-[#eaeaf0] mb-4 text-center">
                  Scan Admin QR Code
                </h2>
                <AdminQRScanner
                  onScan={(inviteCode) => {
                    console.log('[Waitlist] QR scanned:', inviteCode);
                    setShowQRScanner(false);
                    router.push(`/onboarding?inviteCode=${inviteCode}`);
                  }}
                  onClose={() => setShowQRScanner(false)}
                />
              </motion.div>
            </div>
          </div>
        )}

        {/* USC Card Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <div className="fixed inset-0 z-[999] bg-black flex flex-col">
            <div className="p-4 bg-black/90 border-b border-white/10">
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                <h2 className="font-playfair text-xl font-bold text-[#eaeaf0]">
                  Scan USC Campus Card
                </h2>
                <button
                  onClick={() => setShowBarcodeScanner(false)}
                  className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                >
                  <svg className="w-6 h-6 text-[#eaeaf0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-2xl">
                <USCCardScanner
                  onSuccess={(uscId, rawValue) => {
                    console.log('[Waitlist] USC card scanned:', uscId);
                    // Prompt for admin code
                    const adminCode = prompt('Enter admin invite code (from campus events):');
                    if (adminCode && /^[A-Z0-9]{16}$/i.test(adminCode)) {
                      setShowBarcodeScanner(false);
                      // Store USC card for onboarding
                      sessionStorage.setItem('temp_usc_id', uscId);
                      sessionStorage.setItem('temp_usc_barcode', rawValue);
                      sessionStorage.setItem('usc_card_verified', 'true');
                      router.push(`/onboarding?inviteCode=${adminCode.toUpperCase()}`);
                    } else {
                      alert('Invalid admin code. Get a code from USC campus events.');
                    }
                  }}
                  onSkipToEmail={() => {
                    setShowBarcodeScanner(false);
                    setShowEmailInput(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* USC Email Entry Modal */}
        {showEmailInput && (
          <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-[#0a0a0c] p-8 border border-white/10"
              >
                <h2 className="font-playfair text-2xl font-bold text-[#eaeaf0] mb-4">
                  USC Email Verification
                </h2>
                <p className="text-[#eaeaf0]/70 text-sm mb-6">
                  Enter your @usc.edu email to get started
                </p>
                
                <div className="space-y-4">
                  <input
                    type="email"
                    value={uscEmail}
                    onChange={(e) => setUscEmail(e.target.value)}
                    placeholder="your@usc.edu"
                    className="w-full rounded-xl bg-white/10 px-4 py-3 text-[#eaeaf0] placeholder-[#eaeaf0]/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowEmailInput(false);
                        setUscEmail('');
                      }}
                      className="flex-1 rounded-xl bg-white/10 px-6 py-3 font-medium text-[#eaeaf0] hover:bg-white/20 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!uscEmail.trim().toLowerCase().endsWith('@usc.edu')) {
                          alert('Must be a @usc.edu email address');
                          return;
                        }
                        
                        const adminCode = prompt('Enter admin invite code:');
                        if (adminCode && /^[A-Z0-9]{16}$/i.test(adminCode)) {
                          setShowEmailInput(false);
                          sessionStorage.setItem('usc_email_temp', uscEmail.trim());
                          router.push(`/onboarding?inviteCode=${adminCode.toUpperCase()}`);
                        } else {
                          alert('Invalid admin code format');
                        }
                      }}
                      disabled={!uscEmail.trim()}
                      className="flex-1 rounded-xl bg-[#ffc46a] px-6 py-3 font-medium text-[#0a0a0c] hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}

