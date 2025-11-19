# Email Deletion Issue Diagnosis

## Issue:
After deleting account, can't sign up again with same email.
Gets 409 error: "Failed to send verification code"

## Checking:

### 1. Delete Account Endpoint (server/src/user.ts)
Does it delete the user from database?
  → YES: Line 125: DELETE FROM users WHERE user_id = $1
  → CASCADE should handle all related records

### 2. Database Schema
Email fields:
  - users.email UNIQUE - Main email field
  - users.pending_email - Email waiting verification
  - verification_codes table - Might have orphaned codes

### 3. Potential Issues:

#### Issue A: CASCADE not working
If usc_card_registrations or other tables don't have CASCADE,
delete might fail silently.

#### Issue B: Verification codes table
verification_codes might not have ON DELETE CASCADE.
Old codes might block re-signup.

#### Issue C: pending_email not cleared
If user started signup but didn't finish,
pending_email might persist somewhere.

#### Issue D: SendGrid/Email service
Email service might cache/block recently used emails.

Let me check which one...
