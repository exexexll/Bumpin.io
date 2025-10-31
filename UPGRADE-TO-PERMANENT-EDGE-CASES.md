UPGRADE TO PERMANENT ACCOUNT - ALL EDGE CASES
==============================================

## Current Issues Found:

1. ❌ No password validation in settings upgrade
2. ❌ No email verification code sent
3. ❌ USC students not required to use @usc.edu in UI
4. ❌ Settings upgrade doesn't match onboarding flow

---

## ALL EDGE CASES TO EVALUATE

### EDGE CASE 1: USC Card User Upgrading
Scenario: User scanned USC card, now wants permanent account
Current State:
- Has uscId in database ✅
- Frontend checks @usc.edu (line 88-92) ✅
- Backend checks @usc.edu (line 277-283) ✅
- NO email verification sent ❌
- NO password validation ❌

Expected Flow:
1. Click upgrade button
2. Enter @usc.edu email (enforced)
3. Enter strong password (validated)
4. Send verification code to email
5. User enters 6-digit code
6. Account upgraded to permanent

Current Gaps:
- Skips email verification ❌
- Skips password validation ❌

---

### EDGE CASE 2: Regular Guest User Upgrading
Scenario: User signed up with invite code, now wants permanent
Current State:
- No uscId
- Any email allowed ✅
- NO email verification sent ❌
- NO password validation ❌

Expected Flow:
1. Click upgrade button
2. Enter any email
3. Enter strong password (validated)
4. Send verification code to email
5. User enters code
6. Account upgraded

Current Gaps:
- Skips email verification ❌
- Skips password validation ❌

---

### EDGE CASE 3: User Already Has Email
Scenario: User has pending_email from onboarding
Current State:
- Backend checks pending_email (line 258-265) ✅
- Returns error if USC email pending ✅
- But doesn't verify non-USC pending emails ❌

Expected: Require verification of pending_email before allowing new email

---

### EDGE CASE 4: Email Already Taken
Scenario: User tries email already in use
Current State:
- Backend checks (line 286-292) ✅
- Returns 409 error ✅

Expected: ✅ Working correctly

---

### EDGE CASE 5: Weak Password
Scenario: User enters "password123"
Current State:
- NO validation ❌
- Accepts any password ❌

Expected: Reject with specific error (uppercase, number, symbol, 8+ chars)

---

### EDGE CASE 6: USC Student Using Non-USC Email
Scenario: USC card user tries @gmail.com
Current State:
- Frontend alerts ✅ (line 90)
- Backend rejects ✅ (line 277-283)

Expected: ✅ Working correctly

---

### EDGE CASE 7: Duplicate Upgrade Attempts
Scenario: User already permanent, tries to upgrade again
Current State:
- Frontend doesn't show button if permanent ✅
- Backend should reject ❌ (not checked)

Expected: Backend should check accountType === 'permanent'

---

### EDGE CASE 8: Email Verification Code Expires
Scenario: User waits >15 min to enter code
Current State:
- Code expires (line 84-86 in verification.ts) ✅
- User can request new code ✅

Expected: ✅ Working correctly

---

### EDGE CASE 9: Too Many Verification Attempts
Scenario: User enters wrong code 3+ times
Current State:
- Limited to 3 attempts (line 43-45 in verification.ts) ✅
- Must wait 1 hour ✅

Expected: ✅ Working correctly

---

### EDGE CASE 10: Session Expires During Upgrade
Scenario: User starts upgrade, session expires before completing
Current State:
- Session checked in /auth/link (line 248-250) ✅
- Returns 401 if expired ✅

Expected: ✅ Working correctly

---

## SUMMARY OF GAPS

Critical:
1. ❌ No email verification in settings upgrade
2. ❌ No password validation in settings upgrade

Medium:
3. ❌ USC email not shown in UI placeholder/label
4. ❌ Backend doesn't reject if already permanent

Low:
5. ✅ All other edge cases handled correctly

---

Proceeding with fixes...
