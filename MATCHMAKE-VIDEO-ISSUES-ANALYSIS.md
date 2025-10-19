# 🔍 Matchmake Video Issues - Deep Analysis

**Date:** October 19, 2025  
**Status:** INVESTIGATING - Previous fixes didn't work

---

## 🐛 Issue #1: Audio Leak (CONFIRMED NOT FIXED)

### What User Reports:
> "Audio of the reel will leak out of the control and keep playing even if exit matchoverlay or move on to the next usercard"

### Current Implementation (What I Tried):

**Attempt #1:** Add cleanup in useEffect
```typescript
useEffect(() => {
  return () => {
    video.pause();
    video.muted = true;
  };
}, [isActive, isVideoPaused, user.name]);
```
**Result:** ❌ Didn't work

**Attempt #2:** Dedicated unmount cleanup
```typescript
useEffect(() => {
  const video = videoRef.current;
  return () => {
    video.pause();
    video.muted = true;
    video.src = '';
  };
}, [user.name]);
```
**Result:** ❌ Didn't work

**Attempt #3:** Set exit animation to 0 duration
```typescript
exit={{ opacity: 0, transition: { duration: 0 } }}
```
**Result:** ❌ Still not working

### Why These Fixes Failed - Root Cause Analysis:

**The Real Problem:**
```
Component Tree:
MatchmakeOverlay
  └─ AnimatePresence mode="wait"
      └─ motion.div (key={userId})
          └─ UserCard
              └─ video element

When currentIndex changes:
1. React creates NEW UserCard for new user
2. AnimatePresence KEEPS old UserCard mounted during exit
3. Old UserCard still has isActive=true! (prop doesn't change)
4. Video keeps playing during exit animation
5. After animation, cleanup runs
6. Too late - already heard audio!
```

**The Gap:**
- isActive prop is ALWAYS true for the current card
- When we navigate away, the old card doesn't get isActive=false
- It just unmounts
- During unmount/exit, video still has audio!

### What ACTUALLY Needs to Happen:

**Option A: Stop video BEFORE component unmounts**
- Detect when currentIndex is about to change
- Immediately stop current video
- THEN allow navigation

**Option B: Passively stop all non-visible videos**
- Add data attribute to card: data-user-id
- When currentIndex changes, query all video elements
- Pause/mute ALL videos except current one

**Option C: Ref-based immediate stop**
- Keep refs to all video elements
- When navigating, immediately access prev video ref
- Stop it synchronously before React renders

---

## 🐛 Issue #2: Vertical Video Aspect Ratio (CONFIRMED NOT FIXED)

### What User Reports:
> "When a video is shot on the phone vertically, the resizing still doesn't work on computer"

### iPhone Video Specifications:

**Common iPhone Video Resolutions:**
```
iPhone 13/14/15 (Standard):
- 1080p: 1080×1920 (9:16 aspect ratio)
- 4K: 2160×3840 (9:16 aspect ratio)

Older iPhones:
- 720p: 720×1280 (9:16 aspect ratio)
```

**All vertical = 9:16 aspect ratio**

### Desktop Browser Viewport:

**Typical desktop browser:**
```
1920×1080 (16:9 aspect ratio)
1366×768 (16:9 aspect ratio)
1440×900 (16:10 aspect ratio)

Card container: h-[85vh] = 85% of viewport height
Example: 1080px × 0.85 = 918px tall
Max-width: max-w-2xl = 672px wide
```

**Card aspect ratio:** ~672×918 ≈ 0.73:1 (taller than wide, but not 9:16)

### The Math Problem:

**iPhone vertical video:** 1080×1920 (aspect 0.5625:1 or 9:16)
**Card container:** 672×918 (aspect 0.732:1)

Using object-fit: contain on 9:16 video in 0.732:1 container:
```
Video height: 1920px
Video width: 1080px
Container height: 918px
Container width: 672px

Scale to fit height: 918/1920 = 0.478
Result: 516px wide × 918px tall
Horizontal centering: (672-516)/2 = 78px black bars each side

Should work! ✅
```

**But user says it doesn't work...**

### What Could Be Wrong:

1. **Bottom padding cutting off video**
   - pb-36 = 144px
   - Available height: 918 - 144 = 774px
   - Video tries to fit in 774px height
   - Might be too cramped!

2. **object-fit not being applied**
   - Maybe inline styles override class
   - Or browser doesn't support it

3. **Video element sizing conflict**
   - w-full h-full forces 100% of container
   - But padding reduces container
   - Conflict between explicit size and object-fit

### What to Test:

1. Remove padding temporarily
2. Use only inline styles (no conflicting classes)
3. Check actual rendered dimensions in devtools
4. Log video element width/height

---

## 💡 Proposed Real Solution

### For Audio Leak:

**IMMEDIATELY pause previous video when currentIndex changes:**

```typescript
// In MatchmakeOverlay
useEffect(() => {
  // When currentIndex changes, immediately stop ALL other videos
  const allVideos = document.querySelectorAll('video');
  allVideos.forEach((video, index) => {
    // Stop all videos except we'll let the new card's useEffect handle its own
    console.log(`Stopping video ${index}`);
    video.pause();
    video.muted = true;
    video.volume = 0;
  });
}, [currentIndex]);
```

### For Aspect Ratio:

**Remove padding, use proper flex layout:**

```typescript
// Card structure:
<div className="flex flex-col h-full">
  {/* Header - Fixed height */}
  <div className="flex-shrink-0">...</div>
  
  {/* Video - Takes remaining space */}
  <div className="flex-1 relative">
    <video style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    }} />
  </div>
  
  {/* Controls - Fixed height */}
  <div className="flex-shrink-0">...</div>
</div>
```

This gives video EXACTLY the space between header and controls!

---

## 🎯 Action Plan

1. **Test current state** - See what actually happens
2. **Remove padding** - Try without pb-36/pb-44
3. **Add immediate video stop on index change**
4. **Simplify video styling** - Remove conflicts
5. **Test again** - Verify fixes

**I need to be more methodical and test each change!**

