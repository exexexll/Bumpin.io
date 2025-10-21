# 📍 Location-Based Ranking - Proper Implementation

## Current Behavior (What Happens Now):

### Backend (server/src/room.ts):
```
1. Check if user has location permission
2. IF YES: Sort by distance (closest first)
   Returns: [Bob: 100ft, Alice: 500ft, Charlie: 1mi]
3. IF NO: Return in random/normal order
   Returns: [Alice, Bob, Charlie]
```

### Frontend Problem:
```
checkForNewUsers() currently:
- Keeps OLD order of existing users
- Adds NEW users at bottom
- Result: Backend's distance sorting is IGNORED
```

---

## What You Want:

### Scenario 1: No Location Permission
```
Backend returns: [Alice, Bob, Charlie] (random)
Frontend shows: [Alice, Bob, Charlie] (same)
✅ Works as expected
```

### Scenario 2: Has Location Permission
```
Backend returns: [Bob: 100ft, Alice: 500ft, Charlie: 1mi]
  ↓ (closest first)
  
Frontend should:
1. Apply this distance-sorted order
2. BUT preserve what user is currently viewing
3. Gracefully update in background

Example:
User viewing Alice (index 2)
  ↓
New update: Bob now closest
  ↓
New order: [Bob, Charlie, Alice]
  ↓
Adjust index: User now at index 2 (still viewing Alice)
  ↓
User swipes up: Sees Charlie (index 1)
  ↓
User swipes up again: Sees Bob (index 0, closest!)
```

---

## The Fix:

### In `checkForNewUsers()`:
```typescript
setUsers(prevUsers => {
  const currentUserId = prevUsers[currentIndex]?.userId;
  
  // Use backend's order directly (already sorted by distance if user has location)
  let newOrder = [...filteredQueue];
  
  // Only apply special priorities (intro/direct match)
  if (directMatchTarget) {
    const idx = newOrder.findIndex(u => u.userId === directMatchTarget);
    if (idx > 0) {
      const [target] = newOrder.splice(idx, 1);
      newOrder.unshift(target);
    }
  } else {
    const intros = newOrder.filter(u => u.wasIntroducedToMe);
    const others = newOrder.filter(u => !u.wasIntroducedToMe);
    if (intros.length > 0) {
      newOrder = [...intros, ...others]; // Intros first, but distance order preserved within
    }
  }
  
  // Preserve view: Find where current user ended up in new order
  if (currentUserId) {
    const newIdx = newOrder.findIndex(u => u.userId === currentUserId);
    if (newIdx !== -1 && newIdx !== currentIndex) {
      console.log(`Adjusting view: ${currentIndex}→${newIdx}`);
      setCurrentIndex(newIdx);
    }
  }
  
  return newOrder; // This now respects backend's distance sorting!
});
```

---

## Key Insight:

**Backend already does the right thing!**
- User has location → Sorted by distance
- User no location → Random order

**Frontend just needs to TRUST the backend's order**
- Don't preserve old positions
- Use backend's order directly
- Just adjust currentIndex to keep viewing same user

---

This way:
- ✅ Distance ranking applies (backend's order is used)
- ✅ User doesn't notice (still viewing same card)
- ✅ Graceful background update (no page refresh)
- ✅ When user swipes: sees proper distance order

