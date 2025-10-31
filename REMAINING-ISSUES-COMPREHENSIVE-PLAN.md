REMAINING ISSUES - COMPREHENSIVE ANALYSIS & FIX PLAN
====================================================

## ISSUE 1: Photo Upload - No Confirmation

Current Flow:
- Camera opens
- User clicks "Capture selfie"
- Photo immediately uploads (no preview/confirm)

Requested:
- Show preview after capture
- "Confirm" or "Retake" buttons
- Progress bar during upload

Files to modify:
- app/onboarding/page.tsx (selfie step)
- Add preview state + confirmation

---

## ISSUE 2: Video Upload - No Preview/Retake

Current Flow:
- Record video
- Immediately uploads
- Can't watch before uploading
- Can't retake in settings

Requested:
- Preview video after recording
- "Confirm" or "Retake" buttons
- Progress bar during upload
- Settings: Watch current video + retake option

Files to modify:
- app/onboarding/page.tsx (video step)
- app/refilm/page.tsx (settings retake)

---

## ISSUE 3: Settings Upgrade - USC Detection Problem

Current Code (line 93):
```typescript
const hasUSCCard = paymentStatus?.uscId || session.uscId;
```

Problem: User signed up via admin QR + email (WORKFLOW 3):
- uscId = NULL (no card scanned)
- email = 'user@usc.edu'
- hasUSCCard = false (wrong!)
- Allows any email ❌

FIX NEEDED:
```typescript
const hasUSCCard = paymentStatus?.uscId || session.uscId;
const hasUSCEmail = paymentStatus?.email?.endsWith('@usc.edu');
const isUSCUser = hasUSCCard || hasUSCEmail;

if (isUSCUser && !email.trim().toLowerCase().endsWith('@usc.edu')) {
  alert('USC users must use @usc.edu email address');
  return;
}
```

Also need UI update:
```typescript
<label>
  Email {isUSCUser && (
    <span className="text-yellow-300">(must be @usc.edu)</span>
  )}
</label>
<input
  placeholder={isUSCUser ? "your@usc.edu" : "your@email.com"}
/>
```

---

## ISSUE 4: "Account Already Permanent" Error

Scenario: User completes email verification in onboarding
- /verification/verify sets accountType: 'permanent'
- User finishes onboarding
- Goes to settings
- Upgrade button still shows (shouldn't!)
- Clicks upgrade
- Backend: "Account is already permanent"

Root Cause: Settings shows upgrade button for accountType === 'guest'
- But user is already permanent via email verification

FIX 1: Hide button if permanent
```typescript
// Line 171 in settings/page.tsx
{!loadingPayment && 
 paymentStatus?.accountType === 'guest' &&  ← Already has this
 paymentStatus?.accountExpiresAt && (
```

This should work! But maybe paymentStatus not updated?

FIX 2: Reload payment status after verification
- User completes email verification
- Should reload paymentStatus
- Button should disappear

---

## VERIFICATION WORKFLOW VALIDITY

### WORKFLOW 1: Friend Invite ✅
- accountType: guest → permanent (optional)
- Email: any email
- Verification: required
- VALID: ✅

### WORKFLOW 2: USC Card ✅
- accountType: guest → permanent (optional)
- Email: @usc.edu required when upgrading
- Card: scanned (uscId set)
- VALID: ✅ (if uscId check works)

### WORKFLOW 3: Admin QR + Email ✅
- accountType: guest → permanent (automatic on verification)
- Email: @usc.edu required
- Verification: required
- ISSUE: Upgrade button shows after already permanent ❌
- FIX NEEDED: Hide button or reload status

---

## IMPLEMENTATION PRIORITY

High Priority:
1. ✅ Fix USC detection (check email too)
2. ✅ Hide upgrade button if permanent

Medium Priority:
3. Photo preview + confirmation
4. Video preview + retake

Low Priority:
5. Progress bars (nice to have)

---

Should I proceed with High Priority fixes first?
Or all issues?

Estimate: 
- High priority: 2 commits, 30 min
- All issues: 8-10 commits, 2-3 hours
