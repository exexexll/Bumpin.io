BACKEND FLOW TRACE - Finding 403 Error
=======================================

Console Error: "Invite code required" + 403 on /auth/guest

Analyzing both paths:

## PATH 1: QR Code Scan

Waitlist:
- Scan QR → Extract inviteCode
- router.push(`/onboarding?inviteCode=ABCD1234...`)

Onboarding:
- Line 213-260: useEffect extracts from URL
- Line 216: const invite = searchParams.get('inviteCode')
- Line 225: setInviteCode(invite)
- inviteCode state = 'ABCD1234...'

Name/Gender Submit:
- Line 351-480: handleNameSubmit()
- Line 386: if (uscId) → NO (QR users don't have uscId)
- Line 408-417: else → Call createGuestAccount
- Passes: inviteCode (from state)
- API: POST /auth/guest with inviteCode
- Backend: Should work ✅

## PATH 2: USC Card Scan

Waitlist:
- Scan card → Extract USC ID
- sessionStorage.setItem('temp_usc_id', uscId)
- router.push('/onboarding') ← NO inviteCode in URL!

Onboarding:
- Line 213-260: useEffect runs
- Line 216: const invite = searchParams.get('inviteCode') = NULL
- NO setInviteCode called
- inviteCode state = null

Line 82: tempUsc = sessionStorage.getItem('temp_usc_id')
Line 87: hasUscScan = tempUsc
Line 99: Check passes (hasUscScan is true)

But where does uscId STATE get set?
Searching for setUscId...

CRITICAL QUESTION:
==================
When does uscId state get updated from sessionStorage?

Line 37: const [uscId, setUscId] = useState<string | null>(null);

Need to find where setUscId is called with sessionStorage value!

If uscId state is never set from sessionStorage:
- Line 386: if (uscId) → FALSE
- Line 408: else → Call createGuestAccount
- But inviteCode is also null!
- POST /auth/guest with NO inviteCode
- Backend returns 403! ← THIS IS THE BUG!

Checking for setUscId usage...

✅ BUG FIXED!
=============

Added useEffect (line 76-83):
```typescript
useEffect(() => {
  const tempUscId = sessionStorage.getItem('temp_usc_id');
  if (tempUscId) {
    console.log('[Onboarding] Loading USC ID from sessionStorage');
    setUscId(tempUscId);
  }
}, []);
```

Now USC Card Flow Works:
=========================

1. Scan card → sessionStorage.setItem('temp_usc_id', '1234567890')
2. Redirect to /onboarding
3. NEW useEffect runs → setUscId('1234567890') ✅
4. Protection check passes (hasUscScan = true)
5. Enter name/gender
6. Click Continue
7. Line 386: if (uscId) → TRUE ✅
8. POST /auth/guest-usc (no inviteCode needed!)
9. Backend: codeVerified = true (line 508)
10. Account created ✅

USC card users now call /auth/guest-usc properly!
No more 403 errors!

Testing ready!
