# USC Email Verification Setup Guide

## Overview
Admin code users (USC students) must verify their @usc.edu email address before accessing the platform. This prevents unauthorized use of restricted invite codes.

---

## Requirements

### 1. SendGrid Account
1. Sign up at [SendGrid.com](https://sendgrid.com/)
2. Create an API key:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Give it full access (or at least Mail Send access)
   - Copy the API key (you'll only see it once!)

### 2. Environment Variables

Add to `server/.env`:
```bash
SENDGRID_API_KEY=SG.your_actual_api_key_here
FROM_EMAIL=noreply@bumpin.com
```

**Note**: If SendGrid is not configured, the system will log warnings but won't crash. Email verification will fail silently.

---

## How It Works

### Flow for Admin Code Users:
```
1. User enters name + invite code
2. Server detects: This is an admin code (requires USC email)
3. Frontend shows USC email input field
4. User enters their @usc.edu email
5. Account created (unverified)
6. → Email verification step shown
7. User clicks "Send Verification Code"
8. SendGrid sends 6-digit code to USC email
9. User enters code
10. Server verifies code
11. Email marked as verified
12. User proceeds to selfie upload
```

### Flow for Regular Users:
```
1. User enters name + regular invite code (or pays)
2. Skip email verification entirely
3. Proceed directly to selfie upload
```

---

## Implementation Details

### Backend Routes
- **POST `/verification/send`** - Sends verification code to email
  - Requires: session token (Authorization header)
  - Body: `{ email: string }`
  - Generates 6-digit code
  - Sends via SendGrid
  - Code expires in 10 minutes
  - Max 3 attempts per hour

- **POST `/verification/verify`** - Verifies the code
  - Requires: session token (Authorization header)
  - Body: `{ code: string }`
  - Marks email as verified
  - Clears verification code

### Frontend Components
- **`EmailVerification.tsx`** - Complete verification UI
  - Send code button
  - 6-digit code input
  - 10-minute countdown
  - Resend functionality
  - Error handling

### Database Fields
- `email` - User's email address
- `verification_code` - 6-digit code (stored temporarily)
- `verification_code_expires_at` - Expiration timestamp
- `verification_attempts` - Rate limiting (max 3/hour)
- `email_verified` - Boolean flag

---

## Testing

### 1. With SendGrid Configured:

```bash
# Start server
cd server && npm run dev

# Start frontend
npm run dev

# Test flow:
1. Get an admin invite code (type: 'admin' in database)
2. Go to: http://localhost:3000/onboarding?inviteCode=ADMINCODE123
3. Enter name + gender
4. System should show USC email field
5. Enter your-test@usc.edu
6. Click Continue
7. Should see "Verify your USC email" screen
8. Click "Send Verification Code"
9. Check your inbox for 6-digit code
10. Enter code
11. Should proceed to selfie step
```

### 2. Without SendGrid (Silent Fail):

```bash
# Don't set SENDGRID_API_KEY

# Result:
- System logs: "[Email] SendGrid not configured"
- User sees: "Failed to send email" error
- Doesn't break the app
- Admin can manually verify users in database if needed
```

---

## SendGrid Email Template

The verification email includes:
- Subject: "Verify your BUMPIn account"
- User's name
- 6-digit code (large, centered)
- "Expires in 10 minutes" warning
- Professional HTML styling

Example:
```
Hi John,

Your verification code is:

  1 2 3 4 5 6

Expires in 10 minutes.

Ignore if you didn't request this.
```

---

## Security Features

1. **Rate Limiting**: Max 3 codes per hour per user
2. **Code Expiration**: 10 minutes per code
3. **Single Use**: Code deleted after successful verification
4. **Session Required**: Must be authenticated to request/verify
5. **Format Validation**: Must be exactly @usc.edu domain

---

## Troubleshooting

### "Failed to send email"
- Check SENDGRID_API_KEY is set correctly
- Verify API key has Mail Send permission
- Check SendGrid dashboard for errors
- Ensure FROM_EMAIL is verified in SendGrid

### "Invalid code"
- Code may have expired (10 min limit)
- User may have typed it wrong
- Rate limit may have been hit (3 attempts)

### User stuck on verification step
- Admin can manually set `email_verified = true` in database
- Or reset verification attempts: `verification_attempts = 0`

---

## Production Deployment

1. Set SendGrid API key in Railway/Vercel environment variables
2. Verify FROM_EMAIL domain in SendGrid (if using custom domain)
3. Test email delivery in production environment
4. Monitor SendGrid dashboard for delivery stats
5. Set up email alerts for failures

---

## Cost

- **SendGrid Free Tier**: 100 emails/day (sufficient for small scale)
- **Paid Plans**: Start at $15/month for 40,000 emails

---

## Alternative: Email Verification Without SendGrid

If you don't want to use SendGrid, you can:
1. Use another email service (Mailgun, AWS SES, etc.)
2. Update `server/src/email.ts` to use different provider
3. Or skip email verification and manually verify USC students

---

**Last Updated**: October 24, 2025

