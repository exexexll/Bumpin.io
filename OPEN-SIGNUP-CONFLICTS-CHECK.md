# Open Signup Implementation - Conflict Check

## Code Added So Far:
1. ✅ server/migrations/add-open-signup-settings.sql - Database table
2. ✅ server/src/types.ts - Added 'open_signup' to PaidStatus
3. ✅ server/src/open-signup.ts - /status and /toggle endpoints
4. ✅ server/src/index.ts - Registered /open-signup routes

## Potential Conflicts:

### Issue 1: Existing paidStatus Checks
All these files check paidStatus and need to include 'open_signup':
- app/main/page.tsx (line 144-146)
- app/onboarding/page.tsx (line 148-150, 315)
- app/refilm/page.tsx (line 58)
- app/history/page.tsx (line 51)
- app/tracker/page.tsx (line 37)
- app/settings/page.tsx
- app/check-access/page.tsx (line 48-50)
- server/src/paywall-guard.ts

Currently they check:
  paidStatus === 'paid' || 'qr_verified' || 'qr_grace_period'

Need to add:
  || paidStatus === 'open_signup'

### Issue 2: Invite Code Requirements
Files that require invite codes need to skip when open signup enabled:
- server/src/auth.ts (line 42-50) - CRITICAL
- app/onboarding/page.tsx (line 119-123) - Waitlist protection
- app/check-access/page.tsx (line 64-66)

## Testing Plan:
1. Run migration ✅
2. Update all paidStatus checks
3. Modify auth to skip invite code if open signup
4. Test both modes (on/off)

Proceeding...
