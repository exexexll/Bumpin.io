COMPLETE PIPELINE VERIFICATION - ALL REGISTRATION FLOWS
=======================================================

## ✅ PIPELINE 1: USC CARD ONBOARDING (ADMIN QR + USC CARD)

**Status:** ✅ WORKING (CONFIRMED BY USER)

**Flow:**
1. Scan admin QR: https://napalmsky.com/onboarding?inviteCode=TCZIOIXWDZLEFQZC
2. Scan USC card barcode
3. Enter name + gender
4. POST /auth/guest-usc (with inviteCode)
5. Take selfie + video
6. Skip or Make Permanent
7. POST /usc/finalize-registration
8. ✅ Success

**Issues Fixed:**
- ✅ randomBytes(16) instead of randomBytes(8)
- ✅ Invite code now 16 chars (not 80 chars with "undefined")
- ✅ Fits in VARCHAR(20) database column
- ✅ QR code shows in settings for qr_verified users

---

## PIPELINE 2: NORMAL GUEST ACCOUNT (REFERRAL OR INVITE CODE)

**Status:** Checking...

**Flow:**
1. Go to /onboarding?inviteCode=USERCODE123456
2. Enter name + gender
3. POST /auth/register (via createGuestAccount)
4. Take selfie + video
5. Skip or Make Permanent
6. ✅ Success

**File:** app/onboarding/page.tsx line 332
**Backend:** server/src/auth.ts line 15-415

---

## PIPELINE 3: PAID ACCOUNT (STRIPE PAYMENT)

**Status:** Checking...

**Flow:**
1. Go to /onboarding
2. Enter name + gender
3. Redirect to paywall
4. Pay with Stripe
5. Return to onboarding
6. Complete profile
7. ✅ Success

**File:** app/onboarding/page.tsx line 355-370
**Backend:** server/src/payment.ts line 23-110

---

## PIPELINE 4: USC CARD LOGIN

**Status:** ✅ WORKING

**Flow:**
1. Go to /login
2. Click "USC Card" tab
3. Scan USC card
4. POST /usc/login-card
5. ✅ Logged in

**File:** app/login/page.tsx line 83-217
**Component:** components/usc-verification/USCCardLogin.tsx
**Backend:** server/src/usc-verification.ts line 271-366

---

Checking each pipeline now...
