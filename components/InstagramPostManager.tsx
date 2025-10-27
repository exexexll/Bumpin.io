'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InstagramPostManagerProps {
  initialPosts?: string[];
  onSave: (posts: string[]) => Promise<void>;
}

/**
 * Instagram Post Manager
 * Allows users to add/remove/reorder Instagram post URLs
 * These posts will be shown in the matchmaking carousel
 */
export function InstagramPostManager({ initialPosts = [], onSave }: InstagramPostManagerProps) {
  const [posts, setPosts] = useState<string[]>(initialPosts);
  const [newPostUrl, setNewPostUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidInstagramUrl = (url: string): boolean => {
    // Validate Instagram post URL format
    const patterns = [
      /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/,
      /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/,
    ];
    
    return patterns.some(pattern => pattern.test(url));
  };

  const handleAddPost = () => {
    setError(null);
    
    if (!newPostUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidInstagramUrl(newPostUrl)) {
      setError('Invalid Instagram URL. Must be a post or reel URL like: https://www.instagram.com/p/ABC123/');
      return;
    }

    if (posts.length >= 10) {
      setError('Maximum 10 posts allowed');
      return;
    }

    if (posts.includes(newPostUrl)) {
      setError('This post is already added');
      return;
    }

    setPosts([...posts, newPostUrl]);
    setNewPostUrl('');
  };

  const handleRemovePost = (index: number) => {
    setPosts(posts.filter((_, i) => i !== index));
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
      await onSave(posts);
    } catch (err) {
      setError('Failed to save posts. Please try again.');
      console.error('[InstagramPostManager] Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Instagram Posts</h2>
        <p className="text-gray-400">
          Add Instagram posts to your profile. They'll appear in your matchmaking carousel after your intro video.
        </p>
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
            placeholder="Paste Instagram post URL (e.g., https://www.instagram.com/p/ABC123/)"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/40"
          />
          <button
            onClick={handleAddPost}
            disabled={posts.length >= 10}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white font-medium hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Add
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <p className="text-sm text-gray-500">
          {posts.length}/10 posts • Swipe order: Video → Post 1 → Post 2 → ...
        </p>
      </div>

      {/* Post List */}
      <AnimatePresence mode="popLayout">
        {posts.length > 0 ? (
          <div className="space-y-2">
            {posts.map((postUrl, index) => (
              <motion.div
                key={postUrl}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
              >
                {/* Post Number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>

                {/* URL */}
                <div className="flex-1 min-w-0">
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-pink-400 truncate block transition-colors"
                  >
                    {postUrl}
                  </a>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-2 hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === posts.length - 1}
                    className="p-2 hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleRemovePost(index)}
                    className="p-2 hover:bg-red-500/20 rounded-md transition-colors"
                    title="Remove"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No Instagram posts yet. Add your first post above!
          </div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      {posts.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white font-bold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all"
        >
          {saving ? 'Saving...' : 'Save Posts'}
        </button>
      )}
    </div>
  );
}

