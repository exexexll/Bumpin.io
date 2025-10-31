BUMPIN LOGO BYPASS - TRACE
===========================

User Flow:
1. User on email-verify step (pending email verification)
2. Clicks BUMPIN logo in header
3. → Goes to homepage (/)
4. Clicks "Start connecting" in Hero
5. → /check-access

What SHOULD happen in check-access:
- No inviteCode in URL
- Has session
- Calls /payment/status
- Gets: pendingEmail = 'user@usc.edu', emailVerified = false
- Line 42-47: if (pendingEmail && !emailVerified) → redirect to /onboarding
- ✅ Should work!

But user says they can still bypass...

Possibilities:
1. ❌ pendingEmail not in API response (but I added it)
2. ❌ emailVerified undefined (column doesn't exist?)
3. ❌ Check condition wrong
4. ❌ Redirect happens but user clicks again before redirect?
5. ❌ Session state issue

Let me check if email_verified column exists...
