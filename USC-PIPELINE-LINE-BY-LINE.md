USC ADMIN QR PIPELINE - COMPLETE LINE-BY-LINE ANALYSIS
======================================================

EXPECTED FLOW:
1. Scan admin QR code
2. USC Welcome popup
3. USC Card scanner
4. Name + Gender (NO email, NO payment)
5. Selfie
6. Video  
7. Permanent step (optional @usc.edu email)
8. Main page (NO paywall)

ACTUAL CODE ANALYSIS:
=====================

STEP 1: Admin QR Detection
---------------------------
File: app/onboarding/page.tsx
Lines: 144-169

Line 146: if (invite) {
Line 147:   setInviteCode(invite)
Line 152:   fetch('/payment/validate-code', { code: invite })
Line 159:     if (data.valid && data.type === 'admin') {
Line 161:       setNeedsUSCCard(true)
Line 162:       setNeedsUSCEmail(false) ✓ CORRECT
Line 163:       setStep('usc-welcome') ✓ CORRECT

✅ CORRECT

STEP 2: USC Welcome Popup
--------------------------
File: app/onboarding/page.tsx
Lines: 838-844

Line 839: {step === 'usc-welcome' && (
Line 840:   <USCWelcomePopup
Line 841:     onContinue={() => setStep('usc-scan')} ✓ CORRECT

✅ CORRECT

STEP 3: USC Card Scanner  
-------------------------
File: app/onboarding/page.tsx
Lines: 846-885

Line 848: onSuccess={(scannedUSCId, rawValue) => {
Line 851:   setUscId(scannedUSCId) ✓
Line 852:   setNeedsUSCEmail(false) ✓
Line 853:   setNeedsUSCCard(false) ✓
Line 854:   setUscEmail('') ✓
Line 857-859: sessionStorage.setItem('temp_usc_id', ...) ✓
Line 864:   setStep('name') ✓ CORRECT

✅ CORRECT

STEP 4: Name + Gender Submission
---------------------------------
File: app/onboarding/page.tsx
Lines: 302-377

Line 307: if (uscId) {
Line 310:   POST /auth/guest-usc
Line 314:     body: { name, gender, inviteCode }
  
Backend: server/src/auth.ts
Lines: 431-557

Line 448: if (inviteCode) {
Line 455:   store.useInviteCode(code, userId, name, undefined, true)
           ↑ skipEmailCheck=true ✓ CORRECT

Line 492:   paidStatus: codeVerified ? 'qr_verified' : 'unpaid'
            ↑ If inviteCode valid → 'qr_verified' ✓ CORRECT

Line 503-509: store.createUser(user)

Backend: server/src/store.ts
Lines: 120-147

Line 121-124: INSERT INTO users (...27 columns...)
Line 131-145: VALUES (...27 values...)

❓ NEED TO VERIFY: Are all 27 values correct?

STEP 5: Payment Check
---------------------
File: app/onboarding/page.tsx
Lines: 356-369

Line 358: if (!uscId && response.paidStatus === 'unpaid' && !response.inviteCodeUsed) {
          ↑ !uscId check ✓ CORRECT
Line 362:   router.push('/paywall')

Line 367: if (uscId) {
Line 368:   console.log('bypassing paywall') ✓ CORRECT

✅ CORRECT - USC users bypass paywall

