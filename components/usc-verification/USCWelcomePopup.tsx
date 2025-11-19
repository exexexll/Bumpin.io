'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface USCWelcomePopupProps {
  onContinue: () => void;
}

/**
 * Welcome popup for USC admin QR code users
 * Shows before card scanning step
 */
export function USCWelcomePopup({ onContinue }: USCWelcomePopupProps) {
  const [checking, setChecking] = React.useState(false);
  
  const handleContinue = async () => {
    setChecking(true);
    
    // Check if open signup is enabled
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/open-signup/status`);
      const data = await res.json();
      
      if (data.enabled) {
        console.log('[USC Welcome] Open signup ENABLED - skipping card scanner');
        // Redirect to simple signup (name/photo flow)
        window.location.href = '/onboarding';
        return;
      }
    } catch (err) {
      console.error('[USC Welcome] Failed to check open signup, proceeding to card scanner');
    }
    
    // Open signup disabled or check failed - proceed to card scanner
    onContinue();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #990000 0%, #FFCC00 100%)',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-lg bg-white/10 backdrop-blur-xl rounded-2xl p-8 sm:p-12 text-center border-2 border-white/30 shadow-2xl"
      >
        {/* USC Logo/Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <span className="text-7xl sm:text-8xl">🎓</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="font-playfair text-3xl sm:text-5xl font-bold text-white mb-6"
        >
          Welcome to BUMPIN @ USC
        </motion.h1>

        {/* Body - 1-2 sentences as requested */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/90 text-lg sm:text-xl mb-8 leading-relaxed"
        >
          Connect with fellow Trojans through authentic 1-on-1 video chats. 
          Scan your USC campus card to verify your student status and get started.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleContinue}
          disabled={checking}
          className="w-full sm:w-auto px-12 py-4 rounded-xl font-bold text-xl text-[#990000] hover:text-[#770000] transition-all shadow-lg disabled:opacity-50"
          style={{ background: '#FFCC00' }}
        >
          {checking ? 'Checking...' : 'Continue to Verification →'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

