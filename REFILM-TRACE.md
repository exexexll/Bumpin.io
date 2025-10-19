# /refilm Navigation Trace

## User Flow:
1. On /event-wait page
2. Clicks "Update Photo & Video" button
3. Button calls: onClick={() => router.push('/refilm')}
4. Should navigate to /refilm page

## AuthGuard Check:
**Pathname:** '/refilm'

**Line 45 condition:**
```
session && !isPublicRoute && !isAdminRoute && pathname && pathname !== '/event-wait'
```
- session: ✅ (user logged in)
- !isPublicRoute: ✅ (/refilm not in publicRoutes)
- !isAdminRoute: ✅ (/refilm not /admin*)
- pathname: ✅ ('/refilm')
- !== '/event-wait': ✅

Condition: TRUE → continues

**Line 47-50:**
```
if (checkedPaths.has(pathname)) {
  setEventCheckComplete(true);
  return;
}
```
First visit: checkedPaths is empty, continues

**Line 52:**
```
const eventRestrictedRoutes = ['/main', '/history', '/tracker', '/settings'];
```
/refilm NOT in list

**Line 54:**
```
const isEventRestricted = eventRestrictedRoutes.some(route => pathname.startsWith(route));
```
Result: FALSE (no match)

**Line 56:**
```
if (isEventRestricted) {
  // ... event check
} else {
  setEventCheckComplete(true); ← GOES HERE
}
```

**Result:** AuthGuard ALLOWS /refilm

---

## Refilm Page Check:

**Lines 36-56 (useEffect):**
```typescript
fetch(`${API_BASE}/payment/status`)
  .then(data => {
    const hasPaid = data.paidStatus === 'paid' || ... || 'qr_grace_period';
    if (!hasPaid) {
      router.push('/paywall'); ← REDIRECTS AWAY!
    }
  })
```

**FOUND THE ISSUE!**

If user is in 'qr_grace_period' but hasn't verified payment status correctly,
OR if payment check fails,
/refilm redirects to /paywall immediately.

This happens so fast user doesn't see /refilm load - appears like button does nothing.

---

## Verification Needed:
1. Check user's paidStatus in database
2. Check if payment/status API returns correct data
3. Check browser network tab when clicking button

