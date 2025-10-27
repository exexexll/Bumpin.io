import express from 'express';
import { store } from './store';
import { sendVerificationEmail } from './email';

const router = express.Router();

async function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authorization required' });
  
  const session = await store.getSession(token);
  if (!session) return res.status(401).json({ error: 'Invalid session' });
  
  req.userId = session.userId;
  next();
}

router.post('/send', requireAuth, async (req: any, res) => {
  const { email } = req.body;
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  const user = await store.getUser(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Reset attempts if last code expired over 1 hour ago
  const shouldReset = user.verification_code_expires_at && 
                     (Date.now() - user.verification_code_expires_at) > 3600000;
  
  const currentAttempts = shouldReset ? 0 : (user.verification_attempts || 0);
  
  if (currentAttempts >= 3) {
    return res.status(429).json({ error: 'Too many attempts. Wait 1 hour.' });
  }
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + (10 * 60 * 1000);
  
  await store.updateUser(req.userId, {
    email,
    verification_code: code,
    verification_code_expires_at: expiresAt,
    verification_attempts: currentAttempts + 1,
  });
  
  const sent = await sendVerificationEmail(email, code, user.name);
  if (!sent) {
    return res.status(500).json({ error: 'Failed to send email' });
  }
  
  res.json({ success: true, expiresAt });
});

router.post('/verify', requireAuth, async (req: any, res) => {
  const { code } = req.body;
  
  const user = await store.getUser(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  if (user.verification_code !== code) {
    return res.status(400).json({ error: 'Invalid code' });
  }
  
  if (!user.verification_code_expires_at || Date.now() > user.verification_code_expires_at) {
    return res.status(400).json({ error: 'Code expired' });
  }
  
  await store.updateUser(req.userId, {
    email_verified: true,
    accountType: 'permanent', // CRITICAL: Upgrade from guest to permanent
    verification_code: null,
    verification_code_expires_at: null,
    verification_attempts: 0,
  });
  
  console.log(`[Verification] ✅ Email verified - upgraded user ${user.userId.substring(0, 8)} to permanent account`);
  
  res.json({ success: true, accountType: 'permanent' });
});

export default router;

