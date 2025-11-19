# Open Signup System - Complete Review

## INTENDED PIPELINE:

### Mode 1: OPEN SIGNUP ENABLED (Toggle ON)
```
User → /check-access
  ↓
No invite code? OK! (isOpenSignupEnabled = true)
  ↓
/onboarding (no waitlist redirect)
  ↓
Name/Gender → Photo → Done
  ↓
/auth/guest (inviteCode = undefined)
  ↓
Server checks: isOpenSignupEnabled() → TRUE
  ↓
Creates user with paidStatus = 'open_signup'
  ↓
Access to /main ✅
```

### Mode 2: INVITE-ONLY (Toggle OFF - Default)
```
User → /check-access
  ↓
No invite code? → Redirect to /waitlist
  ↓
Must get invite code
  ↓
/onboarding?inviteCode=XXXXX
  ↓
/auth/guest (inviteCode provided)
  ↓
paidStatus = 'qr_grace_period'
  ↓
Access to /main ✅
```

## POTENTIAL CONFLICTS TO CHECK:

### 1. Auth Endpoint Conflicts
File: server/src/auth.ts

Lines 42-56: New code checks isOpenSignupEnabled()
- ✓ Only skips invite code if toggle ON
- ✓ Still validates code if provided
- ? Does this conflict with USC admin QR codes?
- ? Does this conflict with USC email signup?

### 2. Event Mode Conflicts
Files: server/src/event-guard.ts, app/event-wait/page.tsx

Event mode restricts by time.
- ? Does open_signup work with event mode?
- ? Should event mode override open signup?

### 3. Paywall Guard
File: server/src/paywall-guard.ts

Line 27-30: Added 'open_signup' to hasAccess check
- ✓ open_signup users can access protected routes
- ? Any routes that shouldn't allow open_signup?

### 4. USC Admin QR Flow
Files: app/onboarding/page.tsx, server/src/auth.ts

Admin QR flow:
1. Scan QR → isAdminCode = true
2. USC Welcome → Card Scanner → Name → Photo
3. Calls /auth/guest-usc (different endpoint)

- ✓ Uses /auth/guest-usc NOT /auth/guest
- ✓ Should not be affected by open signup toggle
- ✓ Still requires admin code

### 5. USC Email Signup (Waitlist)
File: app/waitlist/page.tsx

USC email flow:
1. Enter @usc.edu email
2. /auth/guest-usc creates user
3. /verification/send
4. User verifies
5. /verification/verify upgrades

- ✓ Uses /auth/guest-usc NOT /auth/guest
- ✓ Should not be affected by open signup toggle

### 6. Onboarding Waitlist Protection
File: app/onboarding/page.tsx

Lines 90-155: Waitlist protection checks invite code
- Currently: Redirects to /waitlist if no code
- ? Should skip this check if open signup enabled
- ❌ CONFLICT FOUND: Still blocks users without code!

### 7. Check-Access Page
File: app/check-access/page.tsx

Line 64-66: Redirects to /waitlist if no invite code
- ? Should check open signup status first
- ❌ CONFLICT FOUND: Still blocks users!

### 8. Payment Status Checks
12 files check paidStatus
- ✓ All updated to include 'open_signup'
- ✓ No conflicts

### 9. Database Schema
- ✓ paidStatus is VARCHAR (can hold 'open_signup')
- ✓ No constraints prevent this value

## CONFLICTS FOUND:

### CRITICAL CONFLICT 1: Onboarding Waitlist Protection
**File:** app/onboarding/page.tsx
**Line:** 119-123
**Issue:** Still redirects to /waitlist even if open signup enabled
**Fix Needed:** Check isOpenSignupEnabled before redirecting

### CRITICAL CONFLICT 2: Check-Access Page  
**File:** app/check-access/page.tsx
**Line:** 64-66
**Issue:** Still redirects to /waitlist even if open signup enabled
**Fix Needed:** Fetch /open-signup/status, skip waitlist if enabled

## TESTING PLAN:

Before fixing conflicts, document expected flow:

### With Toggle ON:
1. User goes to landing page
2. Clicks "Get Started"
3. /check-access → Should go to /onboarding (NOT /waitlist)
4. /onboarding → Should NOT check for invite code
5. User completes profile
6. Gets paidStatus = 'open_signup'
7. Can access /main

### With Toggle OFF:
1. User goes to landing page  
2. Clicks "Get Started"
3. /check-access → /waitlist (current behavior)
4. Needs invite code

## NEXT STEPS:
1. Fix onboarding waitlist protection
2. Fix check-access redirect
3. Test both modes
4. Verify no conflicts with USC flows

Ready to fix conflicts...
