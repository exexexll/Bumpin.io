COMPLETE PAYMENT CODE SCAN - STRIPE TO PATREON MIGRATION
=========================================================

Scanning all payment-related code...

## BACKEND FILES (server/src/)

### 1. payment.ts (PRIMARY FILE)
Lines to analyze:
- 1-14: Stripe imports and initialization
- 48-96: POST /payment/create-checkout (Stripe checkout creation)
- 98-217: POST /payment/webhook (Stripe webhook handler)
- 219-319: POST /payment/apply-code (invite code application)
- 321-387: POST /payment/validate-code (code validation)
- 389-466: GET /payment/status (payment status check)
- 468-510: POST /payment/admin/generate-code (admin QR generation)
- 512-558: GET /payment/admin/codes (list invite codes)
- 560-603: GET /payment/qr/:code (QR code image generation)

### 2. index.ts
Lines to check:
- Stripe webhook route registration
- CORS settings for Stripe
- Payment route mounting

### 3. types.ts
Lines to check:
- User.paidStatus type
- Payment-related interfaces

### 4. store.ts
Lines to check:
- User.paidStatus updates
- Payment tracking methods

---

## FRONTEND FILES (app/)

### 1. paywall/page.tsx
Purpose: Shows payment options to unpaid users
Needs: Complete replacement with Patreon button

### 2. payment-success/page.tsx
Purpose: Stripe checkout success page
Needs: Replace with Patreon callback handler

### 3. onboarding/page.tsx
Lines to check:
- Payment redirect logic
- paidStatus checks
- Paywall bypass conditions

### 4. main/page.tsx
Lines to check:
- Payment status verification
- Paywall redirect logic

### 5. settings/page.tsx
Lines to check:
- Payment status display
- Account type checks

---

Analyzing each file in detail...
