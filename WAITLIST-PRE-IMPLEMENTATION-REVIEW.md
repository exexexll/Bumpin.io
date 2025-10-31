WAITLIST PRE-IMPLEMENTATION REVIEW - VERIFY BEFORE COMMIT
==========================================================

## PHASE 1: CODE CHANGE MAPPING

### NEW FILES TO CREATE (3)

#### File 1: app/waitlist/page.tsx
Purpose: Collect waitlist submissions
Lines: ~200
Dependencies: Container, API_BASE
State: name, email, state, school, submitted, loading, error
Functions: handleSubmit
API Calls: POST /waitlist/submit
Validation: All fields required, email format
Security: Rate limiting on backend, unique email

POTENTIAL ISSUES:
- ❓ What if US_STATES list is incomplete?
- ❓ What if email already exists in users table (not waitlist)?
- ❓ Should we check if user already has account?

FIX BEFORE IMPLEMENTING:
✅ Add all 51 states
✅ Check both users AND waitlist tables
✅ Add "Already have account? Login" link

---

#### File 2: app/check-access/page.tsx
Purpose: Route users to onboarding or waitlist
Lines: ~40
Dependencies: useRouter, useSearchParams
Logic: If inviteCode in URL → onboarding, else → waitlist

POTENTIAL ISSUES:
- ❓ What if inviteCode is invalid format?
- ❓ What if user has existing session?
- ❓ Race condition between redirect and render?

FIX BEFORE IMPLEMENTING:
✅ Validate inviteCode format (16 chars, A-Z0-9)
✅ Check existing session first
✅ Add loading state to prevent flicker

---

#### File 3: server/src/waitlist.ts
Purpose: Handle waitlist submissions
Lines: ~100
Dependencies: express, database query
Routes: POST /submit
Rate Limit: 3 per hour per IP
Validation: Email format, all fields required

POTENTIAL ISSUES:
- ❓ What if database is down?
- ❓ What if email is in users table already?
- ❓ SQL injection risk?

FIX BEFORE IMPLEMENTING:
✅ Use parameterized queries (already standard)
✅ Check users table for existing account
✅ Add try-catch with fallback

---

### EXISTING FILES TO MODIFY (8)

#### File 4: app/page.tsx (Landing Page)
Current: "Connect Now" → /onboarding
Change: "Connect Now" → /check-access
Lines affected: ~3 locations

SEARCH FOR:
- href="/onboarding"
- Link to onboarding
- Connect now button

VERIFY BEFORE CHANGING:
- ❓ Are there other onboarding links we missed?
- ❓ Will this break referral links?
- ❓ What about admin QR code links?

FIX:
✅ Search ALL instances of /onboarding in landing
✅ Keep inviteCode param links unchanged
✅ Only change direct /onboarding (no params)

---

#### File 5: app/onboarding/page.tsx
Current: Anyone can access
Change: Require invite code in URL or valid session
Lines to add: ~20 (useEffect check)

LOCATION: After imports, before main content
Logic: 
```
if (!inviteCode && !hasValidSession) {
  router.push('/waitlist');
}
```

POTENTIAL ISSUES:
- ❓ What if USC card user comes back later?
- ❓ What about users mid-onboarding who refresh?
- ❓ Will this break email verification step?

FIX BEFORE IMPLEMENTING:
✅ Check sessionStorage for temp_usc_id
✅ Allow if user is on email-verify step
✅ Store onboarding progress to detect refreshes

---

#### File 6: server/src/auth.ts
Current: POST /auth/guest allows signup without invite
Change: Require inviteCode in request body
Lines to modify: Line ~28, ~46-70

CURRENT CODE:
```typescript
const { name, gender, referralCode, inviteCode, email } = req.body;

if (inviteCode) {
  // validate and use code
}
// Continue even without code ❌
```

NEW CODE:
```typescript
const { name, gender, referralCode, inviteCode, email } = req.body;

// CRITICAL: Require invite code
if (!inviteCode) {
  return res.status(403).json({ 
    error: 'Invite code required',
    requiresInviteCode: true
  });
}

// Validate format
if (!/^[A-Z0-9]{16}$/.test(sanitizedCode)) {
  return res.status(400).json({ error: 'Invalid invite code format' });
}

// Continue with validation...
```

POTENTIAL ISSUES:
- ❓ What about USC card users (use guest-usc route)?
- ❓ What about existing users with sessions?
- ❓ Will this break tests?

VERIFY:
✅ USC card users use /auth/guest-usc (different route) ✅
✅ Existing users go through /auth/login ✅
✅ Only affects NEW guest signups ✅

---

#### File 7: server/src/payment.ts
Current: Stripe routes active
Change: Disable create-checkout and webhook
Lines to modify: Line 51-96, 103-217

OPTIONS:
A. Delete routes entirely
B. Return 410 Gone
C. Comment out

RECOMMENDED: Option B (410 Gone)
- Keeps code for reference
- Clear error message
- Easy to revert

CODE:
```typescript
router.post('/create-checkout', requireAuth, async (req, res) => {
  return res.status(410).json({ 
    error: 'Payment processing disabled',
    message: 'BUMPIN is currently invite-only. Join our waitlist or get an invite code.',
    waitlistUrl: '/waitlist'
  });
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  return res.status(410).send('Webhook disabled');
});
```

POTENTIAL ISSUES:
- ❓ What about existing Stripe subscriptions?
- ❓ What about webhook retries from Stripe?
- ❓ Should we keep webhook for existing users?

FIX:
✅ No existing subscriptions (was one-time payment)
✅ Stripe will retry then stop
✅ Can disable webhook in Stripe dashboard

---

#### File 8: server/src/index.ts
Current: Routes mounted
Change: Add waitlist route mounting
Line to add: After line ~512

CODE:
```typescript
import waitlistRoutes from './waitlist';
// ...
app.use('/waitlist', apiLimiter, waitlistRoutes);
```

POTENTIAL ISSUES:
- ❓ Route ordering matters?
- ❓ Rate limiter appropriate?

VERIFY:
✅ Order doesn't matter (Express matches first)
✅ apiLimiter is correct (not authLimiter)

---

#### File 9: server/src/types.ts
Current: No Waitlist interface
Change: Add Waitlist interface
Lines to add: ~10

CODE:
```typescript
export interface WaitlistEntry {
  id: number;
  name: string;
  email: string;
  state: string;
  school: string;
  ipAddress: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  notifiedAt?: number;
}
```

POTENTIAL ISSUES:
- ❓ Missing fields?
- ❓ Type mismatches with database?

VERIFY:
✅ Matches database schema
✅ All fields covered

---

#### File 10: app/paywall/page.tsx
Current: Shows Stripe payment option
Change: Remove Stripe, show only invite code + waitlist
Lines to modify: ~50-100

KEEP:
- Invite code input
- Validation

REMOVE:
- Stripe checkout button
- Payment processing

ADD:
- "Join Waitlist" button
- Link to /waitlist

---

#### File 11: app/main/page.tsx
Current: Checks paidStatus, redirects to paywall
Change: Redirect to waitlist instead of paywall
Line to modify: Line ~74

BEFORE:
```typescript
if (!hasPaid) {
  router.push('/paywall');
}
```

AFTER:
```typescript
if (!hasPaid) {
  router.push('/waitlist');
}
```

POTENTIAL ISSUES:
- ❓ What if user just got invite code?
- ❓ Infinite redirect loop?

VERIFY:
✅ User with invite goes through onboarding first
✅ Only unpaid users without codes redirected
✅ No loop (waitlist doesn't redirect to main)

---

## PHASE 2: LOGIC VERIFICATION

### Flow 1: New User (No Invite)
1. Lands on homepage
2. Clicks "Get Started"
3. → /check-access
4. No inviteCode in URL
5. → /waitlist
6. Fills form
7. Submits
8. ✅ Added to waitlist

VERIFY: ✅ No bypass possible

### Flow 2: User With Invite Code
1. Scans friend's QR code
2. Opens URL: /onboarding?inviteCode=ABC123...
3. OR clicks "Get Started" after scanning
4. → /check-access?inviteCode=ABC123...
5. Has inviteCode
6. → /onboarding?inviteCode=ABC123...
7. Normal onboarding flow
8. ✅ Account created

VERIFY: ✅ Works correctly

### Flow 3: USC Student
1. Scans admin QR
2. URL: /onboarding?inviteCode=ADMINCODE
3. → /check-access?inviteCode=ADMINCODE
4. → /onboarding?inviteCode=ADMINCODE
5. Scans USC card
6. ✅ Account created

VERIFY: ✅ USC flow intact

### Flow 4: User Already Has Account
1. Clicks "Get Started"
2. → /check-access
3. No inviteCode
4. → /waitlist
5. Sees "Already have account? Login"
6. Goes to /login
7. ✅ Logs in

VERIFY: ✅ Existing users not affected

### Flow 5: Direct /onboarding URL
1. User types /onboarding directly
2. useEffect runs
3. No inviteCode in URL
4. Checks session
5. No valid session
6. → /waitlist
7. ✅ Blocked

VERIFY: ✅ Direct access blocked

### Flow 6: API Exploit
1. Hacker: POST /auth/guest without inviteCode
2. Backend checks inviteCode
3. Not present
4. Returns 403 error
5. ✅ Blocked

VERIFY: ✅ API protected

---

## PHASE 3: PROCESSING ERROR CHECKS

### Database Errors:
- ❓ Waitlist table doesn't exist → Create migration first
- ❓ Unique constraint violation → Return friendly error
- ❓ Connection timeout → Retry logic

### Network Errors:
- ❓ API call fails in check-access → Show error, allow retry
- ❓ Waitlist submit fails → Show error, don't mark submitted

### Edge Case Errors:
- ❓ User submits then refreshes → Check if submitted (by email)
- ❓ Two users submit same email → Second gets error (unique constraint)

---

## PHASE 4: FINAL VERIFICATION CHECKLIST

Before implementing each file:

### For NEW files:
- [ ] Check all imports exist
- [ ] Verify all state variables used
- [ ] Test all functions defined
- [ ] Validate all API endpoints exist
- [ ] Confirm all types match

### For MODIFIED files:
- [ ] Read current code first
- [ ] Verify line numbers accurate
- [ ] Check for duplications
- [ ] Ensure no conflicts
- [ ] Test logic flow

### For DATABASE changes:
- [ ] Create migration SQL
- [ ] Test on local/staging first
- [ ] Add rollback plan
- [ ] Verify constraints

---

## DECISION POINTS

Before proceeding, confirm:

1. ✅ Disable Stripe completely? (recommended)
2. ✅ Require invite code for ALL signups? (yes)
3. ✅ Redirect "Connect Now" to check-access? (yes)
4. ✅ Keep existing paid users? (yes - grandfather)
5. ✅ USC card still works? (yes - uses admin invite code)

---

## IMPLEMENTATION ORDER

1. Create waitlist table (database first)
2. Create server/src/waitlist.ts (backend)
3. Mount route in index.ts (backend)
4. Test backend with curl
5. Create app/waitlist/page.tsx (frontend)
6. Create app/check-access/page.tsx (frontend)
7. Modify app/page.tsx (landing)
8. Test frontend flow
9. Modify app/onboarding/page.tsx (protection)
10. Modify server/src/auth.ts (require invite)
11. Disable Stripe routes
12. Test all flows end-to-end
13. Commit

Ready to proceed with this order?
