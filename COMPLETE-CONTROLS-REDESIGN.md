# Complete Video Controls Redesign - Mobile + Desktop

## 🎯 Design Philosophy:

**Mobile:** Touch-friendly, simple, thumb-optimized  
**Desktop:** Mouse-friendly, advanced controls, zone-based

---

## 📱 MOBILE CONTROLS:

### Primary Actions:
```
SWIPE UP → Next card (keep existing)
SWIPE DOWN → Previous card (keep existing)
TAP ONCE → Show/hide UI overlay (name, timer, buttons)
LONG PRESS (2s) → Pause/Play video
```

### Why This Works:
- ✅ Swipe is natural for mobile (TikTok-style)
- ✅ Tap to show controls (Instagram-style)
- ✅ Long press is deliberate (won't trigger accidentally)
- ✅ No fast forward/rewind (videos are short, not needed)
- ✅ Simple, 4 gestures total

### Layout:
```
┌──────────────────┐
│ 📹 Video  4 ppl  │ ← Mode indicator (always visible, top)
│                  │
│                  │
│   [VIDEO]        │
│                  │
│                  │
│  Name            │ ← UI overlay (tap to show/hide)
│  [Timer] [CTA]   │
└──────────────────┘

Gestures:
- Swipe: Navigate
- Tap: Toggle UI
- Hold: Pause/Play
```

---

## 🖥️ DESKTOP CONTROLS:

### Zone Map:
```
┌────────────────────────────────────┐
│         TOP HALF: Previous         │
│                                    │
│ LEFT    │   CENTER   │    RIGHT   │
│  30%    │    40%     │     30%    │
│         │            │            │
│ Hold→   │ Double-tap │   Hold→    │
│ Rewind  │ Pause/Play │   Forward  │
│         │            │            │
│        BOTTOM HALF: Next           │
└────────────────────────────────────┘

Controls:
- Top half click: Previous card
- Bottom half click: Next card
- Left zone hold 2s: Rewind video
- Right zone hold 2s: Fast forward video
- Center double-tap: Pause/play
```

### Interaction Priority:
```
1. Check hold duration first (2s)
   - Left + hold → Rewind
   - Right + hold → Fast forward
   
2. Check double-tap (< 300ms between taps)
   - Center + double → Pause/play
   
3. Default: Single click
   - Top half → Previous
   - Bottom half → Next
```

### Visual Feedback:
```
Holding left/right:
  → Show circular progress indicator
  → "◀ Rewind" or "Fast Forward ▶" text
  → Video scrubs backward/forward

Double-tap center:
  → Show pause ⏸ or play ▶ icon
  → Fades after 1s
```

---

## 🎨 MODE INDICATOR (Mobile):

### Placement:
```
Mobile Layout:
┌──────────────────┐
│ ┌──────────────┐ │ ← Mode indicator bar
│ │📹 Video  4ppl│ │   (sticky, top edge)
│ └──────────────┘ │
│                  │
│   [User Card]    │
│                  │
└──────────────────┘

Above matchmaking overlay
Always visible
Compact bar
Doesn't overlap video
```

### Implementation:
```tsx
<div className="fixed top-0 left-0 right-0 z-[60] sm:hidden">
  <div className="bg-black/80 backdrop-blur-md px-4 py-2 border-b border-white/10">
    <div className="flex items-center justify-center gap-3">
      {/* Mode icon */}
      {/* People count */}
    </div>
  </div>
</div>
```

---

## 🔴 RECORDING CONSENT:

### Modal Design:
```
┌────────────────────────────────────┐
│                                    │
│            🔴 ⚠️ 📹                 │
│                                    │
│     Recording for Community        │
│            Safety                  │
│                                    │
│  By reporting this user, you       │
│  consent to recording the          │
│  REMAINING chat session for        │
│  moderation review.                │
│                                    │
│  Recording will:                   │
│  • Only be viewed by admins        │
│  • Be deleted after review         │
│  • Help keep the community safe    │
│                                    │
│  [Cancel]  [Consent & Report]      │
│                                    │
└────────────────────────────────────┘
```

### During Recording:
```
┌────────────────────────────────────┐
│ 🔴 RECORDING - Report Filed        │ ← Red indicator bar
├────────────────────────────────────┤
│                                    │
│   [Chat/Video continues]           │
│                                    │
└────────────────────────────────────┘
```

---

## ✅ Implementation Checklist:

Mobile:
- [ ] Mode indicator at top edge (z-index below modals)
- [ ] Tap to show/hide UI overlay
- [ ] Long press (2s) for pause/play
- [ ] Keep swipe navigation

Desktop:
- [ ] Zone-based detection (left/center/right)
- [ ] Hold detection (2s timer)
- [ ] Double-tap for pause (center only)
- [ ] Fast forward/rewind (left/right hold)
- [ ] Visual feedback (progress circle, labels)

Recording:
- [ ] Consent modal before recording
- [ ] Clear explanation of what's recorded
- [ ] Recording indicator during capture
- [ ] Only starts on report click

---

**Ready to implement all three systems!**

