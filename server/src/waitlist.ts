import express from 'express';
import { query } from './database';

const router = express.Router();

// Rate limiting for waitlist submissions
const waitlistAttempts = new Map<string, number[]>();

function checkWaitlistRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = waitlistAttempts.get(ip) || [];
  
  // Remove attempts older than 1 hour
  const recentAttempts = attempts.filter(time => now - time < 3600000);
  
  // Max 3 submissions per hour per IP
  if (recentAttempts.length >= 3) {
    return false;
  }
  
  recentAttempts.push(now);
  waitlistAttempts.set(ip, recentAttempts);
  return true;
}

router.post('/submit', async (req: any, res) => {
  const { name, state, school, email } = req.body;
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  
  console.log('[Waitlist] Submission from IP:', ip);
  
  // Validation
  if (!name || !state || !school || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Rate limiting
  if (!checkWaitlistRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many submissions. Please try again in 1 hour.' });
  }
  
  try {
    // SECURITY: Check if email already exists in users table
    const existingUser = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'This email already has an account',
        hint: 'Try logging in instead.'
      });
    }
    
    // Check if email already on waitlist
    const existingWaitlist = await query(
      'SELECT email FROM waitlist WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingWaitlist.rows.length > 0) {
      return res.status(400).json({ error: 'This email is already on the waitlist' });
    }
    
    // Insert into waitlist
    await query(
      `INSERT INTO waitlist (name, email, state, school, ip_address, submitted_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [name.trim(), email.toLowerCase(), state, school.trim(), ip]
    );
    
    console.log(`[Waitlist] ✅ New submission: ${name} (${email}) from ${state}`);
    
    res.json({ success: true, message: 'Successfully joined waitlist' });
  } catch (error: any) {
    console.error('[Waitlist] Submission failed:', error);
    
    // Handle specific errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'This email is already on the waitlist' });
    }
    
    res.status(500).json({ error: 'Failed to join waitlist. Please try again.' });
  }
});

export default router;

