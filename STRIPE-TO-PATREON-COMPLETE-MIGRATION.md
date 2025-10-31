STRIPE TO PATREON - COMPLETE MIGRATION GUIDE
============================================

## PART 1: ALL STRIPE CODE LOCATIONS

### BACKEND (server/src/)

#### payment.ts (PRIMARY FILE - 665 lines)
```
STRIPE CODE TO REPLACE:
=======================

Lines 1-14: Imports & Initialization
├─ Line 2: import Stripe from 'stripe';
├─ Line 12-14: const stripe = new Stripe(...)
└─ ACTION: Replace with Patreon OAuth client

Lines 48-96: POST /payment/create-checkout
├─ Creates Stripe checkout session
├─ Returns checkoutUrl
└─ ACTION: REMOVE (not needed for Patreon)

Lines 98-217: POST /payment/webhook  
├─ Handles Stripe webhook events
├─ Verifies signature
├─ Marks user as paid
├─ Generates invite code
└─ ACTION: Replace with Patreon OAuth callback

Lines 219-319: POST /payment/apply-code
├─ Apply invite code to user
└─ ACTION: KEEP (still needed for invite codes)

Lines 321-387: POST /payment/validate-code
├─ Validate invite code format
└─ ACTION: KEEP (still needed)

Lines 389-466: GET /payment/status
├─ Check user's payment/verification status
└─ ACTION: MODIFY (add patreon_verified check)

Lines 468-603: Admin & QR Code Routes
├─ Generate admin codes
├─ List codes
├─ Generate QR images
└─ ACTION: KEEP (still needed)
```

#### index.ts
```
Lines to modify:
- Line ~100: CORS webhook path (remove Stripe webhook)
- Line ~506: Payment routes mounting (keep)
```

#### types.ts
```
User interface:
- paidStatus: 'unpaid' | 'paid' | 'qr_verified' | 'qr_grace_period'
  
ACTION: Add 'patreon_verified'
- paidStatus: 'unpaid' | 'paid' | 'qr_verified' | 'qr_grace_period' | 'patreon_verified'

Add fields:
- patreonId?: string;
- patreonTier?: string;
- patreonAccessToken?: string;
- patreonRefreshToken?: string;
```

#### paywall-guard.ts
```
Lines 27-29: Check if user has verified access

MODIFY:
const hasAccess = user.paidStatus === 'paid' || 
                 user.paidStatus === 'qr_verified' || 
                 user.paidStatus === 'qr_grace_period' ||
                 user.paidStatus === 'patreon_verified'; // ADD THIS
```

---

### FRONTEND (app/)

#### paywall/page.tsx
```
CURRENT:
- Shows Stripe payment button
- Links to /payment/create-checkout

REPLACE WITH:
- Patreon OAuth button
- Invite code input
- USC card scan option
```

#### payment-success/page.tsx
```
CURRENT:
- Handles Stripe checkout success
- Verifies session_id

REPLACE WITH:
- Patreon OAuth callback handler
- Verifies Patreon membership
- Creates/updates user
```

#### onboarding/page.tsx
```
Lines 355-370: Payment redirect logic

MODIFY:
- Check if patreon_verified (skip paywall)
- Keep other verification methods
```

#### main/page.tsx
```
Lines 69-76: Payment status check

MODIFY:
const hasPaid = paymentData.paidStatus === 'paid' || 
                paymentData.paidStatus === 'qr_verified' || 
                paymentData.paidStatus === 'qr_grace_period' ||
                paymentData.paidStatus === 'patreon_verified'; // ADD
```

---

## PART 2: PATREON SETUP GUIDE

### Step 1: Create Patreon Creator Account (10 min)

1. Go to https://www.patreon.com/
2. Click "Create on Patreon"
3. Set up your creator page:
   - Name: "BUMPIN"
   - Description: "Support BUMPIN development and get instant access!"
   - Profile image: Your logo
   - Cover image: App screenshot

4. Create Membership Tier:
   - Click "Tiers" → "Create a tier"
   - Name: "Supporter"
   - Price: $3/month (Patreon minimum)
   - Benefits:
     * Instant app access (no invite needed)
     * Premium badge in profile
     * Early access to new features
     * Support development
   - Save tier

---

### Step 2: Register App in Developer Portal (5 min)

1. Go to https://www.patreon.com/portal/registration/register-clients
2. Click "Create Client"
3. Fill in details:
   - App Name: "BUMPIN"
   - Description: "1-1 Video Social Network"
   - App Category: "Social Networking"
   - Redirect URIs: 
     * https://napalmsky.com/patreon/callback
     * http://localhost:3000/patreon/callback (for development)
   - Client API Version: 2
   
4. Save and copy:
   - ✅ Client ID (save to .env)
   - ✅ Client Secret (save to .env)

---

### Step 3: Add Environment Variables

#### Railway (Backend)
```
PATREON_CLIENT_ID=your_client_id_here
PATREON_CLIENT_SECRET=your_client_secret_here
PATREON_REDIRECT_URI=https://napalmsky.com/patreon/callback
PATREON_CREATOR_ACCESS_TOKEN=your_creator_token_here
```

#### Local Development (.env)
```
PATREON_CLIENT_ID=your_client_id_here
PATREON_CLIENT_SECRET=your_client_secret_here
PATREON_REDIRECT_URI=http://localhost:3000/patreon/callback
```

---

## PART 3: CODE IMPLEMENTATION

### Backend: Install Patreon SDK
```bash
cd server
npm install patreon
npm install @types/patreon --save-dev
```

### Backend: Create patreon.ts
```
Create: server/src/patreon.ts (new file)
~300 lines of code
- OAuth routes
- Membership verification
- Status checking
```

### Backend: Modify payment.ts
```
REMOVE:
- Lines 1-14: Stripe imports (delete)
- Lines 48-96: create-checkout route (delete)
- Lines 98-217: webhook route (delete)

KEEP:
- Lines 219-603: Invite code routes (keep all)
```

### Frontend: Create Patreon Pages
```
Create: app/patreon/callback/page.tsx (new file)
Create: app/patreon/verify/page.tsx (new file)
```

### Frontend: Modify paywall/page.tsx
```
REPLACE Stripe button with:
- Patreon "Support & Get Access" button
- Invite code input (keep)
- USC card option (keep)
```

---

## PART 4: MIGRATION CHECKLIST

### Pre-Migration:
- [ ] Create Patreon creator account
- [ ] Set up $3/month tier
- [ ] Register app in developer portal
- [ ] Get Client ID & Secret
- [ ] Add environment variables

### Code Changes:
- [ ] Install patreon npm package
- [ ] Create server/src/patreon.ts
- [ ] Modify server/src/payment.ts (remove Stripe)
- [ ] Update server/src/types.ts (add patreon fields)
- [ ] Modify server/src/paywall-guard.ts (add patreon check)
- [ ] Create app/patreon/callback/page.tsx
- [ ] Modify app/paywall/page.tsx
- [ ] Modify app/main/page.tsx
- [ ] Modify app/onboarding/page.tsx

### Database:
- [ ] Add patreon columns to users table
- [ ] Create index on patreon_id

### Testing:
- [ ] Test Patreon OAuth flow
- [ ] Test membership verification
- [ ] Test access grant
- [ ] Test invite codes still work
- [ ] Test USC cards still work

---

## ESTIMATED EFFORT

Backend: 4-5 hours
Frontend: 3-4 hours
Testing: 2 hours
Total: ~10 hours

Files to create: 2
Files to modify: 8
Lines to add: ~500
Lines to remove: ~120

---

Ready to proceed with implementation?
