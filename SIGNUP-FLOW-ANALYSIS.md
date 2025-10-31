SIGNUP FLOW BLOCKING ANALYSIS
==============================

User Report: "IM STILL BLOCKED"

Current Flow:
=============

Option 1: QR Code Scan
----------------------
1. Click "Scan QR Code or Barcode"
2. Choice modal -> "Scan QR Code"
3. AdminQRScanner opens
4. Scan QR (admin or friend invite)
5. Extract inviteCode
6. Redirect: /onboarding?inviteCode=CODE
7. Onboarding checks: hasInviteCode = true ✅

Option 2: USC Card Scan
-----------------------
1. Click "Scan QR Code or Barcode"
2. Choice modal -> "Scan USC Card"
3. USCCardScanner opens
4. Scan USC card
5. Store: temp_usc_id, temp_usc_barcode, usc_card_verified
6. Redirect: /onboarding
7. Onboarding checks: hasUscScan = true ✅

Onboarding Protection (line 99):
================================
if (!hasInviteCode && !hasUscScan && !session && !hasEmailToVerify) {
  router.push('/waitlist');
  return;
}

This should allow:
- hasInviteCode (from QR scan) ✅
- hasUscScan (from card scan) ✅
- session (existing users) ✅
- hasEmailToVerify (email signup) ✅

Where's the block?
==================

Possibility 1: User trying to submit waitlist form
- Waitlist form -> POST /waitlist/submit
- This just adds to waitlist database
- Does NOT create account
- Does NOT redirect to onboarding
- User stays on waitlist page

Possibility 2: QR scanner not extracting code correctly
- Domain validation might be rejecting QR
- Format validation might be wrong

Possibility 3: SessionStorage not persisting
- Card scan stores in sessionStorage
- But redirect might clear it?

Need to:
1. Check onboarding logs
2. Verify QR code extraction
3. Test USC card flow
4. Maybe simplify - remove choice modal?
