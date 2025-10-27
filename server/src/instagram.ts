import { Router } from 'express';
import { store } from './store';

const router = Router();

// Auth middleware (consistent with other route files)
async function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authorization required' });
  
  const session = await store.getSession(token);
  if (!session) return res.status(401).json({ error: 'Invalid session' });
  
  req.userId = session.userId;
  next();
}

/**
 * GET /instagram/posts
 * Get user's Instagram posts
 */
router.get('/posts', requireAuth, async (req: any, res) => {
  try {
    const user = await store.getUser(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      posts: user.instagramPosts || []
    });
  } catch (error) {
    console.error('[Instagram API] Error getting posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /instagram/posts
 * Save user's Instagram posts (replace all)
 */
router.post('/posts', requireAuth, async (req: any, res) => {
  try {
    const { posts } = req.body;

    // Validate posts
    if (!Array.isArray(posts)) {
      return res.status(400).json({ error: 'Posts must be an array' });
    }

    if (posts.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 posts allowed' });
    }

    // Validate each post URL
    const urlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?$/;
    for (const post of posts) {
      if (typeof post !== 'string' || !urlPattern.test(post)) {
        return res.status(400).json({ 
          error: 'Invalid Instagram URL. Must be a post or reel URL like: https://www.instagram.com/p/ABC123/'
        });
      }
    }

    // Update user's posts
    await store.updateUser(req.userId, {
      instagramPosts: posts
    });

    console.log(`[Instagram API] ✅ Updated posts for user ${req.userId}: ${posts.length} posts`);

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('[Instagram API] Error saving posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

