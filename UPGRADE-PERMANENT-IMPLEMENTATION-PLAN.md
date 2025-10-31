UPGRADE TO PERMANENT - COMPLETE IMPLEMENTATION PLAN
===================================================

## CURRENT STATE

Settings upgrade (handleMakePermanent):
- Direct call to /auth/link
- No password validation
- No email verification
- email_verified set to true immediately (WRONG)

## REQUIRED CHANGES

### 1. Frontend Changes (app/settings/page.tsx)

#### Import Password Component
```typescript
import { PasswordInput } from '@/components/PasswordInput';
```

#### Add State
```typescript
const [passwordValid, setPasswordValid] = useState(false);
const [showEmailVerify, setShowEmailVerify] = useState(false);
const [verificationCode, setVerificationCode] = useState('');
const [pendingEmail, setPendingEmail] = useState('');
```

#### Update handleMakePermanent
```typescript
// Step 1: Validate password (use PasswordInput)
if (!passwordValid) {
  alert('Password does not meet requirements');
  return;
}

// Step 2: Send verification code
const sendRes = await fetch(`${API_BASE}/verification/send`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${session.sessionToken}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({ email: email.trim() }),
});

if (!sendRes.ok) {
  const error = await sendRes.json();
  throw new Error(error.error);
}

// Step 3: Show email verification modal
setPendingEmail(email.trim());
setShowEmailVerify(true);
```

#### Add Email Verification Step
```typescript
const handleVerifyCode = async () => {
  // Verify code
  const verifyRes = await fetch(`${API_BASE}/verification/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.sessionToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code: verificationCode }),
  });
  
  if (!verifyRes.ok) {
    throw new Error('Invalid code');
  }
  
  // Then link password
  const linkRes = await fetch(`${API_BASE}/auth/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionToken: session.sessionToken,
      email: pendingEmail,
      password: password.trim(),
    }),
  });
  
  // Account upgraded!
};
```

#### Update UI
```typescript
// Replace password input with PasswordInput component
<PasswordInput
  value={password}
  onChange={setPassword}
  onValidationChange={(isValid) => setPasswordValid(isValid)}
  showRequirements={true}
  placeholder={hasUSCCard ? "Password for @usc.edu account" : "Choose a strong password"}
/>

// Add email label hint
<label className="mb-2 block text-sm font-medium text-[#eaeaf0]">
  Email {hasUSCCard && <span className="text-yellow-300">(must be @usc.edu)</span>}
</label>
```

---

### 2. Backend Changes (server/src/auth.ts)

#### Add Permanent Check
```typescript
// Line 255 (before other checks):
if (user.accountType === 'permanent') {
  return res.status(400).json({
    error: 'Account is already permanent',
    hint: 'Your account is already upgraded.'
  });
}
```

#### Remove email_verified: true
```typescript
// Line 312: REMOVE this (verification.ts sets it)
// email_verified: true, // DELETE THIS LINE
```

---

### 3. New Component: EmailVerification Modal

Create: app/settings/EmailVerificationModal.tsx
```typescript
export function EmailVerificationModal({
  email,
  onVerified,
  onCancel
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  
  // 6-digit input
  // Resend code button
  // Verify button
  // Cancel button
}
```

---

## IMPLEMENTATION STEPS

### Step 1: Add PasswordInput to Settings
- Import component
- Replace basic input
- Add validation state
- Show requirements

### Step 2: Change Flow to Multi-Step
- Step A: Email + Password (validated)
- Step B: Send verification code
- Step C: Enter code
- Step D: Verify + Link account

### Step 3: Update Backend
- Add permanent account check
- Remove email_verified from /auth/link
- Let /verification/verify set it instead

### Step 4: Update UI Labels
- Show "(must be @usc.edu)" for USC users
- Show password requirements
- Show verification code input

### Step 5: Test All Edge Cases
- USC card user with @usc.edu
- USC card user with @gmail.com (reject)
- Regular user with any email
- Weak password (reject)
- Wrong code (3 attempts max)
- Already permanent (reject)

---

## ESTIMATED EFFORT

- Files to modify: 3-4
- Lines to add: ~200
- Testing required: ~30 minutes
- Total time: 1-2 hours

---

## ALTERNATIVE: Quick Fix

If full email verification is too much:
1. ✅ Add PasswordInput (validation only)
2. ✅ Update UI labels
3. ✅ Add backend permanent check
4. ⏸️ Skip email verification (mark as TODO for later)

This fixes password validation while keeping flow simple.

---

Recommendation: Full implementation for security
Current state: Multiple critical gaps
