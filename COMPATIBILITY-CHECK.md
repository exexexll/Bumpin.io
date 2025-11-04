# Compatibility Check - Admin QR Fix

## Scenarios to Test:

### 1. Regular User Invite Code (4-use codes)
**Old Flow:** /onboarding?inviteCode=USER16CHARS
**New Flow:** /onboarding?inviteCode=USER16CHARS
**Status:** ✅ UNCHANGED - Goes directly to onboarding

### 2. Admin QR Code  
**Old Flow:** /onboarding?inviteCode=ADMIN16CHARS → Broken
**New Flow:** /check-admin-code?inviteCode=ADMIN16CHARS → /onboarding?adminCode=true
**Status:** ✅ FIXED - Shows USC welcome

### 3. Referral Links (Intro feature)
**Old Flow:** /onboarding?ref=REFCODE
**New Flow:** /onboarding?ref=REFCODE
**Status:** ✅ UNCHANGED - No inviteCode parameter

### 4. Referral + Invite Combined
**Old Flow:** /onboarding?ref=REFCODE&inviteCode=XXXXX
**New Flow:** Need to check if check-admin-code preserves ref parameter

### 5. Direct /onboarding access (no params)
**Old Flow:** Waitlist protection blocks
**New Flow:** Waitlist protection blocks
**Status:** ✅ UNCHANGED

### 6. Existing session with admin code
**Old Flow:** Redirected to /main (BROKEN)
**New Flow:** Should skip onboarding or show USC verification

## Potential Issues:

❌ ISSUE FOUND: check-admin-code doesn't preserve ref parameter
If link is: /check-admin-code?inviteCode=XXX&ref=YYY
Redirect will be: /onboarding?inviteCode=XXX&adminCode=true
Missing: &ref=YYY

NEED TO FIX: Preserve all URL parameters
