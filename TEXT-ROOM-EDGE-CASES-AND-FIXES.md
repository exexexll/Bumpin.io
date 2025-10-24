# Text Room Edge Cases & Critical Fixes Needed

## 🐛 CRITICAL ISSUES FOUND

### Issue 1: Inactivity Countdown Stuck at 0s
**Problem**: When countdown reaches 0, session doesn't end - just shows "Inactive: 0s"

**Root Cause Analysis**:
Server emits `textroom:ended-inactivity` when countdown expires, but there may be a timing issue.

**Server Logic** (lines 262-269):
```typescript
if (warningSince > 60000) {
  // End session
  io.to(roomId).emit('textroom:ended-inactivity');
  room.status = 'ended';
  // ... cleanup ...
}
```

**Frontend Handler** (lines 152-157):
```typescript
socket.on('textroom:ended-inactivity', () => {
  alert('Session ended due to inactivity');
  router.push('/history');
});
```

**Potential Issues**:
1. Background job runs every 30s - there's a delay between countdown reaching 0 and server detecting it
2. Countdown updates every 30s, so it might show 0s for up to 30s before server ends it
3. The countdown calculation might be showing 0 before server actually ends session

**Fix Needed**:
- Add client-side countdown that ends locally when reaching 0
- Or make server checks more frequent (10s instead of 30s)
- Or add visual "Ending soon..." at 5s remaining

---

### Issue 2: Video Upgrade Button Not Appearing

**Current Logic**:
```typescript
useEffect(() => {
  let elapsed = 0;
  timerRef.current = setInterval(() => {
    elapsed++;
    if (elapsed >= 60 && !showVideoRequest) {
      setShowVideoRequest(true);
    }
  }, 1000);
}, [showVideoRequest]); //  Dependency causes re-creation!
```

**BUG**: The useEffect has `showVideoRequest` in dependencies!
- When showVideoRequest changes to true, effect re-runs
- Timer gets recreated, elapsed resets to 0
- Button appears but logic breaks

**Fix**: Remove showVideoRequest from dependencies, use state update function

---

### Issue 3: No Text Room Reconnection Logic
**Problem**: Text mode has basic socket reconnection but no:
- SessionStorage tracking (like video mode)
- Grace period UI
- Automatic message sync after reconnect

**Current**: Only Socket.io's auto-reconnect
**Needed**: Proper reconnection with state restoration

---

## 📋 TEXT ROOM RECONNECTION EDGE CASES

### Should Handle:
1. **Tab reload during active chat**
   - Detect same roomId
   - Restore message history
   - Continue from where left off
   
2. **Network disconnect < 10s**
   - Socket reconnects automatically
   - Show reconnecting banner
   - Hide when reconnected
   
3. **Network disconnect > 10s**  
   - Grace period expires
   - Server ends session
   - Redirect to history
   
4. **Partner disconnects**
   - Show partner disconnected banner
   - Wait for grace period
   - If reconnects: continue
   - If times out: end session
   
5. **Both users disconnect**
   - Server grace period handles it
   - First to reconnect rejoins
   - Second reconnects to same room
   
6. **Disconnect during typing**
   - Clear typing indicator
   - Restore after reconnect
   
7. **Disconnect with unread messages**
   - Messages already saved to DB
   - Load on reconnect
   
8. **Disconnect during inactivity warning**
   - Warning state lost
   - Restart inactivity check on reconnect

---

## ✅ FIXES TO IMPLEMENT

### Fix 1: Inactivity Countdown Reaching 0
```typescript
// Add client-side check
useEffect(() => {
  if (inactivityCountdown <= 0 && inactivityWarning) {
    // End session locally (don't wait for server)
    console.log('[TorchRule] Countdown reached 0 - ending session');
    router.push('/history');
  }
}, [inactivityCountdown, inactivityWarning]);
```

### Fix 2: Video Button Not Showing
```typescript
// Fix dependencies
useEffect(() => {
  let elapsed = 0;
  
  const interval = setInterval(() => {
    elapsed++;
    if (elapsed >= 60) {
      setShowVideoRequest(true);
      clearInterval(interval); // Stop after showing button
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, []); // Empty deps - run once on mount
```

### Fix 3: Add Text Room Reconnection
```typescript
// Store state like video mode
sessionStorage.setItem('text_room_active', 'true');
sessionStorage.setItem('text_room_id', roomId);

// On mount, check if reload
const storedRoomId = sessionStorage.getItem('text_room_id');
if (storedRoomId === roomId) {
  // This is a reconnection
  console.log('[TextRoom] Reconnection detected');
}

// On unmount, clear
sessionStorage.removeItem('text_room_active');
```

---

## 🧪 TEXT ROOM RECONNECTION TEST MATRIX

| Scenario | Current Behavior | Expected Behavior | Status |
|----------|-----------------|-------------------|--------|
| Tab reload | Socket reconnects, history loads | Same ✅ | ✅ OK |
| WiFi off 3s | Socket reconnects automatically | Same ✅ | ✅ OK |
| WiFi off 15s | Grace period → session ends | Same ✅ | ✅ OK |
| Partner disconnects | Shows reconnecting banner | Same ✅ | ✅ OK |
| Both disconnect | First to return rejoins | Need to verify | ⚠️ Test |
| Disconnect while typing | Typing indicator clears | Need to verify | ⚠️ Test |
| Reload with messages | Messages reload from DB | Same ✅ | ✅ OK |
| Disconnect during warning | Warning state lost | Should restore | ⚠️ Issue |

---

## 🔍 DETAILED INVESTIGATION NEEDED

### Video Button Investigation:
Need to check:
1. Is useEffect actually running? (Add console.log)
2. Is interval actually firing? (Add console.log each second)
3. Is elapsed actually incrementing? (Log it)
4. Is setShowVideoRequest being called? (Log it)
5. Is showVideoRequest state actually changing? (Log it)

### Countdown Investigation:
Need to check:
1. Is countdown actually updating? (Check state)
2. What happens at 0? (Add console.log)
3. Is alert() actually shown? (Check browser)
4. Is router.push() being called? (Check navigation)

---

## ✅ IMMEDIATE ACTION ITEMS

1. **Fix video button logic** - Remove from deps, add logs
2. **Fix countdown at 0** - Add client-side check
3. **Add reconnection edge case handling**
4. **Test all scenarios thoroughly**


