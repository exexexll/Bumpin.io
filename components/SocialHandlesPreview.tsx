'use client';

/**
 * Social Handles Preview
 * Shows user's social media handles in matchmaking card
 * Clickable to open in floating browser
 */

interface SocialHandlesPreviewProps {
  socials?: Record<string, string>;
}

const socialPlatforms = [
  { key: 'instagram', iconPath: '/icons/instagram.png', label: 'Instagram' },
  { key: 'snapchat', iconPath: '/icons/snapchat.png', label: 'Snapchat' },
  { key: 'tiktok', iconPath: '/icons/tiktok.png', label: 'TikTok' },
  { key: 'twitter', iconPath: '/icons/twitter.png', label: 'Twitter/X' },
];

export function SocialHandlesPreview({ socials }: SocialHandlesPreviewProps) {
  if (!socials || Object.keys(socials).length === 0) {
    return null;
  }

  // Filter to only socials that have values
  const availableSocials = socialPlatforms.filter(platform => 
    socials[platform.key] && socials[platform.key].trim()
  );

  if (availableSocials.length === 0) {
    return null;
  }

  // Normalize URL based on platform (research-based best practices)
  const normalizeUrl = (platform: string, handle: string): string => {
    // Remove common prefixes: @, http://, https://
    const clean = handle.replace(/^(@|https?:\/\/(www\.)?)/i, '').trim();
    
    switch (platform) {
      case 'instagram':
        // Instagram: username only, lowercase recommended
        return `https://www.instagram.com/${clean.toLowerCase()}/`;
      
      case 'snapchat':
        // Snapchat: add/ endpoint for public profiles
        return `https://www.snapchat.com/add/${clean}`;
      
      case 'tiktok':
        // TikTok: @ prefix in URL, username as-is
        return `https://www.tiktok.com/@${clean}`;
      
      case 'twitter':
        // Twitter/X: username only
        return `https://twitter.com/${clean}`;
      
      default:
        return '#';
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {availableSocials.map(platform => {
        const handle = socials[platform.key];
        const url = normalizeUrl(platform.key, handle);

        return (
          <a
            key={platform.key}
            href={url}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center border border-white/20 hover:scale-110 active:scale-95"
            title={`${platform.label}: ${handle}`}
          >
            {/* Official app icon - use PNG with transparent background */}
            <img 
              src={platform.iconPath} 
              alt={platform.label}
              className="w-5 h-5 object-contain"
            />
          </a>
        );
      })}
    </div>
  );
}

