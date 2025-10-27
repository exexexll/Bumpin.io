'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

interface TwitterEmbedProps {
  tweetUrl: string;
  onLoad?: () => void;
}

/**
 * Twitter/X Official Embed
 * Uses Twitter's approved embedding method
 */
export function TwitterEmbed({ tweetUrl, onLoad }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // When Twitter widgets script loads, create tweet
    if (scriptLoadedRef.current && containerRef.current && (window as any).twttr?.widgets) {
      // Clear container
      containerRef.current.innerHTML = '';
      
      // Create tweet widget
      (window as any).twttr.widgets.createTweet(
        tweetUrl.split('/').pop()?.split('?')[0], // Extract tweet ID
        containerRef.current,
        {
          theme: 'dark',
          align: 'center',
        }
      ).then(() => {
        console.log('[TwitterEmbed] Tweet loaded:', tweetUrl);
        onLoad?.();
      });
    }
  }, [tweetUrl, onLoad]);

  const handleScriptLoad = () => {
    scriptLoadedRef.current = true;
    
    // Process tweets when script loads
    if ((window as any).twttr?.widgets && containerRef.current) {
      // Clear container
      containerRef.current.innerHTML = '';
      
      // Create tweet widget
      (window as any).twttr.widgets.createTweet(
        tweetUrl.split('/').pop()?.split('?')[0], // Extract tweet ID
        containerRef.current,
        {
          theme: 'dark',
          align: 'center',
        }
      ).then(() => {
        console.log('[TwitterEmbed] Script loaded, tweet created');
        onLoad?.();
      });
    }
  };

  return (
    <>
      {/* Twitter Widgets Script (official) */}
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
      />

      {/* Twitter Embed Container */}
      <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-auto bg-black">
        {/* Fallback while loading */}
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-5xl mb-4">𝕏</div>
          <div className="text-white mb-2">Loading tweet...</div>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View on X/Twitter
          </a>
        </div>
      </div>
    </>
  );
}

