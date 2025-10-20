# 📱 Twilio Setup - Email & SMS Verification

**Complete setup for SendGrid (email) and Twilio SMS**

---

## Part 1: SendGrid Email (15 minutes)

### Step 1: Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up (email, password)
3. Verify phone number
4. Get $15 free trial credit

### Step 2: Access SendGrid (via Twilio)
1. Login to Twilio Console
2. **Left sidebar** → Click **"SendGrid Email API"**
3. Or go directly to: https://app.sendgrid.com

### Step 3: Create SendGrid API Key
1. **Left sidebar** → **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name: `Napalm Sky Production`
4. Permissions: **Full Access** (or Restricted: Mail Send)
5. Click **"Create & View"**
6. **COPY THE KEY** (starts with `SG.`)
   - ⚠️ You can only see it once!
   - Store securely

### Step 4: Verify Sender Domain
1. **Left sidebar** → **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"** (quick) OR
3. Click **"Authenticate Your Domain"** (professional)

**Option A - Single Sender (Quick):**
- Email: `noreply@napalmsky.com`
- From Name: `Napalm Sky`
- Reply To: `support@napalmsky.com`
- Click email verification link

**Option B - Domain Authentication (Professional):**
- Domain: `napalmsky.com`
- Add DNS records (CNAME, TXT)
- Verify in SendGrid

### Step 5: Add to Railway
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@napalmsky.com
```

**Cost:** FREE (100 emails/day), then $15/month (40K emails)

---

## Part 2: Twilio SMS (Optional - 10 minutes)

### Step 1: Get Phone Number
1. Twilio Console → **Phone Numbers**
2. Click **"Buy a number"**
3. Select country (US)
4. Check **SMS** capability
5. Search and buy (~$1.15/month)

### Step 2: Get Credentials
1. Twilio Console → **Dashboard**
2. Find **Account SID** (starts with `AC`)
3. Find **Auth Token** (click to reveal)
4. Copy both

### Step 3: Add to Railway
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

**Cost:** $1.15/month + $0.0079 per SMS

---

## Part 3: Test Email Verification

1. Run database migration
2. Deploy with SENDGRID_API_KEY
3. Sign up on site
4. Enter email on permanent account step
5. Click "Send Verification Code"
6. Check email inbox
7. Enter 6-digit code
8. Should verify ✅

---

## Summary

**SendGrid (Email):**
- Account: Twilio/SendGrid
- API Key: Starts with `SG.`
- Cost: FREE tier available

**Twilio SMS (Optional):**
- Phone number: ~$1.15/month
- Per SMS: ~$0.0079
- Use for high-security needs

**Railway Variables:**
```bash
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@napalmsky.com
TWILIO_ACCOUNT_SID=ACxxx (optional)
TWILIO_AUTH_TOKEN=xxx (optional)
TWILIO_PHONE_NUMBER=+1xxx (optional)
```

