'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface AdminQRScannerProps {
  onScan: (inviteCode: string) => void;
  onClose: () => void;
}

export function AdminQRScanner({ onScan, onClose }: AdminQRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize scanner with verbose false to hide UI buttons
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
      },
      /* verbose= */ false
    );

    scanner.render(
      // Success callback
      (decodedText) => {
        console.log('[QR] Scanned:', decodedText);
        
        try {
          // Check if it's a URL (QR code from admin)
          if (decodedText.startsWith('http')) {
            const url = new URL(decodedText);
            
            // SECURITY: Validate domain
            if (!url.hostname.includes('napalmsky.com') && 
                !url.hostname.includes('bumpin.io')) {
              setError('Invalid QR code domain');
              return;
            }
            
            // Extract invite code
            const code = url.searchParams.get('inviteCode');
            if (code && /^[A-Z0-9]{16}$/i.test(code)) {
              scanner.clear();
              onScan(code.toUpperCase());
            } else {
              setError('No valid invite code in QR');
            }
          }
          // Check if it's a direct invite code
          else if (/^[A-Z0-9]{16}$/i.test(decodedText)) {
            scanner.clear();
            onScan(decodedText.toUpperCase());
          } else {
            setError('Invalid QR code format');
          }
        } catch (err) {
          setError('Failed to parse QR code');
        }
      },
      // Error callback
      (errorMessage) => {
        // Ignore frequent scan errors
      }
    );

    scannerRef.current = scanner;

    // Auto-timeout after 2 minutes
    const timeout = setTimeout(() => {
      scanner.clear();
      onClose();
    }, 120000);

    return () => {
      clearTimeout(timeout);
      scanner.clear().catch(() => {});
    };
  }, [onScan, onClose]);

  return (
    <div className="space-y-6">
      <div id="qr-reader" className="w-full rounded-xl overflow-hidden"></div>

      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
          <p className="font-medium mb-1">Scan Error</p>
          <p className="text-xs">{error}</p>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full rounded-xl bg-white/10 px-6 py-3 font-medium text-[#eaeaf0] hover:bg-white/20 transition-all"
      >
        Cancel
      </button>

      <div className="text-center space-y-2">
        <p className="text-sm text-[#eaeaf0]/70">
          📱 Point camera at admin QR code
        </p>
        <p className="text-xs text-[#eaeaf0]/50">
          Available at USC campus events
        </p>
      </div>
    </div>
  );
}

