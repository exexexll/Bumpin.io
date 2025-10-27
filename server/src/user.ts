import express from 'express';
import { store } from './store';

const router = express.Router();

/**
 * Middleware to verify session token
 */
async function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const session = await store.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // SECURITY: Check if session is still active (not invalidated by new login)
  const isActive = await store.isSessionActive(token);
  if (!isActive) {
    return res.status(401).json({ 
      error: 'Session invalidated',
      message: 'You have been logged out. Please login again.',
      sessionInvalidated: true
    });
  }

  req.userId = session.userId;
  next();
}

/**
 * GET /user/me
 * Get current user profile with metrics
 */
router.get('/me', requireAuth, async (req: any, res) => {
  const user = await store.getUser(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    userId: user.userId,
    name: user.name,
    gender: user.gender,
    accountType: user.accountType,
    email: user.email,
    selfieUrl: user.selfieUrl,
    videoUrl: user.videoUrl,
    socials: user.socials,
    instagramPosts: user.instagramPosts || [], // CRITICAL: Return Instagram posts for carousel
    createdAt: user.createdAt,
    timerTotalSeconds: user.timerTotalSeconds || 0,
    sessionCount: user.sessionCount || 0,
    lastSessions: user.lastSessions || [],
    streakDays: user.streakDays || null,
  });
});

/**
 * PUT /user/me
 * Update user profile (partial updates)
 * Supports: socials object
 */
router.put('/me', requireAuth, async (req: any, res) => {
  const { socials } = req.body;

  if (socials) {
    // Store socials in user object
    // In production: validate and sanitize
    await store.updateUser(req.userId, { socials });
  }

  const user = await store.getUser(req.userId);

  res.json({
    success: true,
    user: {
      userId: user?.userId,
      name: user?.name,
      socials: user?.socials,
    },
  });
});

export default router;

