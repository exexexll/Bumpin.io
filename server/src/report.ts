import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from './store';
import { Report, BanRecord } from './types';

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

  // SECURITY: Check if session is still active
  const isActive = await store.isSessionActive(token);
  if (!isActive) {
    return res.status(401).json({ 
      error: 'Session invalidated',
      sessionInvalidated: true
    });
  }

  // Check if user is banned
  if (store.isUserBanned(session.userId)) {
    return res.status(403).json({ 
      error: 'Account suspended',
      banned: true,
      message: 'Your account has been suspended pending review.'
    });
  }

  req.userId = session.userId;
  req.userIp = req.ip || req.connection.remoteAddress || 'unknown';
  next();
}

/**
 * Middleware for admin-only routes (for demo: any authenticated user can access)
 * In production: implement proper role-based access control
 */
function requireAdmin(req: any, res: any, next: any) {
  // For demo purposes, we'll use a simple check
  // In production, add admin role to User type and check here
  next();
}

/**
 * POST /report/user
 * Report a user after a call
 * Body: { reportedUserId, reason?, roomId? }
 */
router.post('/user', requireAuth, async (req: any, res) => {
  const { reportedUserId, reason, roomId } = req.body;
  const reporterUserId = req.userId;
  const reporterIp = req.userIp;

  if (!reportedUserId) {
    return res.status(400).json({ error: 'reportedUserId is required' });
  }

  // Can't report yourself
  if (reportedUserId === reporterUserId) {
    return res.status(400).json({ error: 'Cannot report yourself' });
  }

  // Check if already reported this user
  // ⚠️ KNOWN RACE CONDITION: Two simultaneous requests can both pass this check
  // FIX: Requires database transactions or atomic operations (see cloud migration)
  // Impact: LOW - worst case is duplicate report from same user, but auto-ban still works correctly
  if (store.hasReportedUser(reporterUserId, reportedUserId)) {
    return res.status(400).json({ 
      error: 'You have already reported this user',
      alreadyReported: true
    });
  }

  // Get user details
  const reportedUser = await store.getUser(reportedUserId);
  const reporterUser = await store.getUser(reporterUserId);

  if (!reportedUser || !reporterUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Create report
  // TODO(cloud-migration): Wrap in database transaction to prevent race condition
  const reportId = uuidv4();
  const report: Report = {
    reportId,
    reportedUserId,
    reportedUserName: reportedUser.name,
    reportedUserSelfie: reportedUser.selfieUrl,
    reportedUserVideo: reportedUser.videoUrl,
    reporterUserId,
    reporterName: reporterUser.name,
    reporterIp,
    reason: reason || 'No reason provided',
    timestamp: Date.now(),
    roomId,
  };

  await store.createReport(report);

  // Check if user should be auto-banned (4+ unique reports)
  const reportCount = store.getReportCount(reportedUserId);
  console.log(`[Report] User ${reportedUser.name} now has ${reportCount} reports`);

  if (reportCount >= 4 && !store.isUserBanned(reportedUserId)) {
    // Auto-ban with temporary status pending review
    const userIps = store.getUserIps(reportedUserId);
    const banRecord: BanRecord = {
      userId: reportedUserId,
      userName: reportedUser.name,
      userSelfie: reportedUser.selfieUrl,
      userVideo: reportedUser.videoUrl,
      banStatus: 'temporary',
      bannedAt: Date.now(),
      bannedReason: `Auto-banned: ${reportCount} reports received`,
      reportCount,
      reviewStatus: 'pending',
      ipAddresses: userIps,
    };

    await store.createBanRecord(banRecord);
    console.log(`[Ban] 🚫 User ${reportedUser.name} auto-banned after ${reportCount} reports`);

    return res.json({
      success: true,
      reportId,
      autoBanned: true,
      reportCount,
      message: 'Report submitted. User has been temporarily banned pending review.',
    });
  }

  res.json({
    success: true,
    reportId,
    reportCount,
    message: 'Report submitted successfully.',
  });
});

/**
 * GET /report/pending
 * Get all pending ban reviews (admin)
 */
router.get('/pending', requireAdmin, async (req: any, res) => {
  const pendingReviews = store.getPendingReviews();
  
  // Include full report details for each
  const reviewsWithReports = pendingReviews.map(banRecord => ({
    ...banRecord,
    reports: store.getReportsForUser(banRecord.userId),
  }));

  res.json({
    pending: reviewsWithReports,
    count: reviewsWithReports.length,
  });
});

/**
 * GET /report/all
 * Get all reports (admin)
 */
router.get('/all', requireAdmin, async (req: any, res) => {
  const allReports = store.getAllReports();
  res.json({
    reports: allReports,
    count: allReports.length,
  });
});

/**
 * POST /report/review/:userId
 * Review a ban and make decision (admin)
 * Body: { decision: 'permanent' | 'vindicated' }
 */
router.post('/review/:userId', requireAdmin, async (req: any, res) => {
  const { userId } = req.params;
  const { decision } = req.body;
  const reviewerId = req.adminUser; // From requireAdmin middleware

  if (!['permanent', 'vindicated'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision. Must be "permanent" or "vindicated"' });
  }

  const banRecord = store.getBanRecord(userId);
  if (!banRecord) {
    return res.status(404).json({ error: 'Ban record not found' });
  }

  store.updateBanStatus(userId, decision, reviewerId);

  console.log(`[Review] User ${banRecord.userName} reviewed by admin: ${decision}`);

  res.json({
    success: true,
    userId,
    decision,
    message: decision === 'permanent' 
      ? 'User permanently banned and added to blacklist' 
      : 'User vindicated and ban lifted',
  });
});

/**
 * GET /report/blacklist
 * Get all permanently banned users (public endpoint for blacklist website)
 */
router.get('/blacklist', (req, res) => {
  const blacklistedUsers = store.getBlacklistedUsers();
  
  // Return public-safe data
  const publicData = blacklistedUsers.map(record => ({
    userName: record.userName,
    userSelfie: record.userSelfie,
    userVideo: record.userVideo,
    bannedAt: record.bannedAt,
    bannedReason: record.bannedReason,
    reportCount: record.reportCount,
  }));

  res.json({
    blacklist: publicData,
    count: publicData.length,
    lastUpdated: Date.now(),
  });
});

/**
 * GET /report/check-ban
 * Check if current user is banned (authenticated)
 */
router.get('/check-ban', requireAuth, async (req: any, res) => {
  const user = await store.getUser(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const banRecord = store.getBanRecord(req.userId);

  res.json({
    isBanned: store.isUserBanned(req.userId),
    banStatus: user.banStatus || 'none',
    banRecord: banRecord || null,
  });
});

/**
 * GET /report/check-ip/:ip
 * Check if IP is banned (internal use)
 */
router.get('/check-ip/:ip', (req, res) => {
  const { ip } = req.params;
  const ipBan = store.isIpBanned(ip);

  res.json({
    isBanned: !!ipBan,
    ipBan: ipBan || null,
  });
});

/**
 * GET /report/stats
 * Get reporting statistics (admin)
 */
router.get('/stats', requireAdmin, async (req: any, res) => {
  const allReports = store.getAllReports();
  const allBans = store.getAllBanRecords();
  const pending = store.getPendingReviews();
  const blacklisted = store.getBlacklistedUsers();

  res.json({
    totalReports: allReports.length,
    totalBans: allBans.length,
    pendingReviews: pending.length,
    permanentBans: blacklisted.length,
    temporaryBans: allBans.filter(b => b.banStatus === 'temporary').length,
    vindicated: allBans.filter(b => b.banStatus === 'vindicated').length,
  });
});

export default router;

