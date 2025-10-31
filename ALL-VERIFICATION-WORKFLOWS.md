ALL VERIFICATION WORKFLOWS - COMPLETE ANALYSIS
==============================================

## WORKFLOW 1: Friend Invite → Guest Account → Optional Permanent

### Step 1: Signup (Friend Invite Code)
- Scan friend QR: /onboarding?inviteCode=USER16CHARS
- Enter name + gender
- POST /auth/guest with inviteCode
- Creates account:
  * accountType: 'guest'
  * paidStatus: 'qr_grace_period'
  * pending_email: NULL
  * email_verified: NULL
  * uscId: NULL
  * Account expires: 7 days

### Step 2: Upload Profile
- Take selfie
- Record video
- Upload both

### Step 3: Optional - Make Permanent
Option A: Skip → Stays as guest (7-day expiry)
Option B: Make permanent:
  - Click button in onboarding OR settings
  - Enter email (any email, not @usc.edu)
  - Enter password
  - Verification code sent
  - Must enter 6-digit code
  - Account upgraded:
    * accountType: 'permanent'
    * email_verified: true
    * accountExpiresAt: null

EXPECTED: ✅ Works with any email

---

## WORKFLOW 2: USC Card → Guest Account → Optional Permanent

### Step 1: Signup (Admin QR + USC Card)
- Scan admin QR: /onboarding?inviteCode=ADMIN16CHARS
- Scan USC campus card
- Enter name + gender
- POST /auth/guest-usc with inviteCode
- Creates account:
  * accountType: 'guest'
  * paidStatus: 'qr_verified'
  * pending_email: NULL
  * email_verified: NULL
  * uscId: '1268306021'
  * Account expires: 7 days

### Step 2: Upload Profile
- Take selfie
- Record video

### Step 3: Optional - Make Permanent
Option A: Skip → Stays as guest
Option B: Make permanent:
  - Click button
  - Must enter @usc.edu email (uscId exists)
  - Enter password
  - Verification code sent
  - Enter code
  - Account upgraded

EXPECTED: ✅ Requires @usc.edu

---

## WORKFLOW 3: Admin QR + Email (No Card)

### Step 1: Signup (Admin QR + Email Path)
- Scan admin QR: /onboarding?inviteCode=ADMIN16CHARS
- Click "Skip to Email Verification"
- Enter name + USC email
- POST /auth/guest with inviteCode + email
- Creates account:
  * accountType: 'guest'
  * paidStatus: 'qr_grace_period'
  * pending_email: 'user@usc.edu'
  * email_verified: false
  * uscId: NULL
  * Account expires: 7 days

### Step 2: Email Verification (REQUIRED)
- Verification code sent
- User must enter code
- POST /verification/verify
- Updates account:
  * accountType: 'permanent'
  * email: 'user@usc.edu'
  * email_verified: true
  * paidStatus: 'paid'
  * pending_email: NULL

### Step 3: Upload Profile
- Already permanent
- Upload selfie + video

EXPECTED: ✅ Email verified, account permanent

---

## ISSUE ANALYSIS

### Issue 1: "Account already permanent" error

This happens in WORKFLOW 3:
- User enters email verification code
- /verification/verify sets accountType: 'permanent'
- User goes to settings
- Clicks "Upgrade to Permanent"
- Backend checks: if (accountType === 'permanent') → ERROR

Root Cause: User IS already permanent (via email verification)!

FIX: Frontend should hide upgrade button if already permanent

---

### Issue 2: USC Detection in Settings

User signed up via admin QR + email (no card scan):
- uscId = NULL (no card scanned)
- pending_email was @usc.edu
- email now = @usc.edu
- email_verified = true

Settings checks: paymentStatus.uscId
- uscId = NULL → hasUSCCard = false
- Allows any email ❌

FIX: Also check if email ends with @usc.edu

---

Checking code for these issues...
