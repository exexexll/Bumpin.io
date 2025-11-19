# Email Verification Complete Flow Trace

## USC Email Signup Flow:

### Step 1: User enters email (waitlist page)
- Input: hlyan@usc.edu
- Clicks "Sign Up with USC Email"

### Step 2: Create guest account (auth.ts)
Endpoint: POST /auth/guest-usc
- name: "temp" 
- gender: "unspecified"
- inviteCode: undefined (not required for USC email)
- email: "hlyan@usc.edu"

Returns: { sessionToken, userId }

### Step 3: Send verification code
Endpoint: POST /verification/send
Headers: Authorization: Bearer {sessionToken}
Body: { email: "hlyan@usc.edu" }

Checks:
1. getUserByEmail("hlyan@usc.edu") - Line 26
2. pending_email check - Line 36 (NEW)

### Step 4: User enters code
Frontend: EmailVerification component
Calls: POST /verification/verify

### Step 5: Link account
Endpoint: POST /auth/link
Body: { sessionToken, email, password }

## Where 409 Could Happen:

Location 1: verification/send line 26-32
- getUserByEmail finds existing user
- AFTER delete, should not find

Location 2: verification/send line 36-47 (NEW)
- pending_email check finds another user
- Deleted user's pending_email should be gone

Location 3: verification/verify line 95-100
- Another check for email conflicts
- Should also be clear after delete

The question: Is getUserByEmail still finding deleted user?
Or is pending_email still there?

Need to check what getUserByEmail returns AFTER delete...
