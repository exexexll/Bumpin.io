# Landing Page Redesign - Requirements Checklist

## ✅ REQUIREMENTS BREAKDOWN

### 1. Title/Branding
- [ ] Change text to "BUMPIN.I" (with period and I)
- [ ] Use white solid color (not gradient)
- [ ] Use Playfair Display font (original Napalm Sky style)
- [ ] Keep same font weight and styling as before

### 2. Button Colors
- [ ] Global button color: #ebd463 (light yellow)
- [ ] Replace all #fbbf24 (amber) with #ebd463
- [ ] Apply to all buttons across app

### 3. Background Design
**Base**:
- [ ] Solid yellow background (#ebd463)

**Edge Effects**:
- [ ] Pixelized scaffold on outer edges
- [ ] Gradient from yellow (#ebd463) to white at edges
- [ ] Vignette-style fade

**Implementation Options**:
- CSS box-shadow + filter
- SVG filter with pixel effect
- Canvas overlay
- Multiple div layers with pixel borders

### 4. Animated Hearts System
**Initial State**:
- [ ] Two half-broken pixelized hearts
- [ ] Black color initially
- [ ] Start from random positions OUTSIDE screen area

**Movement**:
- [ ] Move freely across screen
- [ ] Same velocity for both hearts
- [ ] Random trajectories
- [ ] Bounce off screen edges (optional)

**Collision Detection**:
- [ ] Detect when hearts overlap
- [ ] Calculate distance between centers
- [ ] Trigger merge when distance < threshold

**Merge Animation**:
- [ ] Two halves come together
- [ ] Form one complete pixelized heart
- [ ] Change color from black to red
- [ ] Scale/pulse animation
- [ ] Particle effects or sparkle (optional)
- [ ] Hearts stay merged and continue moving together

**Technical Approach**:
- Use Framer Motion for animations
- useEffect + setInterval for movement
- Calculate positions and collision
- CSS pixel-art style (image-rendering: pixelated)

---

## 🎨 DESIGN SPECIFICATIONS

### Colors:
- Primary Yellow: #ebd463
- White: #ffffff
- Black (hearts): #000000
- Red (merged heart): #ff0000 or #dc2626

### Heart Design:
```
Pixelized heart sprite (CSS or SVG):
  ■ ■   ■ ■
 ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■
 ■ ■ ■ ■ ■ ■
  ■ ■ ■ ■ ■
    ■ ■ ■
      ■

Half heart = left or right portion
```

### Edge Pixelization:
- Jagged edge effect with CSS clip-path
- Or SVG mask with pixel pattern
- Or multiple small squares forming border

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Background & Title
1. Change background to #ebd463
2. Add pixelized edge effect
3. Add gradient to white at edges
4. Update title to "BUMPIN.I" with Playfair, white color

### Phase 2: Button Colors
1. Find-replace #fbbf24 → #ebd463 globally
2. Update gradient stops if needed
3. Test all buttons still look good

### Phase 3: Heart Animation
1. Create PixelHeart component
2. Add movement logic with Framer Motion
3. Implement collision detection
4. Add merge animation
5. Integrate into Hero component

---

Ready to implement?

