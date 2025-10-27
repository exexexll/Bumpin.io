'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialPost {
  url: string;
  platform: 'instagram' | 'tiktok' | 'twitter';
  thumbnail?: string;
  addedAt: number;
}

interface SocialPostManagerProps {
  initialPosts?: string[];
  onSave: (posts: string[]) => Promise<void>;
}

/**
 * Enhanced Social Post Manager
 * Supports Instagram, TikTok, Twitter with previews and analytics
 */
export function SocialPostManager({ initialPosts = [], onSave }: SocialPostManagerProps) {
  const [posts, setPosts] = useState<SocialPost[]>(
    initialPosts.map(url => ({
      url,
      platform: detectPlatform(url),
      addedAt: Date.now()
    }))
  );
  const [newPostUrl, setNewPostUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'instagram' | 'tiktok' | 'twitter'>('all');

  // Detect platform from URL
  function detectPlatform(url: string): 'instagram' | 'tiktok' | 'twitter' {
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    return 'instagram'; // default
  }

  // Validate URL based on platform
  const isValidUrl = (url: string): { valid: boolean; platform?: string; error?: string } => {
    const patterns = {
      instagram: /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?$/,
      tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
      twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]+\/status\/\d+/,
    };

    for (const [platform, pattern] of Object.entries(patterns)) {
      if (pattern.test(url)) {
        return { valid: true, platform };
      }
    }

    return { 
      valid: false, 
      error: 'Invalid URL. Supported: Instagram posts/reels, TikTok videos, Twitter/X tweets'
    };
  };

  // Get thumbnail URL (Instagram only for now)
  const getThumbnail = (post: SocialPost): string | null => {
    if (post.platform === 'instagram') {
      // Instagram's oembed API endpoint (publicly available)
      return `https://www.instagram.com/p/${post.url.split('/p/')[1]?.split('/')[0]}/media/?size=m`;
    }
    return null;
  };

  // Get platform emoji
  const getPlatformEmoji = (platform: string) => {
    switch (platform) {
      case 'instagram': return '📷';
      case 'tiktok': return '🎵';
      case 'twitter': return '𝕏';
      default: return '📱';
    }
  };

  // Get platform color
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'from-pink-500 to-purple-600';
      case 'tiktok': return 'from-black to-cyan-500';
      case 'twitter': return 'from-blue-400 to-blue-600';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const handleAddPost = () => {
    setError(null);
    
    if (!newPostUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    const validation = isValidUrl(newPostUrl);
    if (!validation.valid) {
      setError(validation.error || 'Invalid URL');
      return;
    }

    if (posts.length >= 10) {
      setError('Maximum 10 posts allowed');
      return;
    }

    if (posts.some(p => p.url === newPostUrl)) {
      setError('This post is already added');
      return;
    }

    const newPost: SocialPost = {
      url: newPostUrl,
      platform: detectPlatform(newPostUrl),
      addedAt: Date.now()
    };

    setPosts([...posts, newPost]);
    setNewPostUrl('');
    
    // Track analytics
    trackPostAdded(newPost.platform);
  };

  const handleRemovePost = (index: number) => {
    const removed = posts[index];
    setPosts(posts.filter((_, i) => i !== index));
    trackPostRemoved(removed.platform);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newPosts = [...posts];
    [newPosts[index - 1], newPosts[index]] = [newPosts[index], newPosts[index - 1]];
    setPosts(newPosts);
  };

  const handleMoveDown = (index: number) => {
    if (index === posts.length - 1) return;
    const newPosts = [...posts];
    [newPosts[index + 1], newPosts[index]] = [newPosts[index], newPosts[index + 1]];
    setPosts(newPosts);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const urls = posts.map(p => p.url);
      await onSave(urls);
      trackSave(posts.length);
    } catch (err) {
      setError('Failed to save posts. Please try again.');
      console.error('[SocialPostManager] Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // ANALYTICS: Track user actions
  const trackPostAdded = (platform: string) => {
    console.log('[Analytics] Post added:', platform);
    // Future: Send to analytics service
  };

  const trackPostRemoved = (platform: string) => {
    console.log('[Analytics] Post removed:', platform);
  };

  const trackSave = (count: number) => {
    console.log('[Analytics] Posts saved:', count);
  };

  // Filter posts by active tab
  const filteredPosts = activeTab === 'all' 
    ? posts 
    : posts.filter(p => p.platform === activeTab);

  // Platform counts
  const platformCounts = {
    instagram: posts.filter(p => p.platform === 'instagram').length,
    tiktok: posts.filter(p => p.platform === 'tiktok').length,
    twitter: posts.filter(p => p.platform === 'twitter').length,
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header with Stats */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Social Posts Carousel
            <span className="text-sm font-normal px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full">
              {posts.length}/10
            </span>
          </h2>
          <p className="text-gray-400">
            Showcase your best content from Instagram, TikTok, and Twitter/X in your matchmaking profile
          </p>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          All ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('instagram')}
          className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'instagram'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          📷 Instagram ({platformCounts.instagram})
        </button>
        <button
          onClick={() => setActiveTab('tiktok')}
          className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'tiktok'
              ? 'bg-gradient-to-r from-black to-cyan-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          🎵 TikTok ({platformCounts.tiktok})
        </button>
        <button
          onClick={() => setActiveTab('twitter')}
          className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'twitter'
              ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          𝕏 Twitter ({platformCounts.twitter})
        </button>
      </div>

      {/* Add Post Input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="url"
            value={newPostUrl}
            onChange={(e) => {
              setNewPostUrl(e.target.value);
              setError(null);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPost()}
            placeholder="Paste post URL (Instagram, TikTok, or Twitter/X)"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20"
          />
          <button
            onClick={handleAddPost}
            disabled={posts.length >= 10}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white font-medium hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          >
            Add
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </motion.div>
        )}

        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Swipe order: Video → Post 1 → Post 2 → ...
          </p>
          <p className="text-gray-400">
            {posts.length}/10 posts
          </p>
        </div>
      </div>

      {/* Post List with Previews */}
      <AnimatePresence mode="popLayout">
        {(activeTab === 'all' ? posts : filteredPosts).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(activeTab === 'all' ? posts : filteredPosts).map((post, displayIndex) => {
              // Get actual index in full posts array
              const actualIndex = posts.indexOf(post);
              const thumbnail = getThumbnail(post);

              return (
                <motion.div
                  key={post.url}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all"
                >
                  {/* Preview Thumbnail */}
                  {thumbnail && (
                    <div className="relative aspect-square bg-black/50 overflow-hidden">
                      <img
                        src={thumbnail}
                        alt={`${post.platform} post`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide image if failed to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {/* Platform badge */}
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-md bg-gradient-to-r ${getPlatformColor(post.platform)} text-white text-xs font-bold flex items-center gap-1`}>
                        {getPlatformEmoji(post.platform)}
                        {post.platform.toUpperCase()}
                      </div>
                      {/* Position badge */}
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm border-2 border-white/40">
                        {actualIndex + 1}
                      </div>
                    </div>
                  )}

                  {/* Post Info */}
                  <div className="p-4 space-y-3">
                    {/* URL */}
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-white/80 hover:text-pink-400 truncate transition-colors"
                    >
                      {post.url}
                    </a>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Reorder buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMoveUp(actualIndex)}
                          disabled={actualIndex === 0}
                          className="p-2 hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleMoveDown(actualIndex)}
                          disabled={actualIndex === posts.length - 1}
                          className="p-2 hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemovePost(actualIndex)}
                        className="p-2 hover:bg-red-500/20 rounded-md transition-colors group/remove"
                        title="Remove"
                      >
                        <svg className="w-5 h-5 text-red-400 group-hover/remove:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Hover overlay with preview button */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-all"
                    >
                      Preview on {post.platform === 'twitter' ? 'X' : post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-4"
          >
            <div className="text-6xl mb-4">
              {activeTab === 'instagram' && '📷'}
              {activeTab === 'tiktok' && '🎵'}
              {activeTab === 'twitter' && '𝕏'}
              {activeTab === 'all' && '🎬'}
            </div>
            <p className="text-gray-500 text-lg">
              {activeTab === 'all' 
                ? 'No posts yet. Add your first post above!'
                : `No ${activeTab} posts yet.`}
            </p>
            <p className="text-gray-600 text-sm">
              Posts will appear in your matchmaking carousel after your intro video
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform Support Info */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="text-center space-y-1">
          <div className="text-2xl">📷</div>
          <div className="text-white font-medium text-sm">Instagram</div>
          <div className="text-gray-500 text-xs">Posts & Reels</div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-2xl">🎵</div>
          <div className="text-white font-medium text-sm">TikTok</div>
          <div className="text-gray-500 text-xs">Videos</div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-2xl">𝕏</div>
          <div className="text-white font-medium text-sm">Twitter/X</div>
          <div className="text-gray-500 text-xs">Tweets</div>
        </div>
      </div>

      {/* Save Button with Analytics */}
      {posts.length > 0 && (
        <motion.button
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 transition-all relative overflow-hidden group"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Button text */}
          <span className="relative z-10">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              `Save ${posts.length} Post${posts.length === 1 ? '' : 's'} to Carousel`
            )}
          </span>
        </motion.button>
      )}

      {/* Helpful Tips */}
      {posts.length === 0 && (
        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl space-y-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to get post URLs:
          </h3>
          <ul className="text-gray-400 text-sm space-y-2 ml-7">
            <li>📷 <strong>Instagram</strong>: Open post → Click ⋯ → Copy link</li>
            <li>🎵 <strong>TikTok</strong>: Open video → Click Share → Copy link</li>
            <li>𝕏 <strong>Twitter/X</strong>: Open tweet → Click ⋯ → Copy link</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Helper function (in component for simplicity)
function detectPlatform(url: string): 'instagram' | 'tiktok' | 'twitter' {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  return 'instagram';
}

