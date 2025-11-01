USC EMAIL SIGNUP FROM SCANNER - COMPLETE PLAN
==============================================

## REQUIREMENT

Add email signup option to USC card scanner page
- Shows during barcode scanning
- User can choose email instead of scanning
- Full email verification + password flow
- Same security as other email signups

## CURRENT CODE ANALYSIS

### 1. USC Card Scanner Location

File: components/usc-verification/USCCardScanner.tsx
Current: onSkipToEmail prop exists but just closes modal

Waitlist Usage (app/waitlist/page.tsx line 312-314):
```typescript
onSkipToEmail={() => {
  setShowBarcodeScanner(false);
}}
```

Currently: Just closes modal, no action ❌

### 2. Existing Email Verification Flow

Location: components/EmailVerification.tsx
- 6-digit code input
- POST /verification/send
- POST /verification/verify
- Used in:
  * Onboarding permanent upgrade
  * Settings account upgrade

### 3. Existing Password Validation

Location: components/PasswordInput.tsx
- Strength meter
- Requirements: 8+ chars, upper, lower, number, special
- Real-time feedback

## NEW IMPLEMENTATION PLAN

### STEP 1: Add Email Signup Modal State

File: app/waitlist/page.tsx

Add state:
```typescript
const [showEmailSignup, setShowEmailSignup] = useState(false);
const [signupEmail, setSignupEmail] = useState('');
const [signupPassword, setSignupPassword] = useState('');
const [passwordValid, setPasswordValid] = useState(false);
const [showEmailVerify, setShowEmailVerify] = useState(false);
```

### STEP 2: Update onSkipToEmail Callback

Line 312-314, change to:
```typescript
onSkipToEmail={() => {
  setShowBarcodeScanner(false);
  setShowEmailSignup(true);
}}
```

### STEP 3: Create Email Signup Modal

After barcode scanner modal (line ~320):

```typescript
{showEmailSignup && (
  <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4">
    <motion.div className="max-w-md w-full rounded-2xl bg-[#0a0a0c] p-8 border border-white/10">
      <h2 className="font-playfair text-2xl font-bold text-[#eaeaf0] mb-6">
        Sign Up with USC Email
      </h2>
      
      {!showEmailVerify ? (
        // Step 1: Email + Password Input
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#eaeaf0] mb-2 block">
              USC Email
            </label>
            <input
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              placeholder="your@usc.edu"
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-[#eaeaf0]..."
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-[#eaeaf0] mb-2 block">
              Password
            </label>
            <PasswordInput
              value={signupPassword}
              onChange={setSignupPassword}
              onValidationChange={(isValid) => setPasswordValid(isValid)}
            />
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => setShowEmailSignup(false)}>Cancel</button>
            <button 
              onClick={handleEmailSignup}
              disabled={!passwordValid || !signupEmail.endsWith('@usc.edu')}
            >
              Send Verification Code
            </button>
          </div>
        </div>
      ) : (
        // Step 2: Email Verification
        <EmailVerification
          sessionToken={tempSessionToken}
          email={signupEmail}
          onVerified={handleEmailVerified}
        />
      )}
    </motion.div>
  </div>
)}
```

### STEP 4: Create handleEmailSignup Function

```typescript
const handleEmailSignup = async () => {
  if (!signupEmail.endsWith('@usc.edu')) {
    alert('Must be a @usc.edu email');
    return;
  }
  
  if (!passwordValid) {
    alert('Password does not meet requirements');
    return;
  }
  
  setLoading(true);
  
  try {
    // Step 1: Create guest account first (no email)
    const res1 = await fetch('.../auth/guest-usc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'TempUser', // Will be set in onboarding
        gender: 'unspecified', // Will be set in onboarding
        // No invite code needed for USC email signup
      }),
    });
    
    const data1 = await res1.json();
    const tempToken = data1.sessionToken;
    setTempSessionToken(tempToken);
    
    // Step 2: Send verification code
    const res2 = await fetch('.../verification/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tempToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: signupEmail }),
    });
    
    if (!res2.ok) throw new Error('Failed to send code');
    
    // Show verification UI
    setShowEmailVerify(true);
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};
```

### STEP 5: Create handleEmailVerified Function

```typescript
const handleEmailVerified = async () => {
  try {
    // Link email and password to account
    const res = await fetch('.../auth/link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tempSessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: signupEmail,
        password: signupPassword,
      }),
    });
    
    if (!res.ok) throw new Error('Failed to link account');
    
    // Save session
    saveSession({
      sessionToken: tempSessionToken,
      userId: tempUserId,
      accountType: 'permanent',
    });
    
    // Redirect to onboarding for name/photo/video
    setShowEmailSignup(false);
    router.push('/onboarding');
  } catch (err) {
    alert(err.message);
  }
};
```

## BACKEND CHANGES NEEDED

### Check if /auth/guest-usc allows no name/gender

Current (server/src/auth.ts line 469-475):
```typescript
if (!name || !name.trim()) {
  return res.status(400).json({ error: 'Name is required' });
}
```

Problem: Email signup doesn't have name yet!

Solution: Make name/gender optional for email signup path:
```typescript
// Allow placeholder values for email signup (will be set in onboarding)
const userName = name?.trim() || 'User';
const userGender = gender || 'unspecified';
```

## ONBOARDING PROTECTION CHANGES

File: app/onboarding/page.tsx line 76-146

Current check:
```typescript
const hasInviteCode = inviteParam || storedInvite;
const hasUscScan = tempUsc;
const hasEmailToVerify = uscEmailForVerification;

if (!hasInviteCode && !hasUscScan && !session && !hasEmailToVerify) {
  router.push('/waitlist');
  return;
}
```

Need to add:
```typescript
const hasEmailSignupSession = sessionStorage.getItem('email_signup_session');

if (!hasInviteCode && !hasUscScan && !session && !hasEmailToVerify && !hasEmailSignupSession) {
  router.push('/waitlist');
  return;
}
```

## COMPLETE FLOW

### USC Email Signup Flow:

```
Waitlist Page
    ↓
Click "Scan to Sign Up"
    ↓
Choose "Scan USC Card"
    ↓
USC Scanner Opens
    ↓
User Clicks "Skip to Email" (bottom button)
    ↓
Email Signup Modal Opens
    ↓
Enter @usc.edu email + password
Click "Send Verification Code"
    ↓
Backend:
1. POST /auth/guest-usc { name: 'TempUser', gender: 'unspecified' }
2. Returns sessionToken
3. POST /verification/send { email }
4. Sends 6-digit code
    ↓
Frontend:
- Shows EmailVerification component
- User enters 6-digit code
    ↓
Backend:
- POST /verification/verify { code }
- Validates code
    ↓
Frontend:
- POST /auth/link { email, password, sessionToken }
- Account upgraded to permanent
- Save session
- Redirect to /onboarding
    ↓
Onboarding:
- Has session → Protection allows access
- Step 1: Enter REAL name (updates account)
- Step 2: Photo
- Step 3: Video
- Skip permanent (already permanent)
    ↓
Main App
```

## FILES TO MODIFY

1. ✅ app/waitlist/page.tsx (add modal + handlers)
2. ✅ app/onboarding/page.tsx (update protection)
3. ✅ server/src/auth.ts (make name/gender optional)
4. Import PasswordInput component
5. Import EmailVerification component

## EDGE CASES

1. User cancels email signup → Goes back to waitlist ✅
2. Email verification fails → Show error, allow retry ✅
3. User closes during verification → Session saved, can resume ✅
4. Non-USC email → Validation blocks ✅
5. Weak password → Validation blocks ✅
6. Duplicate email → Backend blocks ✅

## ESTIMATE

Lines of Code: ~150 lines
Files Modified: 3 files
Time: 45 minutes
Complexity: Medium (reusing existing components)

Ready to implement!
