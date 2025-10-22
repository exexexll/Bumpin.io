# Desktop Video Controls - Redesign

## Current Problem:
```
- Click top half → Previous card
- Click bottom half → Next card
- Double-tap → Pause/play video

CONFLICT:
- Single click navigates (intended for card navigation)
- Double-tap for pause requires 2 clicks
- But 2 clicks = 2 navigation attempts! ❌
```

---

## New Design (Desktop):

### Zone-Based Controls:

```
┌────────────────────────────────────┐
│                                    │
│  ← Hold 2s      PLAY/PAUSE    Hold 2s →  │
│   (Rewind)    (Double-tap)   (Fast Forward)│
│                                    │
│                                    │
│         [VIDEO CONTENT]            │
│                                    │
│                                    │
│         ↑                    ↓     │
│      Previous              Next    │
│       (Click)            (Click)   │
└────────────────────────────────────┘

Left 30%: Click = Previous, Hold 2s = Rewind
Center 40%: Double-tap = Pause/Play
Right 30%: Click = Next, Hold 2s = Fast Forward
Top 50%: Click = Previous
Bottom 50%: Click = Next
```

### Interaction Logic:

```typescript
onClick(e) {
  const x = e.clientX relative to card
  const y = e.clientY relative to card
  const width = card.width
  const height = card.height
  
  // Horizontal zones
  const leftZone = x < width * 0.3
  const centerZone = x >= width * 0.3 && x <= width * 0.7
  const rightZone = x > width * 0.7
  
  // Vertical zones  
  const topHalf = y < height * 0.5
  const bottomHalf = y >= height * 0.5
  
  // Priority: Horizontal zones override vertical
  if (leftZone) {
    if (holdDuration >= 2000) {
      // Rewind video
    } else {
      // Previous card
    }
  } else if (rightZone) {
    if (holdDuration >= 2000) {
      // Fast forward video
    } else {
      // Next card
    }
  } else if (centerZone) {
    if (isDoubleTap) {
      // Pause/play video
    } else if (topHalf) {
      // Previous card
    } else {
      // Next card
    }
  }
}
```

---

## Mobile (No Changes):

Mobile stays simple:
- Swipe up = Next
- Swipe down = Previous
- Double-tap = Pause/play
- No fast forward/rewind (video is short anyway)

---

This prevents all conflicts and adds desktop-only advanced controls.

