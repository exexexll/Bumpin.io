'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

interface TikTokEmbedProps {
  videoUrl: string;
  onLoad?: () => void;
}

/**
 * TikTok Official Embed
 * Uses TikTok's approved embedding method
 */
export function TikTokEmbed({ videoUrl, onLoad }: TikTokEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // When TikTok embed script loads, process embeds
    if (scriptLoadedRef.current && containerRef.current) {
      if ((window as any).tiktokEmbed?.lib) {
        (window as any).tiktokEmbed.lib.render(containerRef.current);
        console.log('[TikTokEmbed] Processed embed for:', videoUrl);
        onLoad?.();
      }
    }
  }, [videoUrl, onLoad]);

  const handleScriptLoad = () => {
    scriptLoadedRef.current = true;
    
    // Process embeds when script loads
    if ((window as any).tiktokEmbed?.lib && containerRef.current) {
      (window as any).tiktokEmbed.lib.render(containerRef.current);
      console.log('[TikTokEmbed] Script loaded, processing embeds');
      onLoad?.();
    }
  };

  return (
    <>
      {/* TikTok Embed Script (official) */}
      <Script
        src="https://www.tiktok.com/embed.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
      />

      {/* TikTok Embed Container */}
      <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-auto bg-black">
        <blockquote
          className="tiktok-embed"
          cite={videoUrl}
          data-video-id={videoUrl.split('/').pop()?.split('?')[0]}
          style={{
            maxWidth: '605px',
            minWidth: '325px',
            margin: '0 auto',
          }}
        >
          {/* Fallback content */}
          <section>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={videoUrl}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                padding: '40px',
                textAlign: 'center',
                color: '#fff',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>View this video on TikTok</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>{videoUrl}</div>
            </a>
          </section>
        </blockquote>
      </div>
    </>
  );
}

