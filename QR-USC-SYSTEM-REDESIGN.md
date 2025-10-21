# 🎓 QR + USC Verification System - Complete Redesign

**Date:** October 21, 2025  
**Goal:** Simplify to QR-only + USC email verification  
**Status:** Design Complete → Ready for Implementation

---

## 🎯 NEW SYSTEM DESIGN:

### **Single Entry Point: QR Code Only**

```
User scans QR code
   ↓
Redirected to: /onboarding?qr=[CODE]
   ↓
IF RETURNING USER:
  → Auto-login (detected by session/cookie)
  → Redirect to /main
   ↓
IF NEW USER:
  → Show onboarding form:
     - Name
     - Gender
     - USC Email (auto-verified)
     - Selfie + Video
   ↓
Backend validates:
  - QR code is valid
  - USC email ends with @usc.edu
  - Send verification code to email
   ↓
User enters 6-digit code
   ↓
Account created + Email verified
   ↓
Redirect to /main
```

###  **NO MORE:**
❌ Manual invite code entry  
❌ Separate "apply code" flow  
❌ Payment wall for students (USC only)  
❌ Complex code redemption logic

### **KEEP:**
✅ QR code generation for admin  
✅ QR code scanning  
✅ USC email verification  
✅ Automatic session detection  
✅ Clean, simple onboarding

---

## 🔧 IMPLEMENTATION CHANGES:

### **1. Remove Invite Code Manual Entry**

**Files to Modify:**
- `app/paywall/page.tsx` - REMOVE invite code input
- `server/src/payment.ts` - REMOVE `/payment/apply-code` endpoint
- `server/src/auth.ts` - Simplify guest signup (no inviteCode param needed)

**Keep:**
- QR code generation endpoint: `/payment/qr/:code`
- Admin QR management: `/admin/qr-codes`

---

### **2. Add USC Email Verification to Onboarding**

**New Flow in** `app/onboarding/page.tsx`:

```typescript
// Step 1: Check if QR code in URL
const qrCode = searchParams.get('qr');

if (!qrCode) {
  // No QR code = redirect to info page or error
  router.push('/access-denied');
  return;
}

// Step 2: Validate QR code with backend
const codeValid = await fetch(`/api/validate-qr?code=${qrCode}`);

// Step 3: Show form (name + gender + USC email)
<form>
  <input name="name" />
  <select name="gender" />
  <input type="email" name="email" placeholder="your@usc.edu" />
  <button>Send Verification Code</button>
</form>

// Step 4: Backend sends 6-digit code to USC email

// Step 5: User enters code
<input name="verificationCode" maxLength={6} />
<button>Verify & Create Account</button>

// Step 6: Backend creates account with email_verified=true
```

---

### **3. Backend API Changes**

**NEW Endpoint:** `POST /auth/qr-signup`

```typescript
router.post('/qr-signup', async (req, res) => {
  const { qrCode, name, gender, email, verificationCode } = req.body;
  
  // 1. Validate QR code exists and is active
  const code = await store.getInviteCode(qrCode);
  if (!code || !code.isActive) {
    return res.status(400).json({ error: 'Invalid QR code' });
  }
  
  // 2. Validate USC email
  if (!email.toLowerCase().endsWith('@usc.edu')) {
    return res.status(403).json({ error: 'USC email required' });
  }
  
  // 3. Verify email code
  const verified = await store.verifyEmailCode(email, verificationCode);
  if (!verified) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }
  
  // 4. Create user
  const userId = uuidv4();
  const sessionToken = uuidv4();
  
  await store.createUser({
    userId,
    name,
    gender,
    email,
    email_verified: true,
    qr_code_used: qrCode,
    account_type: 'verified_usc',
    created_at: Date.now(),
  });
  
  // 5. Mark QR code as used (track usage)
  await store.useInviteCode(qrCode, userId, name);
  
  // 6. Create session
  await store.createSession(sessionToken, userId);
  
  res.json({ sessionToken, userId });
});
```

**REMOVE Endpoint:** `POST /payment/apply-code` (no longer needed)

---

### **4. Improve Queue Detection System**

**Current Issues:**
- Race conditions (user might not be online when joining queue)
- No heartbeat to detect disconnections
- Stale presence data

**NEW System:**

```typescript
// server/src/presence-manager.ts (NEW FILE)

class ImprovedPresenceManager {
  private presence = new Map<string, Presence>();
  private heartbeats = new Map<string, number>(); // userId -> last heartbeat timestamp
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly STALE_THRESHOLD = 60000; // 60 seconds = stale
  
  // Start heartbeat checker
  startHeartbeatChecker() {
    setInterval(() => {
      const now = Date.now();
      
      for (const [userId, lastBeat] of this.heartbeats) {
        if (now - lastBeat > this.STALE_THRESHOLD) {
          console.warn(`[Presence] User ${userId} is stale, marking offline`);
          this.markOffline(userId);
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }
  
  // User connects
  markOnline(userId: string, socketId: string) {
    this.presence.set(userId, {
      socketId,
      online: true,
      available: false,
      lastActiveAt: Date.now(),
    });
    
    this.heartbeats.set(userId, Date.now());
    console.log(`[Presence] ${userId} marked online`);
  }
  
  // User joins queue
  markAvailable(userId: string) {
    const presence = this.presence.get(userId);
    if (!presence) {
      console.error(`[Presence] Cannot mark available - user ${userId} not online`);
      return false;
    }
    
    presence.available = true;
    presence.lastActiveAt = Date.now();
    this.presence.set(userId, presence);
    this.heartbeats.set(userId, Date.now());
    
    console.log(`[Presence] ${userId} marked available`);
    return true;
  }
  
  // Heartbeat received
  updateHeartbeat(userId: string) {
    this.heartbeats.set(userId, Date.now());
  }
  
  // Get all available users (with staleness check)
  getAllAvailable(excludeUserId?: string): string[] {
    const now = Date.now();
    const available: string[] = [];
    
    for (const [userId, presence] of this.presence) {
      // Skip excluded user
      if (userId === excludeUserId) continue;
      
      // Skip if not online or available
      if (!presence.online || !presence.available) continue;
      
      // Skip if stale (no heartbeat in 60s)
      const lastBeat = this.heartbeats.get(userId) || 0;
      if (now - lastBeat > this.STALE_THRESHOLD) {
        console.warn(`[Presence] Skipping stale user ${userId}`);
        continue;
      }
      
      available.push(userId);
    }
    
    return available;
  }
  
  // User disconnects
  markOffline(userId: string) {
    const presence = this.presence.get(userId);
    if (presence) {
      presence.online = false;
      presence.available = false;
      this.presence.set(userId, presence);
    }
    
    this.heartbeats.delete(userId);
    console.log(`[Presence] ${userId} marked offline`);
  }
}

export const presenceManager = new ImprovedPresenceManager();
```

**Frontend Changes:**

```typescript
// lib/socket.ts - Add heartbeat

useEffect(() => {
  if (!socket) return;
  
  // Send heartbeat every 25 seconds
  const interval = setInterval(() => {
    socket.emit('heartbeat');
  }, 25000);
  
  return () => clearInterval(interval);
}, [socket]);
```

**Backend Changes:**

```typescript
// server/src/index.ts

socket.on('heartbeat', () => {
  if (currentUserId) {
    presenceManager.updateHeartbeat(currentUserId);
  }
});
```

---

## 📊 DATABASE CHANGES:

```sql
-- Add account_type for USC students
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'guest';

-- Values: 'guest', 'verified_usc', 'paid', 'admin'

-- Add QR code tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS qr_code_used VARCHAR(16);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_qr_code ON users(qr_code_used);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
```

---

## 🎯 USER FLOW COMPARISON:

### **OLD (Complex):**
```
1. User visits site
2. Signup → Redirect to paywall
3. Option A: Pay $0.01
4. Option B: Enter invite code manually
5. If code valid → Access granted
6. If admin code → Must enter USC email separately
7. Email verification separate step
```

### **NEW (Simple):**
```
1. User scans QR code
2. Opens directly to onboarding
3. Enter: Name, Gender, USC Email
4. Receive 6-digit code via email
5. Enter code → Account created
6. Done!
```

**Benefits:**
- ✅ 50% fewer steps
- ✅ No payment confusion
- ✅ USC verification built-in
- ✅ Can't bypass QR requirement
- ✅ Automatic returning user detection
- ✅ Cleaner, more professional

---

## 🔒 SECURITY IMPROVEMENTS:

### **1. QR Code Validation:**
```typescript
// Before allowing signup, verify:
- QR code exists in database
- QR code is active (not deactivated)
- QR code hasn't expired (if time-limited)
- QR code belongs to USC (admin code)
```

### **2. USC Email Enforcement:**
```typescript
// STRICT validation:
- Must end with @usc.edu (lowercase check)
- Must be valid email format
- Must receive verification code
- Must enter correct code within 10 minutes
- Max 3 attempts per hour
```

### **3. Duplicate Prevention:**
```typescript
// Check if USC email already used:
const existingUser = await db.query(
  'SELECT user_id FROM users WHERE email = $1',
  [email.toLowerCase()]
);

if (existingUser.rows.length > 0) {
  return res.status(409).json({ 
    error: 'This USC email is already registered. Please login instead.' 
  });
}
```

---

## 🚀 IMPLEMENTATION PRIORITY:

### **Phase 1: Remove Invite Code Entry (1 hour)**
- [ ] Remove input fields from paywall
- [ ] Remove `/payment/apply-code` endpoint
- [ ] Update auth flow to QR-only
- [ ] Test QR scanning works

### **Phase 2: Add USC Verification to Onboarding (2 hours)**
- [ ] Add email input to onboarding form
- [ ] Create `/auth/qr-signup` endpoint
- [ ] Integrate with existing email verification system
- [ ] Test full signup flow

### **Phase 3: Improve Queue Detection (2 hours)**
- [ ] Create `presence-manager.ts` with heartbeat system
- [ ] Add heartbeat emit on frontend
- [ ] Add heartbeat listener on backend
- [ ] Add stale user detection
- [ ] Test queue shows only active users

### **Phase 4: Database Migration (30 min)**
- [ ] Add `account_type` column
- [ ] Add `qr_code_used` column
- [ ] Add indexes
- [ ] Migrate existing users

### **Total Estimated Time:** 5-6 hours

---

## ✅ TESTING CHECKLIST:

After implementation, test:

- [ ] Scan QR code → Opens onboarding
- [ ] Enter non-USC email → Rejected
- [ ] Enter USC email → Verification code sent
- [ ] Enter wrong code → Error shown
- [ ] Enter correct code → Account created
- [ ] Login with existing account → Auto-detected
- [ ] Join queue → Shows as available immediately
- [ ] Close tab → Marked offline within 60s
- [ ] Rejoin queue → Shows as available again
- [ ] Multiple users → All show correctly in queue

---

## 📝 FILES TO MODIFY:

### Frontend:
1. `app/onboarding/page.tsx` - Add USC email verification
2. `app/paywall/page.tsx` - Remove invite code input (or delete file)
3. `lib/socket.ts` - Add heartbeat system
4. `components/EmailVerification.tsx` - Integrate into onboarding

### Backend:
1. `server/src/auth.ts` - Create `/qr-signup` endpoint
2. `server/src/payment.ts` - Remove `/apply-code` endpoint
3. `server/src/presence-manager.ts` - NEW FILE for improved presence
4. `server/src/index.ts` - Integrate presence manager
5. `server/src/store.ts` - Add heartbeat tracking

### Database:
1. `migrations/add-usc-account-type.sql` - NEW FILE for schema changes

---

## 🎓 WHY THIS IS BETTER:

**For USC Students:**
- No payment barrier
- Automatic USC verification
- One simple flow
- Professional experience

**For Admins:**
- Easy QR code generation
- Track usage per code
- USC-only access enforced
- No manual code sharing

**For Developers:**
- Simpler codebase
- Fewer edge cases
- Better security
- Easier to maintain

**For System:**
- More reliable queue detection
- No stale user data
- Automatic cleanup
- Real-time accuracy

---

**Ready to implement?** Let me know and I'll start with Phase 1!

