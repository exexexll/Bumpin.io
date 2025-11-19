/**
 * Paywall Guard Middleware
 * Ensures users have either paid or used a valid invite code
 * Applied to all protected routes
 */

import { store } from './store';

export async function requirePayment(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const session = await store.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const user = await store.getUser(session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if user has verified access
  // Grace period users ('qr_grace_period') and open_signup users also have full access
  const hasAccess = user.paidStatus === 'paid' || 
                     user.paidStatus === 'qr_verified' || 
                     user.paidStatus === 'qr_grace_period' ||
                     user.paidStatus === 'open_signup';
  
  if (!hasAccess) {
    console.warn(`[Paywall] 🚫 Unpaid user ${user.name} attempted to access protected route`);
    return res.status(402).json({ 
      error: 'Payment required',
      message: 'Please complete payment or use an invite code to access this feature',
      requiresPayment: true,
    });
  }

  // User has access, continue
  req.userId = session.userId;
  next();
}

