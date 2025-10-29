# 🎓 USC Campus Card Barcode Scanner - Complete Implementation Plan

## 📋 Testing Phase (DO THIS FIRST)

### **Test Files Created:**
1. `public/test-usc-card-scanner.html` - Simple scanner with html5-qrcode
2. `public/test-usc-advanced-scanner.html` - Advanced scanner with ZXing (RECOMMENDED)

### **How to Test:**

#### **Step 1: Open Test Scanner**
```bash
# Option A: Open directly in browser
open public/test-usc-advanced-scanner.html

# Option B: Via development server
npm run dev
# Then visit: http://localhost:3000/test-usc-advanced-scanner.html
```

#### **Step 2: Scan Your USC Card**
1. Click "📷 Start Camera"
2. Allow camera permission
3. Flip USC card to **BACK side** (where barcode is)
4. Hold barcode in the white guide box
5. Keep steady for 1-2 seconds
6. Scanner will auto-detect and show results

#### **Step 3: Record Benchmark Data**
After successful scan, record these values:

```
✅ BENCHMARK USC ID: _________________ (10 digits)
📊 Barcode Format: __________________ (CODE_128, CODE_39, etc.)
📏 Raw Barcode Value: _______________ (what scanner actually read)
✓ Validation Checks: ________________ (which checks passed)
```

#### **Step 4: Test Different Scenarios**
- [ ] Scan at different angles (flat, tilted)
- [ ] Scan in different lighting (bright, dim, backlit)
- [ ] Scan at different distances (6", 12", 18")
- [ ] Try front camera vs back camera
- [ ] Test on mobile (iPhone/Android)
- [ ] Test on desktop webcam

---

## 🔬 Analysis: What to Look For

### **From Test Results, Determine:**

1. **Barcode Format**
   - Most likely: CODE_128 (modern standard)
   - Possible: CODE_39 (older standard)
   - Record what your scanner detects

2. **Barcode Content**
   ```
   Examples:
   - Clean: "1268306021" (just the ID)
   - Prefixed: "USC1268306021" (with school code)
   - Extended: "12683060215156" (ID + card number)
   ```

3. **Extraction Logic**
   - Does raw value = USC ID exactly?
   - Or do we need to strip prefix/suffix?
   - Document the pattern

4. **Validation Rules**
   ```
   Based on your card (1268306021):
   - Length: 10 digits ✓
   - First digit: 1 (or 2 for some years?)
   - Range: 1000000000 - 9999999999
   - Pattern: All numeric
   ```

---

## 🎯 Implementation Plan (After Testing)

### **Phase 1: Library Selection**

Based on test results, choose best scanner:

| Library | Pros | Cons | Recommendation |
|---------|------|------|----------------|
| **@zxing/browser** | Native TS, best accuracy, maintained | Larger bundle | ⭐⭐⭐⭐⭐ BEST |
| **html5-qrcode** | Easy setup, good docs | Less accurate | ⭐⭐⭐⭐ Good |
| **quagga2** | Fast, lightweight | Complex config | ⭐⭐⭐ OK |

**Install winner:**
```bash
npm install @zxing/browser
# or
npm install html5-qrcode
```

---

### **Phase 2: Component Architecture**

```
components/
  ├─ usc-verification/
  │   ├─ USCWelcomePopup.tsx      - Welcome overlay (Step 0)
  │   ├─ USCCardScanner.tsx       - Main scanner component (Step 1)
  │   ├─ USCCardScanGuide.tsx     - Visual scanning guide overlay
  │   ├─ USCCardSuccessAnimation.tsx - Success feedback
  │   └─ USCCardErrorFeedback.tsx - Error states & retry

app/
  ├─ onboarding/
  │   └─ page.tsx                 - Add USC card scan step
  │
  ├─ login/
  │   └─ page.tsx                 - Add USC card login tab
  │
  └─ settings/
      └─ page.tsx                 - Add guest account upgrade

server/src/
  ├─ usc-verification.ts          - NEW: Card validation API
  ├─ database.ts                  - Add USC tables
  └─ auth.ts                      - Add card login endpoint
```

---

### **Phase 3: Frontend Components**

#### **USCWelcomePopup.tsx**
```tsx
interface USCWelcomePopupProps {
  onContinue: () => void;
  onCancel: () => void;
}

// UI: Full-screen gradient (USC cardinal → gold)
// Text: "Welcome to BUMPIN @ USC"
// Subtitle: 1-2 sentence description
// Button: "Continue to Verification"
```

#### **USCCardScanner.tsx**
```tsx
interface USCCardScannerProps {
  onSuccess: (uscId: string, rawValue: string, format: string) => void;
  onError: (error: string) => void;
  onSkipToEmail: () => void;
}

// Features:
// - Camera stream with high resolution
// - Barcode guide overlay (white rectangle)
// - Real-time scanning (5 fps)
// - Multi-read validation (3 consecutive)
// - Success/error feedback
// - Skip to email fallback button
```

**Key Implementation:**
```typescript
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser';

const scanBarcode = async () => {
  const codeReader = new BrowserMultiFormatReader();
  
  // Only scan for likely formats
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
  ]);
  
  // Continuous scanning
  await codeReader.decodeFromVideoDevice(
    undefined, // Use default camera
    'video',   // Video element ID
    (result, error) => {
      if (result) {
        handleScan(result.text, result.format);
      }
    }
  );
};
```

---

### **Phase 4: Backend Implementation**

#### **Database Schema**
```sql
-- One card = one account enforcement
CREATE TABLE usc_card_registrations (
  usc_id VARCHAR(10) PRIMARY KEY,           -- "1268306021"
  usc_id_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA256(uscId + salt)
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Audit trail
  first_scanned_at TIMESTAMPTZ DEFAULT NOW(),
  first_scanned_ip INET,
  raw_barcode_value TEXT,                   -- For debugging
  barcode_format VARCHAR(20),               -- CODE_128, CODE_39, etc.
  
  -- Usage tracking
  last_login_via_card_at TIMESTAMPTZ,
  total_card_logins INT DEFAULT 0,
  
  INDEX idx_hash (usc_id_hash),
  INDEX idx_user (user_id)
);

-- Scan attempt logging (security)
CREATE TABLE usc_scan_attempts (
  attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scan data
  raw_barcode_value TEXT,
  barcode_format VARCHAR(20),
  extracted_usc_id VARCHAR(10),
  
  -- Validation
  passed_validation BOOLEAN,
  validation_errors JSONB,                  -- Array of failed checks
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  resulted_in_signup BOOLEAN DEFAULT false,
  resulted_in_login BOOLEAN DEFAULT false,
  
  -- Audit
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_ip_time (ip_address, scanned_at),
  INDEX idx_usc_id (extracted_usc_id),
  INDEX idx_success (passed_validation, scanned_at)
);

-- Update users table
ALTER TABLE users ADD COLUMN usc_id VARCHAR(10) UNIQUE;
ALTER TABLE users ADD COLUMN usc_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'guest' 
  CHECK (account_type IN ('guest', 'permanent'));
ALTER TABLE users ADD COLUMN account_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN verification_method VARCHAR(20);

-- Index for cleanup job
CREATE INDEX idx_guest_expiry 
  ON users(account_type, account_expires_at) 
  WHERE account_type = 'guest';
```

#### **Validation Endpoint**
```typescript
// server/src/usc-verification.ts

router.post('/verify-card', rateLimiter(5, 10), async (req, res) => {
  const { rawBarcodeValue, barcodeFormat, extractedUSCId, ipAddress } = req.body;
  
  // Log attempt
  await logScanAttempt({
    raw: rawBarcodeValue,
    format: barcodeFormat,
    uscId: extractedUSCId,
    ip: ipAddress,
  });
  
  // Validate format
  if (!/^[0-9]{10}$/.test(extractedUSCId)) {
    return res.status(400).json({ 
      valid: false, 
      error: 'Invalid USC ID format' 
    });
  }
  
  // Check if already registered
  const existing = await query(
    'SELECT user_id, first_scanned_at FROM usc_card_registrations WHERE usc_id = $1',
    [extractedUSCId]
  );
  
  if (existing.rows.length > 0) {
    return res.status(409).json({ 
      valid: false, 
      error: 'USC Card already registered',
      registeredAt: existing.rows[0].first_scanned_at,
    });
  }
  
  // All checks passed
  res.json({ 
    valid: true, 
    uscId: extractedUSCId,
    message: 'USC Card verified' 
  });
});
```

---

### **Phase 5: Account System**

#### **Guest Account Creation (Card Only)**
```typescript
router.post('/auth/guest-usc', async (req, res) => {
  const { name, gender, uscId, rawBarcode, barcodeFormat } = req.body;
  
  // Validate USC ID
  const validation = await validateUSCCard(uscId, req.ip);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  // Create user
  const userId = uuidv4();
  const sessionToken = generateToken();
  
  await query(`
    INSERT INTO users (
      user_id, name, gender, usc_id, usc_verified_at,
      account_type, account_expires_at, verification_method
    ) VALUES ($1, $2, $3, $4, NOW(), 'guest', NOW() + INTERVAL '7 days', 'usc_card')
  `, [userId, name, gender, uscId]);
  
  // Register card
  await query(`
    INSERT INTO usc_card_registrations (
      usc_id, usc_id_hash, user_id, first_scanned_ip, 
      raw_barcode_value, barcode_format
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    uscId, 
    hashUSCId(uscId), 
    userId, 
    req.ip,
    rawBarcode,
    barcodeFormat
  ]);
  
  // Create session
  await store.createSession(sessionToken, userId, 'guest');
  
  res.json({
    sessionToken,
    userId,
    accountType: 'guest',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    uscId: '******' + uscId.slice(-4), // Redacted for privacy
  });
});
```

#### **Card Login**
```typescript
router.post('/auth/login-usc-card', async (req, res) => {
  const { uscId } = req.body;
  
  // Rate limiting
  if (!checkLoginRateLimit(req.ip)) {
    return res.status(429).json({ error: 'Too many attempts' });
  }
  
  // Find user
  const user = await query(
    'SELECT * FROM users WHERE usc_id = $1',
    [uscId]
  );
  
  if (user.rows.length === 0) {
    return res.status(404).json({ 
      error: 'USC Card not registered. Please sign up first.' 
    });
  }
  
  const userData = user.rows[0];
  
  // Check expiry (guest accounts)
  if (userData.account_type === 'guest' && userData.account_expires_at) {
    if (new Date(userData.account_expires_at) < new Date()) {
      // Expired - delete account and free USC ID
      await deleteExpiredAccount(userData.user_id);
      
      return res.status(410).json({ 
        error: 'Guest account expired. Your USC card is now available for new registration.' 
      });
    }
  }
  
  // Create session
  const sessionToken = generateToken();
  await store.createSession(sessionToken, userData.user_id, userData.account_type);
  
  // Update login stats
  await query(`
    UPDATE usc_card_registrations 
    SET last_login_via_card_at = NOW(), 
        total_card_logins = total_card_logins + 1
    WHERE usc_id = $1
  `, [uscId]);
  
  res.json({
    sessionToken,
    userId: userData.user_id,
    accountType: userData.account_type,
    expiresAt: userData.account_expires_at,
  });
});
```

---

## 📊 Testing Checklist

### **Before Implementation:**
- [ ] Test scanner with YOUR USC card (Hanson's card: 1268306021)
- [ ] Record exact barcode format detected (CODE_128 vs CODE_39)
- [ ] Record raw barcode value (might include prefix/suffix)
- [ ] Test scan success rate (should be >90%)
- [ ] Test on mobile (iPhone Safari)
- [ ] Test on desktop (Chrome/Firefox)
- [ ] Test with different lighting conditions
- [ ] Verify extraction logic works (10-digit ID extracted correctly)

### **Benchmark Values (Fill After Testing):**
```
USC ID: _________________ (your card)
Raw Barcode: _____________ (what scanner reads)
Format: __________________ (CODE_128/CODE_39)
Extraction: ______________ (how to get ID from raw)
Success Rate: ____________ (%)
Best Camera: _____________ (back/front/webcam)
Best Distance: ___________ (inches)
```

---

## 🚀 Implementation Steps (After Testing)

### **Step 1: Install Dependencies**
```bash
npm install @zxing/browser
# or based on test results:
npm install html5-qrcode
```

### **Step 2: Create Components**
Based on test results, create:
1. `components/usc-verification/USCWelcomePopup.tsx`
2. `components/usc-verification/USCCardScanner.tsx`
3. `components/usc-verification/USCCardLogin.tsx`

### **Step 3: Update Onboarding Flow**
```typescript
// app/onboarding/page.tsx

type Step = 'welcome' | 'usc-scan' | 'name' | 'selfie' | 'video' | 'permanent';

// Add welcome popup for admin QR users
if (inviteCodeType === 'admin') {
  setStep('welcome');
}

// Step 0: Welcome
{step === 'welcome' && (
  <USCWelcomePopup
    onContinue={() => setStep('usc-scan')}
  />
)}

// Step 1: USC Card Scan
{step === 'usc-scan' && (
  <USCCardScanner
    onSuccess={(uscId) => {
      setUscId(uscId);
      setStep('name');
    }}
    onSkipToEmail={() => {
      // Fallback to email verification
      setStep('usc-email-verify');
    }}
  />
)}

// Step 2: Name (show guest account notice)
{step === 'name' && uscId && !email && (
  <GuestAccountNotice expiresIn={7} />
)}
```

### **Step 4: Create Backend API**
```typescript
// server/src/usc-verification.ts
export function createUSCVerificationRoutes() {
  router.post('/verify-card', validateUSCCard);
  router.post('/login-usc-card', loginWithUSCCard);
  router.post('/upgrade-guest-account', upgradeGuestAccount);
  router.get('/card-status/:uscId', checkCardStatus);
}
```

### **Step 5: Add Login Tab**
```typescript
// app/login/page.tsx

<Tabs>
  <Tab id="email">Email & Password</Tab>
  <Tab id="card">🎓 USC Card Scan</Tab>
</Tabs>

{activeTab === 'card' && (
  <USCCardLogin
    onSuccess={(session) => {
      saveSession(session);
      router.push('/main');
    }}
  />
)}
```

### **Step 6: Guest Account Management**
```typescript
// app/settings/page.tsx

{accountType === 'guest' && (
  <div className="expiry-warning">
    <h3>Guest Account</h3>
    <p>Expires in {daysRemaining} days</p>
    <button onClick={() => setShowUpgrade(true)}>
      Upgrade to Permanent
    </button>
  </div>
)}
```

### **Step 7: Cleanup Job**
```typescript
// server/src/cleanup-jobs.ts

// Run every 6 hours
setInterval(async () => {
  const expired = await query(`
    SELECT user_id, usc_id FROM users
    WHERE account_type = 'guest'
    AND account_expires_at < NOW()
  `);
  
  for (const user of expired.rows) {
    await deleteUser(user.user_id);
    await freeUSCCard(user.usc_id); // Allow re-registration
    console.log(`Deleted expired guest: ${user.usc_id}`);
  }
}, 6 * 60 * 60 * 1000);
```

---

## 🔐 Security Implementation

### **1. One Card Per Account**
```typescript
// Before creating account
const existing = await query(
  'SELECT user_id FROM usc_card_registrations WHERE usc_id = $1',
  [uscId]
);

if (existing.rows.length > 0) {
  throw new Error('USC Card already registered');
}

// Atomic insert (UNIQUE constraint prevents race conditions)
await query(`
  INSERT INTO usc_card_registrations (usc_id, user_id)
  VALUES ($1, $2)
`, [uscId, userId]);
```

### **2. Rate Limiting**
```typescript
const RATE_LIMITS = {
  scan: {
    max: 5,
    window: 10 * 60 * 1000, // 10 minutes
    message: 'Too many scan attempts. Wait 10 minutes.',
  },
  login: {
    max: 10,
    window: 60 * 60 * 1000, // 1 hour
    message: 'Too many login attempts. Wait 1 hour.',
  },
  register: {
    max: 2,
    window: 24 * 60 * 60 * 1000, // 24 hours
    message: 'Maximum 2 registrations per day per IP.',
  },
};
```

### **3. Privacy Protection**
```typescript
// Hash USC IDs before storage
function hashUSCId(uscId: string): string {
  const salt = process.env.USC_ID_SALT; // In environment
  return crypto.createHash('sha256')
    .update(uscId + salt)
    .digest('hex');
}

// Display redacted
function redactUSCId(uscId: string): string {
  return '******' + uscId.slice(-4);
}

// Example: 1268306021 → ******6021
```

---

## 📱 Updated Onboarding Flow

```
┌────────────────────────────────────────┐
│ ADMIN QR SCAN                          │
│ ?inviteCode=USC_ADMIN_QR_123           │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│ STEP 0: WELCOME POPUP                  │
│ ════════════════════════════════════   │
│                                         │
│  🎓  Welcome to BUMPIN @ USC           │
│                                         │
│  Connect with fellow Trojans through   │
│  authentic 1-on-1 video chats.         │
│                                         │
│  [Continue to Verification] →          │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│ STEP 1: USC CARD SCANNER               │
│ ════════════════════════════════════   │
│                                         │
│  📷 Scan Your USC Campus Card          │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ [Camera Feed]                    │  │
│  │                                  │  │
│  │   ┏━━━━━━━━━━━━━━━━━━━━━━━━┓   │  │
│  │   ┃ Align barcode here     ┃   │  │
│  │   ┗━━━━━━━━━━━━━━━━━━━━━━━━┛   │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  💡 Hold card flat with good lighting  │
│                                         │
│  [Skip - Use Email Instead]            │
└────────────────────────────────────────┘
              ↓ (Success)
┌────────────────────────────────────────┐
│ ✅ USC ID Verified: ******6021         │
│ Proceeding to profile setup...         │
└────────────────────────────────────────┘
              ↓ (1 second delay)
┌────────────────────────────────────────┐
│ STEP 2: NAME + GENDER                  │
│ ════════════════════════════════════   │
│                                         │
│  ⚠️ Guest account expires in 7 days    │
│     Add USC email in Settings for      │
│     permanent access.                  │
│                                         │
│  Name: _________________               │
│  Gender: [F][M][NB][U]                 │
│                                         │
│  [Continue] →                           │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│ STEP 3-4: SELFIE + VIDEO               │
│ (Existing flow)                        │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│ STEP 5: PERMANENT ACCOUNT (OPTIONAL)   │
│ ════════════════════════════════════   │
│                                         │
│  Upgrade to permanent account?         │
│                                         │
│  📧 USC Email (optional): @usc.edu     │
│  🔒 Password: __________               │
│                                         │
│  ℹ️ Without email, account expires     │
│     in 7 days and will be deleted.     │
│                                         │
│  [Skip - Continue as Guest]            │
│  [Make Permanent] →                     │
└────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────┐
│ MAIN PAGE                              │
│                                         │
│  Guest Account: 6 days remaining ⏰    │
│  [Upgrade in Settings]                 │
└────────────────────────────────────────┘
```

---

## 🧪 Validation Logic (Based on Test Results)

### **After Testing, Implement:**

```typescript
// lib/usc-card-validation.ts

export interface USCIdValidation {
  isValid: boolean;
  uscId: string | null;
  checks: ValidationCheck[];
  error?: string;
}

export function validateUSCCardScan(
  rawBarcodeValue: string,
  barcodeFormat: string
): USCIdValidation {
  
  // Step 1: Extract USC ID
  const uscId = extractUSCId(rawBarcodeValue);
  
  if (!uscId) {
    return {
      isValid: false,
      uscId: null,
      checks: [],
      error: 'Could not extract 10-digit USC ID from barcode',
    };
  }
  
  // Step 2: Run validation checks
  const checks: ValidationCheck[] = [];
  
  // Check 1: Length (must be 10)
  checks.push({
    name: 'Length',
    passed: uscId.length === 10,
    expected: '10 digits',
    actual: `${uscId.length} digits`,
  });
  
  // Check 2: Format (all numeric)
  const isNumeric = /^[0-9]+$/.test(uscId);
  checks.push({
    name: 'Format',
    passed: isNumeric,
    expected: 'All numeric',
    actual: isNumeric ? 'Numeric' : 'Contains letters',
  });
  
  // Check 3: Range
  const num = parseInt(uscId);
  const inRange = num >= 1000000000 && num <= 9999999999;
  checks.push({
    name: 'Range',
    passed: inRange,
    expected: '1000000000-9999999999',
    actual: num.toString(),
  });
  
  // Check 4: First digit (based on test results)
  // UPDATE THIS after testing multiple cards
  const firstDigit = uscId[0];
  const firstDigitValid = firstDigit === '1' || firstDigit === '2';
  checks.push({
    name: 'First Digit',
    passed: firstDigitValid,
    expected: '1 or 2 (typical USC range)',
    actual: firstDigit,
    optional: true, // Don't fail on this
  });
  
  // Check 5: Barcode format
  const formatValid = ['CODE_128', 'CODE_39', 'CODE_93'].includes(barcodeFormat);
  checks.push({
    name: 'Barcode Type',
    passed: formatValid,
    expected: 'CODE_128 or CODE_39',
    actual: barcodeFormat,
  });
  
  // Overall validation
  const requiredChecks = checks.filter(c => !c.optional);
  const allPassed = requiredChecks.every(c => c.passed);
  
  return {
    isValid: allPassed,
    uscId,
    checks,
    error: allPassed ? undefined : 'Failed validation checks',
  };
}

// Extract 10-digit USC ID from raw barcode
// UPDATE THIS based on test results
function extractUSCId(raw: string): string | null {
  // Remove all non-digits
  const digits = raw.replace(/\D/g, '');
  
  // If exactly 10, that's it
  if (digits.length === 10) {
    return digits;
  }
  
  // If longer, find first 10-digit sequence
  // Example: "USC1268306021" → "1268306021"
  // Example: "12683060215156" → "1268306021"
  const match = digits.match(/(\d{10})/);
  return match ? match[1] : null;
}
```

---

## 🎯 Next Steps

### **IMMEDIATE (Today):**
1. ✅ Open `test-usc-advanced-scanner.html` in browser
2. ✅ Scan your USC card (ID: 1268306021)
3. ✅ Record all results in this document
4. ✅ Test multiple times to ensure consistency
5. ✅ Test on mobile phone

### **AFTER TESTING (Tomorrow):**
1. Review test results
2. Update validation logic based on findings
3. Implement USCCardScanner component
4. Add to onboarding flow
5. Create card login page
6. Set up cleanup job for guest accounts

---

## 📝 Test Results Template

### **Fill This Out After Testing:**

```
TEST DATE: _____________
TESTER: Hanson Yan
USC ID: 1268306021

┌─── SCAN RESULTS ───────────────────────────────────┐
│                                                     │
│ ✅ Barcode Format Detected: ___________________    │
│                                                     │
│ ✅ Raw Barcode Value: _________________________    │
│                                                     │
│ ✅ Extracted USC ID: ___________________________   │
│                                                     │
│ ✅ Extraction Method: __________________________   │
│    (Clean / Strip Prefix / Find Pattern)           │
│                                                     │
│ ✅ Success Rate: _______% (__ successful / __ tries)│
│                                                     │
│ ✅ Average Scan Time: ________ seconds             │
│                                                     │
│ ✅ Best Camera: ________________________________   │
│    (Back / Front / Webcam)                         │
│                                                     │
│ ✅ Best Distance: _________ inches                 │
│                                                     │
│ ✅ Lighting Issues: ____________________________   │
│                                                     │
│ ✅ Mobile Test (iPhone): ____________________     │
│                                                     │
│ ✅ Mobile Test (Android): ___________________     │
│                                                     │
└─────────────────────────────────────────────────────┘

VALIDATION RULES CONFIRMED:
□ Length = 10 digits
□ All numeric
□ First digit = 1 or 2 (or other: ___)
□ Range: 1000000000 - 9999999999
□ Format: CODE_128 (or other: _______)

BENCHMARK ESTABLISHED:
USC ID: 1268306021
This is the reference for valid USC cards.

READY TO IMPLEMENT: YES / NO
```

---

## 🎉 Expected Outcomes

### **After successful testing:**
- ✅ Know exact barcode format (CODE_128 vs CODE_39)
- ✅ Know extraction logic (raw → USC ID)
- ✅ Know success rate (should be >90%)
- ✅ Have benchmark USC ID (your card)
- ✅ Confidence in implementation approach

### **Implementation will provide:**
- ⚡ **5-second verification** (vs 60-second email)
- 🎓 **Physical proof** of USC student status
- 🔒 **One card = one account** (enforced)
- ⏰ **7-day guest accounts** (with upgrade option)
- 🔑 **Card-based login** (scan to login)
- 🔄 **Auto-cleanup** of expired guests

---

## 📞 Support Plan

### **Common Issues & Solutions:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Can't scan barcode | Low light / blurry | Improve lighting, hold steady |
| Wrong card detected | Scanned wrong barcode | Guide overlay helps alignment |
| "Already registered" | Card used before | Show registration date, support link |
| Camera not working | Permission denied | Fallback to email option |
| Guest account expired | 7 days passed | Allow re-registration with same card |

---

## 🚀 READY TO TEST

**Open the test scanner:**
```bash
# Navigate to project
cd /Users/hansonyan/Desktop/Napalmsky

# Open in browser
open public/test-usc-advanced-scanner.html

# OR start dev server and visit:
# http://localhost:3000/test-usc-advanced-scanner.html
```

**Test with your USC card and report back:**
1. What barcode format was detected?
2. What was the raw barcode value?
3. Did it extract "1268306021" correctly?
4. What was the success rate?

**After testing, we'll implement the production version!** 🎯

