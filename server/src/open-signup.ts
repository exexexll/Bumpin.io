import express from 'express';
import { query } from './database';
import { requireAdmin } from './admin-auth';

const router = express.Router();

// Cache the setting in memory (refreshes on server restart)
let openSignupEnabled = false;

// Load setting from database on startup
(async () => {
  try {
    const result = await query('SELECT enabled FROM open_signup_settings WHERE id = 1');
    if (result.rows.length > 0) {
      openSignupEnabled = result.rows[0].enabled;
      console.log(`[OpenSignup] Loaded from database: ${openSignupEnabled ? 'ENABLED' : 'DISABLED'}`);
    }
  } catch (error) {
    console.error('[OpenSignup] Failed to load setting:', error);
  }
})();

/**
 * GET /open-signup/status
 * Check if open signup is enabled (public endpoint)
 */
router.get('/status', async (req, res) => {
  try {
    // Always fetch fresh from database for accuracy
    const result = await query('SELECT enabled FROM open_signup_settings WHERE id = 1');
    const enabled = result.rows.length > 0 ? result.rows[0].enabled : false;
    
    res.json({ enabled });
  } catch (error) {
    console.error('[OpenSignup] Status check failed:', error);
    res.json({ enabled: false }); // Default to closed on error
  }
});

/**
 * POST /open-signup/toggle
 * Toggle open signup on/off (admin only)
 */
router.post('/toggle', requireAdmin, async (req, res) => {
  const { enabled } = req.body;
  
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled must be boolean' });
  }
  
  try {
    await query(
      'UPDATE open_signup_settings SET enabled = $1, updated_at = NOW(), updated_by = $2 WHERE id = 1',
      [enabled, req.adminUser || 'admin']
    );
    
    // Update memory cache
    openSignupEnabled = enabled;
    
    console.log(`[OpenSignup] Toggled to: ${enabled ? 'ENABLED' : 'DISABLED'} by ${req.adminUser}`);
    
    res.json({ enabled, message: `Open signup ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error('[OpenSignup] Toggle failed:', error);
    res.status(500).json({ error: 'Failed to toggle setting' });
  }
});

// Export helper function
export function isOpenSignupEnabled(): boolean {
  return openSignupEnabled;
}

export default router;

