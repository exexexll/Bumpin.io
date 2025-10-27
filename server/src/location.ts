import express from 'express';
import { query } from './database';
import { store } from './store';

const router = express.Router();

// SECURITY: Rate limiting for location updates
const locationUpdateLimits = new Map<string, number>(); // userId -> lastUpdate timestamp

// Haversine formula for distance calculation (meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

/**
 * Middleware: Require authentication
 */
async function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authorization required' });
  
  const session = await store.getSession(token);
  if (!session) return res.status(401).json({ error: 'Invalid session' });
  
  req.userId = session.userId;
  next();
}

/**
 * POST /location/update
 * Update user's current location (opt-in, 24-hour expiry)
 */
router.post('/update', requireAuth, async (req: any, res) => {
  const { latitude, longitude, accuracy } = req.body;
  
  // SECURITY: Rate limiting - max 1 update per minute
  const lastUpdate = locationUpdateLimits.get(req.userId) || 0;
  const timeSinceLastUpdate = Date.now() - lastUpdate;
  if (timeSinceLastUpdate < 60000) {
    const waitSeconds = Math.ceil((60000 - timeSinceLastUpdate) / 1000);
    return res.status(429).json({ 
      error: `Location update too frequent. Wait ${waitSeconds}s.`,
      retryAfter: waitSeconds
    });
  }
  
  // Validate coordinates
  if (!latitude || !longitude ||
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }
  
  // SECURITY: Validate accuracy field
  if (accuracy !== undefined && accuracy !== null) {
    if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 50000) {
      return res.status(400).json({ error: 'Invalid accuracy value' });
    }
  }
  
  // Round to ~100m precision (privacy: prevents exact location)
  const roundedLat = Math.round(latitude * 1000) / 1000;
  const roundedLon = Math.round(longitude * 1000) / 1000;
  
  try {
    // SECURITY: Basic spoofing detection - check previous location
    const prevResult = await query(
      'SELECT latitude, longitude, updated_at FROM user_locations WHERE user_id = $1',
      [req.userId]
    );
    
    if (prevResult.rows.length > 0) {
      const prev = prevResult.rows[0];
      const distance = calculateDistance(
        prev.latitude, prev.longitude,
        roundedLat, roundedLon
      );
      const timeDiff = Date.now() - new Date(prev.updated_at).getTime();
      const speedMps = distance / (timeDiff / 1000); // meters per second
      
      // Human max realistic speed: ~100 m/s (very fast car on highway)
      // Airplane: ~250 m/s (but users shouldn't be on planes constantly)
      if (speedMps > 250 && timeDiff < 60000) {
        console.warn(`[Location] ⚠️ SUSPICIOUS: User ${req.userId.substring(0, 8)} moved ${Math.round(distance)}m in ${Math.round(timeDiff/1000)}s (${Math.round(speedMps)} m/s)`);
        // Log but still allow (could be legitimate travel)
        // In future: Flag for review or temporary disable location
      }
    }
    
    // Store location (upsert pattern)
    await query(`
      INSERT INTO user_locations (user_id, latitude, longitude, accuracy)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        latitude = $2,
        longitude = $3,
        accuracy = $4,
        updated_at = NOW(),
        expires_at = NOW() + INTERVAL '24 hours'
    `, [req.userId, roundedLat, roundedLon, accuracy || null]);
    
    // Update user's consent flag and timestamp
    await query(`
      UPDATE users 
      SET location_consent = TRUE,
          location_last_shared = NOW()
      WHERE user_id = $1
    `, [req.userId]);
    
    // Update rate limit tracker
    locationUpdateLimits.set(req.userId, Date.now());
    
    console.log(`[Location] ✅ Updated for user ${req.userId.substring(0, 8)}: ${roundedLat}, ${roundedLon}`);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Location] Update failed:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

/**
 * DELETE /location/clear
 * Clear user's location (opt-out)
 */
router.delete('/clear', requireAuth, async (req: any, res) => {
  try {
    await query('DELETE FROM user_locations WHERE user_id = $1', [req.userId]);
    
    await query(`
      UPDATE users 
      SET location_consent = FALSE,
          location_last_shared = NULL
      WHERE user_id = $1
    `, [req.userId]);
    
    console.log(`[Location] Cleared for user ${req.userId.substring(0, 8)}`);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Location] Clear failed:', error);
    res.status(500).json({ error: 'Failed to clear location' });
  }
});

/**
 * GET /location/status
 * Check if user has active location sharing
 */
router.get('/status', requireAuth, async (req: any, res) => {
  try {
    const result = await query(`
      SELECT 
        CASE WHEN expires_at > NOW() THEN TRUE ELSE FALSE END as active,
        updated_at
      FROM user_locations 
      WHERE user_id = $1
    `, [req.userId]);
    
    const active = result.rows.length > 0 && result.rows[0].active;
    const updatedAt = result.rows.length > 0 ? result.rows[0].updated_at : null;
    
    res.json({ 
      active,
      updatedAt,
      expiresIn: active ? 24 * 3600000 - (Date.now() - new Date(updatedAt).getTime()) : 0
    });
  } catch (error: any) {
    console.error('[Location] Status check failed:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// SECURITY: Auto-cleanup expired locations (runs every hour)
setInterval(async () => {
  try {
    const result = await query('DELETE FROM user_locations WHERE expires_at < NOW()');
    if (result.rowCount && result.rowCount > 0) {
      console.log(`[Location] 🧹 Auto-cleanup: Deleted ${result.rowCount} expired locations`);
    }
  } catch (error) {
    console.error('[Location] Auto-cleanup failed:', error);
  }
}, 3600000); // Every hour

console.log('[Location] Auto-cleanup job started (runs hourly)');

export default router;

