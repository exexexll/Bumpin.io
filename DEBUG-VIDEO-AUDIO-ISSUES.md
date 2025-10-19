# 🔴 DEBUG PLAN: Video Audio & Sizing Issues

**Status:** User reports STILL NOT FIXED after multiple attempts  
**Approach:** Stop guessing, start debugging systematically

---

## 📊 What User Reports:

1. **"Additional audio snippet will start playing"**
   - Multiple audio sources
   - Happens when playing video
   - Audio overlaps/duplicates

2. **"Video resizing didn't reflect on the UI"**
   - Vertical video on desktop not working
   - BUT works on mobile perfectly
   - Desktop-specific issue

---

## 🔍 Current Video Elements in Code:

### Location 1: UserCard.tsx (Line 472)
```typescript
<video
  ref={videoRef}
  src={user.videoUrl}
  loop
  playsInline
  className="w-full h-full"
  style={{ objectFit: 'contain', objectPosition: 'center' }}
/>
```
- Unmuted when isActive=true
- Should have cleanup

### Location 2: CalleeNotification.tsx (Line 188)
```typescript
<video
  ref={videoRef}
  src={invite.fromUser.videoUrl}
  autoPlay
  loop
  muted  ← Should be muted!
  playsInline
  className="..."
/>
```
- Should be muted
- Now has cleanup

---

## 🎯 Debugging Steps Needed:

### Step 1: Check for duplicate DOM elements
```javascript
// In browser console while on matchmaking page:
document.querySelectorAll('video').length
// Should be 1 or 2 (if notification showing)
// If more than 2, we have duplicates!

// List all video sources:
document.querySelectorAll('video').forEach((v, i) => {
  console.log(`Video ${i}:`, v.src, 'Muted:', v.muted, 'Paused:', v.paused);
});
```

### Step 2: Check CSS rendering
```javascript
// Check video element computed styles:
const video = document.querySelector('video');
const styles = window.getComputedStyle(video);
console.log('Width:', styles.width);
console.log('Height:', styles.height);
console.log('Object-fit:', styles.objectFit);
console.log('Padding-bottom of parent:', window.getComputedStyle(video.parentElement).paddingBottom);
```

### Step 3: Check if pb-32 is actually applied
```javascript
// Check the video container:
const container = document.querySelector('[class*="pb-32"]');
console.log('Container:', container);
console.log('Computed padding-bottom:', window.getComputedStyle(container).paddingBottom);
// Should be 128px (8rem)
```

---

## 💡 Possible Real Issues:

### Issue A: React Strict Mode (Development)
- In development, React mounts components twice
- Could create duplicate video elements
- Only in dev mode, not production

### Issue B: CSS not being applied
- Tailwind pb-32 might not be in build
- Need to check if class actually exists
- Inline styles might be needed

### Issue C: Video ref being shared
- Multiple components pointing to same ref somehow
- Unlikely but possible

### Issue D: Browser-specific rendering
- Desktop browser handles object-fit differently
- Mobile browsers have different defaults
- Need to add more explicit CSS

---

## 🔧 Proposed Real Debug Fix:

### For Audio (Console Debugging):
```typescript
// In UserCard, add extensive logging:
useEffect(() => {
  const video = videoRef.current;
  console.log('[UserCard] Video element:', video);
  console.log('[UserCard] Video src:', video?.src);
  console.log('[UserCard] isActive:', isActive);
  console.log('[UserCard] isVideoPaused:', isVideoPaused);
  
  if (!video) return;
  
  if (isActive && !isVideoPaused) {
    console.log('[UserCard] UNMUTING and PLAYING video');
    video.muted = false;
    video.volume = 1.0;
    video.play();
  } else {
    console.log('[UserCard] MUTING and PAUSING video');
    video.pause();
    video.muted = true;
    video.volume = 0;
  }
}, [isActive, isVideoPaused]);
```

### For Sizing (Force inline styles):
```typescript
<video
  ref={videoRef}
  src={user.videoUrl}
  loop
  playsInline
  style={{
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    maxWidth: '100%',
    maxHeight: '100%',
  }}
/>
```

---

## ⚠️ What I Need from User:

1. **Open browser console** (F12)
2. **Navigate matchmaking**
3. **Copy paste this:**
```javascript
// Check video elements
const videos = document.querySelectorAll('video');
console.log('Total videos:', videos.length);
videos.forEach((v, i) => {
  console.log(`Video ${i}:`, {
    src: v.src.substring(v.src.lastIndexOf('/') + 1),
    muted: v.muted,
    paused: v.paused,
    volume: v.volume,
    width: v.offsetWidth,
    height: v.offsetHeight,
  });
});
```
4. **Send me the output**

This will tell me EXACTLY what's happening!

