# USC Email Verification - Testing Guide

## Prerequisites

### 1. Environment Setup
```bash
# Server environment variables (.env)
SENDGRID_API_KEY=SG.your_actual_key_here
FROM_EMAIL=noreply@bumpin.com
DATABASE_URL=postgresql://...

# Or set in Railway/Vercel dashboard
```

### 2. Create Admin Invite Code

```sql
-- Connect to your database
psql $DATABASE_URL

-- Insert admin code
INSERT INTO invite_codes (code, created_by, created_by_name, type, max_uses, uses_remaining, is_active)
VALUES ('USC2025TESTCODE', 'admin', 'System Admin', 'admin', 100, 100, true);
```

Or use the admin interface to generate one.

---

## Test Scenarios

### ✅ Test 1: Happy Path (USC Student)

**Steps:**
1. Start servers:
   ```bash
   npm run dev  # Starts both frontend and backend
   ```

2. Navigate to onboarding with admin code:
   ```
   http://localhost:3000/onboarding?inviteCode=USC2025TESTCODE
   ```

3. Enter name (e.g., "John Doe")

4. Select gender

5. **USC Email Field Should Appear** (blue box)

6. Enter USC email: `john.doe@usc.edu`

7. Check Terms of Service checkbox

8. Click "Continue"

9. **Email Verification Screen Should Appear**
   - Title: "Verify your USC email"
   - Shows email address
   - "Send Verification Code" button

10. Click "Send Verification Code"

11. Check email inbox for 6-digit code

12. Enter the 6-digit code

13. Click "Verify Code"

14. **Should proceed to selfie step** ✅

**Expected Database State:**
```sql
SELECT email, email_verified, paid_status FROM users WHERE email = 'john.doe@usc.edu';
-- email_verified: true
-- paid_status: 'paid' (admin codes get direct paid status)
```

---

### ✅ Test 2: Wrong Email Domain

**Steps:**
1-4. Same as Test 1

5. Enter non-USC email: `john@gmail.com`

6. Click "Continue"

**Expected Result:**
- ❌ Error: "Please enter a valid @usc.edu email address"
- Should stay on name step

---

### ✅ Test 3: Invalid Verification Code

**Steps:**
1-10. Same as Test 1 (up to code sent)

11. Enter wrong code: `000000`

12. Click "Verify Code"

**Expected Result:**
- ❌ Error: "Invalid code"
- Can try again (max 3 attempts per hour)

---

### ✅ Test 4: Expired Code

**Steps:**
1-10. Same as Test 1 (up to code sent)

11. Wait 11 minutes (code expires after 10 min)

12. Enter the original code

13. Click "Verify Code"

**Expected Result:**
- ❌ Error: "Code expired"
- Can request new code using "Resend code" button

---

### ✅ Test 5: Rate Limiting

**Steps:**
1-10. Same as Test 1

11. Click "Send Verification Code" 4 times rapidly

**Expected Result:**
- ❌ Error after 3rd attempt: "Too many attempts. Wait 1 hour."
- Prevents spam/abuse

---

### ✅ Test 6: Navigation Blocking During Verification

**Steps:**
1-9. Navigate to email verification screen

10. Try to press Back button

**Expected Result:**
- Alert: "Please complete your profile before navigating away."
- Should stay on verification page

11. Try to close tab (Cmd+W)

**Expected Result:**
- Browser warning: "Your profile is not complete yet. Are you sure you want to leave?"

12. Try to refresh page (Cmd+R)

**Expected Result:**
- Browser warning appears
- If user proceeds, should resume at email verification step (session preserved)

---

### ✅ Test 7: Regular Invite Code (No Email Verification)

**Steps:**
1. Create regular user invite code:
   ```sql
   INSERT INTO invite_codes (code, created_by, created_by_name, type, max_uses, uses_remaining)
   VALUES ('REGULAR4USES123', 'user-id-here', 'Jane Smith', 'user', 4, 4, true);
   ```

2. Navigate:
   ```
   http://localhost:3000/onboarding?inviteCode=REGULAR4USES123
   ```

3. Enter name + gender

4. **Should NOT see USC email field**

5. Click "Continue"

6. **Should skip email verification**

7. **Should go directly to selfie step** ✅

---

### ✅ Test 8: SendGrid Not Configured (Graceful Failure)

**Steps:**
1. Remove SENDGRID_API_KEY from environment

2. Restart server

3. Follow Test 1 steps

4. Click "Send Verification Code"

**Expected Result:**
- Server logs: `[Email] SendGrid not configured`
- User sees: ❌ "Failed to send email"
- App doesn't crash ✅

**Manual Workaround:**
```sql
-- Admin can manually verify user
UPDATE users 
SET email_verified = true 
WHERE email = 'john.doe@usc.edu';
```

---

### ✅ Test 9: Account Resume After Verification

**Steps:**
1. Complete email verification (Test 1)

2. Close browser tab before completing selfie

3. Return to `/onboarding`

**Expected Result:**
- Should resume at selfie step (email already verified)
- Should NOT ask to verify email again ✅

---

### ✅ Test 10: Multiple Users Same Email (Prevented)

**Steps:**
1. User A verifies `john@usc.edu`

2. User B tries to use `john@usc.edu`

**Expected Result:**
- ❌ Should fail validation (email already in use)
- USC email domain check happens server-side

---

## Debug Commands

### Check User Status
```sql
SELECT user_id, name, email, email_verified, verification_code, verification_code_expires_at, verification_attempts, paid_status
FROM users 
WHERE email LIKE '%@usc.edu';
```

### Reset Verification Attempts
```sql
UPDATE users 
SET verification_attempts = 0,
    verification_code = NULL,
    verification_code_expires_at = NULL
WHERE email = 'john.doe@usc.edu';
```

### Manually Verify Email
```sql
UPDATE users 
SET email_verified = true,
    verification_code = NULL
WHERE email = 'john.doe@usc.edu';
```

### Check SendGrid Logs
- Go to SendGrid dashboard
- Activity → Activity Feed
- Search for recipient email
- Check delivery status

---

## Common Issues & Solutions

### Issue: "Failed to send email"
**Causes:**
1. SENDGRID_API_KEY not set
2. Invalid API key
3. FROM_EMAIL not verified in SendGrid
4. Rate limit hit (SendGrid free tier)

**Solution:**
- Check environment variables
- Verify SendGrid dashboard shows no errors
- Check SendGrid activity feed

---

### Issue: User stuck on verification step
**Causes:**
1. Email never arrived (spam folder?)
2. Code expired
3. Rate limit hit

**Solution:**
```sql
-- Reset user's verification state
UPDATE users 
SET verification_attempts = 0,
    verification_code = NULL,
    verification_code_expires_at = NULL,
    email_verified = true
WHERE email = 'stuck-user@usc.edu';
```

---

### Issue: Navigation blocking too aggressive
**Behavior:**
- Keyboard shortcuts blocked
- Back button trapped
- Continuous history push

**Note:** This is intentional! Prevents incomplete profiles.

**Override (for testing):**
```javascript
// In browser console
localStorage.setItem('bypass_onboarding', 'true');
// Then refresh page
```

---

## Production Checklist

Before deploying:

- [ ] SENDGRID_API_KEY set in production environment
- [ ] FROM_EMAIL verified in SendGrid (if custom domain)
- [ ] Test email delivery in production
- [ ] Admin codes created in production database
- [ ] Rate limiting tested (3 attempts per hour)
- [ ] Navigation blocking tested on mobile browsers
- [ ] Email templates look good on mobile/desktop
- [ ] Spam folder checked (send test emails)
- [ ] SendGrid alerts configured for failures

---

## Performance Notes

- Email sending is async (doesn't block UI)
- Verification codes stored in database (not in-memory)
- Rate limiting prevents abuse
- Code expiration prevents replay attacks

---

**Last Updated**: October 24, 2025

