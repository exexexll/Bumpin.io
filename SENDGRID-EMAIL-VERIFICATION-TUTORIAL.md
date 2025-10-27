# SendGrid Email Verification Setup Tutorial

**Platform**: BUMPIN  
**Date**: October 27, 2025  
**Status**: Production-Ready Implementation

---

## 📋 Table of Contents

1. [SendGrid Account Setup](#1-sendgrid-account-setup)
2. [API Key Configuration](#2-api-key-configuration)
3. [Environment Variables](#3-environment-variables)
4. [Code Implementation](#4-code-implementation)
5. [Testing](#5-testing)
6. [Troubleshooting](#6-troubleshooting)
7. [Production Checklist](#7-production-checklist)

---

## 1. SendGrid Account Setup

### Step 1: Create SendGrid Account
1. Go to **https://sendgrid.com**
2. Click "Start for Free"
3. Sign up with your email
4. Verify your email address
5. Complete the onboarding questionnaire

**Free Tier**: 100 emails/day (sufficient for development)  
**Paid Tier**: Starts at $19.95/month for 50,000 emails

### Step 2: Sender Authentication
**CRITICAL**: You MUST verify your sender identity

#### Option A: Single Sender Verification (Easiest for Development)
1. Navigate to **Settings → Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Enter:
   - **From Name**: BUMPIN
   - **From Email Address**: noreply@napalmsky.com (or your domain)
   - **Reply To**: everything@napalmsky.com
   - **Company Address**: Your address
4. Click **"Create"**
5. Check your email and click verification link
6. ✅ Sender verified!

#### Option B: Domain Authentication (Recommended for Production)
1. Navigate to **Settings → Sender Authentication**
2. Click **"Authenticate Your Domain"**
3. Enter your domain: **napalmsky.com**
4. Add DNS records to your domain provider:
   ```
   Type: CNAME
   Host: em1234.napalmsky.com
   Value: u1234567.wl123.sendgrid.net
   
   Type: CNAME
   Host: s1._domainkey.napalmsky.com
   Value: s1.domainkey.u1234567.wl123.sendgrid.net
   
   Type: CNAME
   Host: s2._domainkey.napalmsky.com
   Value: s2.domainkey.u1234567.wl123.sendgrid.net
   ```
5. Wait 24-48 hours for DNS propagation
6. Click **"Verify"** in SendGrid dashboard
7. ✅ Domain authenticated!

---

## 2. API Key Configuration

### Step 1: Create API Key
1. Navigate to **Settings → API Keys**
2. Click **"Create API Key"**
3. Enter name: **BUMPIN Production** (or Development)
4. Select **"Full Access"** (or "Restricted Access" with Mail Send permission)
5. Click **"Create & View"**
6. **CRITICAL**: Copy the API key NOW (you can't see it again!)
   ```
   SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 2: Test API Key
```bash
curl -X "POST" "https://api.sendgrid.com/v3/mail/send" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "personalizations": [{"to": [{"email": "your-test@email.com"}]}],
       "from": {"email": "noreply@napalmsky.com", "name": "BUMPIN"},
       "subject": "Test Email",
       "content": [{"type": "text/plain", "value": "This is a test!"}]
     }'
```

**Expected Response**: `202 Accepted`

---

## 3. Environment Variables

### Railway Setup (Production)
1. Open **Railway Dashboard**
2. Select your **BUMPIN Backend** project
3. Go to **Variables** tab
4. Add new variable:
   - **Key**: `SENDGRID_API_KEY`
   - **Value**: `SG.xxxxxxxxxxxxxxxxxx` (paste your API key)
5. Add sender email:
   - **Key**: `EMAIL_FROM`
   - **Value**: `noreply@napalmsky.com`
6. Click **"Deploy"** to restart server

### Local Development (.env)
Create `.env` file in `/server` directory:
```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@napalmsky.com

# Other existing variables
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

**SECURITY**: Never commit `.env` to git!

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

---

## 4. Code Implementation

### Current Implementation Status

**✅ Already Implemented**:
- Email verification code generation (6 digits)
- Verification code storage in database
- SendGrid email sending
- Verification endpoint
- USC admin code auto-verification
- Email verification UI in onboarding

**📂 Files Involved**:
- `server/src/email.ts` - SendGrid integration
- `server/src/auth.ts` - Registration routes
- `server/src/onboarding.ts` - Onboarding endpoints
- `app/onboarding/page.tsx` - Frontend UI
- `server/schema.sql` - Database schema

### Email Service (`server/src/email.ts`)

**Current Code** (already exists):
```typescript
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@napalmsky.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('[Email] SendGrid configured');
} else {
  console.warn('[Email] SENDGRID_API_KEY not set - emails will not be sent');
}

export async function sendVerificationEmail(
  toEmail: string,
  code: string,
  userName: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('[Email] SendGrid not configured, skipping email send');
    return false;
  }

  const msg = {
    to: toEmail,
    from: {
      email: EMAIL_FROM,
      name: 'BUMPIN',
    },
    subject: 'Verify your BUMPIN email',
    text: `Hi ${userName},\n\nYour verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\n- BUMPIN Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ffc46a;">Welcome to BUMPIN</h1>
        <p>Hi ${userName},</p>
        <p>Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666;">This code expires in 15 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">- BUMPIN Team</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email] Verification email sent to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send:', error.response?.body || error.message);
    return false;
  }
}
```

### Verification Logic (`server/src/onboarding.ts`)

**Key Points**:
1. **Email Entered**: Generate 6-digit code
2. **Send Email**: Via SendGrid
3. **Store Code**: In database with 15-min expiry
4. **USC Admin Code**: Auto-verifies (no email needed)
5. **Verify Code**: Check against database
6. **Mark Verified**: Update `email_verified` column

**Code Snippet** (already exists):
```typescript
// Generate verification code
const code = Math.floor(100000 + Math.random() * 900000).toString();
const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

// Store in database
await query(`
  INSERT INTO email_verifications (email, code, expires_at, user_id)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (email) DO UPDATE SET
    code = $2, expires_at = $3, user_id = $4, created_at = NOW()
`, [email, code, expiresAt, userId]);

// Send email
const sent = await sendVerificationEmail(email, code, name);

// Verify code endpoint
router.post('/verify-email', requireAuth, async (req: any, res) => {
  const { code } = req.body;
  const userId = req.userId;
  
  // Check code in database
  const result = await query(`
    SELECT * FROM email_verifications 
    WHERE user_id = $1 AND code = $2 AND expires_at > $3
  `, [userId, code, Date.now()]);
  
  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }
  
  // Mark user as verified
  await query(`
    UPDATE users SET email_verified = TRUE WHERE user_id = $1
  `, [userId]);
  
  // Delete used code
  await query(`DELETE FROM email_verifications WHERE user_id = $1`, [userId]);
  
  res.json({ success: true });
});
```

---

## 5. Testing

### Test Verification Flow

#### Step 1: Test Email Sending
1. Set `SENDGRID_API_KEY` in Railway
2. Register new account with your email
3. Check your inbox for verification code
4. Check spam folder if not received

#### Step 2: Test Code Verification
1. Enter the 6-digit code
2. Should show success message
3. Account should be upgraded from guest

#### Step 3: Test USC Admin Code
1. Register with `everything@usc.edu`
2. Admin code `000000` should auto-verify
3. No email should be sent
4. Should skip to next step immediately

#### Step 4: Test Expiry
1. Request verification code
2. Wait 16 minutes
3. Try to verify with old code
4. Should show "expired" error
5. Request new code

### SendGrid Dashboard Monitoring
1. Navigate to **Activity → Email Activity**
2. See all sent emails
3. Check delivery status:
   - ✅ **Delivered**: Success
   - ⚠️ **Processed**: In transit
   - ❌ **Bounced**: Invalid email
   - ❌ **Dropped**: Spam/blocked

### Test Checklist
- [ ] Email sends successfully
- [ ] Code arrives within 1 minute
- [ ] Code is 6 digits
- [ ] Correct code verifies successfully
- [ ] Wrong code shows error
- [ ] Expired code (15+ min) shows error
- [ ] USC admin code auto-verifies
- [ ] Email HTML renders correctly
- [ ] Spam score is low (check SendGrid)

---

## 6. Troubleshooting

### Problem: Emails Not Sending

**Check 1: API Key Valid?**
```bash
# Test API key
curl -X GET "https://api.sendgrid.com/v3/api_keys" \
     -H "Authorization: Bearer YOUR_API_KEY"
```
**Expected**: `200 OK` with key details  
**If 401**: API key is invalid, regenerate

**Check 2: Sender Verified?**
- Go to SendGrid → Sender Authentication
- Ensure status is "Verified" ✅
- If not, verify single sender or domain

**Check 3: Environment Variable Set?**
```bash
# Railway: Check Variables tab
# Local: echo $SENDGRID_API_KEY
```

**Check 4: Server Logs**
```bash
# Railway: View Deployments → Logs
# Look for: "[Email] SendGrid configured"
# Or: "[Email] SENDGRID_API_KEY not set"
```

### Problem: Emails Go to Spam

**Solution 1: Domain Authentication**
- Use domain authentication instead of single sender
- Add SPF, DKIM, DMARC records

**Solution 2: Improve Content**
- Avoid spam trigger words ("free", "click here", "urgent")
- Don't use ALL CAPS
- Include unsubscribe link (for marketing emails)
- Use plain text + HTML versions

**Solution 3: Warm Up Domain**
- Start with small volume (10-20/day)
- Gradually increase over 2-3 weeks
- Monitor bounce/spam rates

### Problem: Code Not Verifying

**Check 1: Case Sensitive?**
- Codes are numeric only (6 digits)
- No case sensitivity issues

**Check 2: Expired?**
- Codes expire after 15 minutes
- Request new code if expired

**Check 3: Database Entry?**
```sql
SELECT * FROM email_verifications WHERE email = 'test@example.com';
```
- Should show code and expiry timestamp
- If not, code generation failed

**Check 4: User ID Match?**
- Code tied to specific user
- Can't use someone else's code

### Problem: Rate Limiting

**SendGrid Free Tier**: 100 emails/day  
**If Exceeded**: Emails will queue until next day

**Solution**:
- Upgrade to paid plan ($19.95/mo for 50k emails)
- Or implement daily limit warning
- Or use email verification only for permanent accounts

---

## 7. Production Checklist

### Before Launch
- [ ] SendGrid account created
- [ ] Sender identity verified (single sender or domain)
- [ ] API key generated
- [ ] `SENDGRID_API_KEY` set in Railway
- [ ] `EMAIL_FROM` set in Railway
- [ ] Test email sent successfully
- [ ] Email arrives in inbox (not spam)
- [ ] HTML rendering looks good
- [ ] Verification flow works end-to-end
- [ ] USC admin code auto-verifies
- [ ] Error messages are user-friendly
- [ ] Database has `email_verifications` table
- [ ] `.env` file in `.gitignore`

### Monitoring
- [ ] Set up SendGrid alerts (bounce rate, spam rate)
- [ ] Monitor email activity daily
- [ ] Check spam complaints
- [ ] Watch for bounce patterns
- [ ] Keep bounce rate < 5%
- [ ] Keep spam rate < 0.1%

### Compliance
- [ ] Privacy policy mentions email use
- [ ] Terms mention verification requirement
- [ ] Unsubscribe link (if sending marketing emails)
- [ ] GDPR compliance (EU users)
- [ ] CAN-SPAM compliance (US users)

---

## 8. Cost Estimation

### SendGrid Pricing
- **Free**: 100 emails/day forever
- **Essentials**: $19.95/mo for 50,000 emails/mo
- **Pro**: $89.95/mo for 100,000 emails/mo

### BUMPIN Usage Estimate
**Assumptions**:
- 1000 new users/month
- Each gets 1 verification email
- 10% request resend (100 extra emails)
- **Total**: 1,100 emails/month

**Recommended Plan**: Free tier (sufficient)  
**Upgrade When**: 3,000+ new users/month

---

## 9. Alternative Email Providers

If SendGrid doesn't work for you:

### Option 1: Resend (Recommended Alternative)
- **Free**: 3,000 emails/month
- **Paid**: $20/mo for 50,000 emails
- **Pros**: Modern API, great docs, generous free tier
- **Setup**: Similar to SendGrid

### Option 2: Mailgun
- **Free**: 5,000 emails/month (first 3 months)
- **Paid**: $35/mo for 50,000 emails
- **Pros**: Reliable, good deliverability

### Option 3: Amazon SES
- **Cost**: $0.10 per 1,000 emails
- **Pros**: Very cheap, scales infinitely
- **Cons**: Harder to set up, requires AWS account

### Option 4: Postmark
- **Free**: 100 emails/month
- **Paid**: $15/mo for 10,000 emails
- **Pros**: Best deliverability, transactional focus
- **Cons**: More expensive

---

## 10. Email Templates

### Welcome Email (After Verification)
```typescript
export async function sendWelcomeEmail(
  toEmail: string,
  userName: string
): Promise<boolean> {
  const msg = {
    to: toEmail,
    from: { email: EMAIL_FROM, name: 'BUMPIN' },
    subject: 'Welcome to BUMPIN! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ffc46a;">Welcome to BUMPIN, ${userName}! 🎉</h1>
        <p>Your email has been verified successfully.</p>
        <p>You can now:</p>
        <ul>
          <li>Match with people nearby</li>
          <li>Start video or text chats</li>
          <li>Get your own invite codes</li>
        </ul>
        <p><a href="https://napalmsky.com/main" style="background: #ffc46a; color: #0a0a0c; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">Start Matching</a></p>
        <p>Happy connecting!</p>
        <p>- BUMPIN Team</p>
      </div>
    `,
  };
  
  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('[Email] Welcome email failed:', error);
    return false;
  }
}
```

### Password Reset Email (Future)
```typescript
export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `https://napalmsky.com/reset-password?token=${resetToken}`;
  
  const msg = {
    to: toEmail,
    from: { email: EMAIL_FROM, name: 'BUMPIN' },
    subject: 'Reset your BUMPIN password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Reset Your Password</h1>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="background: #ffc46a; color: #0a0a0c; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };
  
  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('[Email] Password reset email failed:', error);
    return false;
  }
}
```

---

## ✅ Summary

**Your BUMPIN platform already has email verification fully implemented!**

**To Enable**:
1. Create SendGrid account (5 minutes)
2. Verify sender identity (5 minutes)
3. Get API key (1 minute)
4. Add to Railway variables (1 minute)
5. **Total Setup Time**: ~12 minutes

**Current Status**:
- ✅ Code implemented
- ✅ Database tables exist
- ✅ Frontend UI ready
- ⚠️ Just needs SendGrid API key

**After Setup**:
- Users get 6-digit code via email
- Code expires in 15 minutes
- USC admin code auto-verifies
- Guest accounts upgrade to permanent after verification

**Questions?**: everything@napalmsky.com

