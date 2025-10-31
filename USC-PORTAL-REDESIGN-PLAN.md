USC PORTAL REDESIGN - SIMPLE & CLEAN
=====================================

## CURRENT DESIGN (Screenshot Analysis)

Issues:
❌ Too much text
❌ Complex 3-button layout (QR/Card/Email removed)
❌ Blue/purple gradient (not brand color)
❌ Cluttered description
❌ Not centered properly

Current Elements:
- Title: "🎓 USC Students"
- Description: "Scan admin QR code OR your USC campus card"
- Button: "📱 Scan QR Code or Barcode"
- Help text: "QR codes available at campus events..."

---

## NEW DESIGN - MINIMALIST

```
┌─────────────────────────────────────┐
│     Join the Waitlist               │
│  [Waitlist Form]                    │
│  [Join Waitlist] button             │
├─────────────────────────────────────┤
│              OR                      │
├─────────────────────────────────────┤
│ USC Students / QR Code Invite Only  │
│                                     │
│  [📱 Scan QR Code or Barcode]      │
│   (Single button, brand color)      │
└─────────────────────────────────────┘
```

Changes:
========

1. ✅ Title: "USC Students/QR Code Invite Only"
   - Shorter, clearer
   - Matches user's request

2. ✅ Remove Description
   - No extra text
   - Self-explanatory

3. ✅ Single Button
   - "📱 Scan QR Code or Barcode"
   - Brand color (#ffc46a)
   - Black text
   - Clean, simple

4. ✅ Remove Help Text
   - No bottom explanation
   - Minimalist

5. ✅ Remove Gradient Card
   - Plain background
   - Or subtle bg-white/5

---

## BUTTON BEHAVIOR

### Click "Scan QR Code or Barcode"

Shows modal with 2 options:
```
┌─────────────────────────┐
│  Choose Scan Method     │
├─────────────────────────┤
│  [📱 Scan QR Code]     │
│  (Admin event QR)       │
├─────────────────────────┤
│  [🎓 Scan USC Card]    │
│  (Campus card barcode)  │
├─────────────────────────┤
│  [Cancel]               │
└─────────────────────────┘
```

Then opens respective scanner.

---

## IMPLEMENTATION

### Step 1: Simplify Waitlist Page UI

REMOVE:
- "🎓 USC Students" title (replace)
- Description paragraph
- 3-button grid
- Blue gradient card
- Help text

ADD:
- Simple text: "USC Students/QR Code Invite Only"
- Single button (brand color)
- Modal with 2 options

### Step 2: Create Choice Modal

New state:
```typescript
const [showScanChoice, setShowScanChoice] = useState(false);
```

Modal:
```typescript
{showScanChoice && (
  <div className="modal">
    <h2>Choose Scan Method</h2>
    <button onClick={() => {
      setShowScanChoice(false);
      setShowQRScanner(true);
    }}>
      📱 Scan QR Code
    </button>
    <button onClick={() => {
      setShowScanChoice(false);
      setShowBarcodeScanner(true);
    }}>
      🎓 Scan USC Card
    </button>
    <button onClick={() => setShowScanChoice(false)}>
      Cancel
    </button>
  </div>
)}
```

### Step 3: Remove Email Option

Delete:
- showEmailInput state
- uscEmail state
- Email modal
- 3rd button

Keep only:
- QR scanner
- Barcode scanner

---

## ESTIMATED CHANGES

Files: 1 (app/waitlist/page.tsx)
Lines to remove: ~50
Lines to add: ~40
Net change: Simpler, cleaner

Time: 20 minutes
Commits: 1

---

Ready to implement?
