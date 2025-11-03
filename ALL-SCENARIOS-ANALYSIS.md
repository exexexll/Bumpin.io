# ALL BACKGROUND QUEUE + MATCHMAKE OVERLAY SCENARIOS

## SCENARIO MATRIX

### Variables:
- **Background Queue Toggle:** ON | OFF
- **Overlay State:** Open | Closed
- **Page:** /main | /settings | /profile | /history | /socials | /room
- **Actions:** Toggle, Navigate, Call, Tab Switch

---

## SCENARIO 1: Toggle OFF, Overlay Closed, On /main

**User Actions:**
1. Lands on /main
2. Toggle OFF (default)

**Expected:**
- ❌ NOT in queue
- ❌ NOT visible to others
- ❌ Can't receive calls (except via overlay)

**Code Check:**
```typescript
// main/page.tsx line 68-69
backgroundQueue.syncWithToggle(backgroundQueueEnabled); // false
// → backgroundQueue.leaveQueue() or no action
```
✅ **WORKS** - User not in queue

---

## SCENARIO 2: Toggle OFF, Opens Overlay

**User Actions:**
1. On /main, toggle OFF
2. Clicks "Matchmake Now"

**Expected:**
- ✅ Overlay opens
- ✅ Joins queue (overlay manages it)
- ✅ Visible to others
- ✅ Can send/receive invites

**Code Check:**
```typescript
// MatchmakeOverlay.tsx lines 569-575
if (!backgroundQueue.isBackgroundEnabled()) {
  socket.emit('presence:join');
  socket.emit('queue:join');
}
```
✅ **WORKS** - Overlay takes over when background queue OFF

---

## SCENARIO 3: Toggle OFF, Closes Overlay

**User Actions:**
1. In overlay, toggle OFF
2. Closes overlay

**Expected:**
- ❌ Leaves queue
- ❌ Not visible to others
- ❌ Can't receive calls

**Code Check:**
```typescript
// MatchmakeOverlay.tsx lines 695-699
if (!backgroundQueue.isBackgroundEnabled()) {
  socket.emit('queue:leave');
  socket.emit('presence:leave');
}
```
✅ **WORKS** - Properly leaves queue

---

## SCENARIO 4: Toggle ON, Overlay Closed, On /main

**User Actions:**
1. On /main
2. Toggles ON background queue

**Expected:**
- ✅ Joins queue (background queue)
- ✅ Visible to others
- ✅ Can receive calls on /main

**Code Check:**
```typescript
// main/page.tsx line 68-69
backgroundQueue.syncWithToggle(true);
  // → joinQueue() called
  // → emits presence:join + queue:join (lib/backgroundQueue.ts lines 289-290)
```

**ISSUE FOUND:** joinQueue() waits for socket.connected
```typescript
// backgroundQueue.ts lines 209-235
if (!this.socket.connected) {
  // Waits up to 5 seconds
  await Promise...
}
```
⚠️ **POTENTIAL ISSUE** - If socket not connected in 5s, join fails silently

---

## SCENARIO 5: Toggle ON, Navigates to /settings

**User Actions:**
1. Toggle ON on /main
2. Navigates to /settings

**Expected:**
- ✅ Stays in queue (background feature)
- ✅ Still visible to others
- ✅ Can receive calls on /settings via GlobalCallHandler

**Code Check:**
```typescript
// GlobalCallHandler mounts in layout.tsx - persists across navigation ✅
// backgroundQueue.inQueue = true (stays true) ✅
// No cleanup on navigation ✅
```
✅ **WORKS** - Queue persists

---

## SCENARIO 6: Toggle ON, Receives Call on /settings

**User Actions:**
1. Toggle ON, on /settings
2. Another user sends invite

**Expected:**
- ✅ CalleeNotification shows on /settings
- ✅ Can accept/decline
- ✅ Navigates to room on accept

**Code Check:**
```typescript
// GlobalCallHandler.tsx lines 78-79
socket.on('call:notify', handleCallNotify); // ✅ Listener active
// handleCallNotify sets incomingInvite ✅
// CalleeNotification renders (line 96) ✅
// onAccept emits call:accept (line 106) ✅
// call:start listener navigates (line 69-72) ✅
```
✅ **WORKS** - Full flow present

---

## SCENARIO 7: Toggle ON, Opens Overlay

**User Actions:**
1. Toggle ON
2. Opens matchmaking overlay

**Expected:**
- ✅ Overlay opens
- ✅ Loads queue
- ❌ Should NOT emit queue:join again (already in queue)

**Code Check:**
```typescript
// MatchmakeOverlay.tsx lines 569-575
if (!backgroundQueue.isBackgroundEnabled()) { // FALSE when toggle ON
  socket.emit('presence:join'); // SKIPPED ✅
  socket.emit('queue:join'); // SKIPPED ✅
}
```
✅ **WORKS** - No duplicate join

---

## SCENARIO 8: Toggle ON, In Overlay, Switches Tab

**User Actions:**
1. Toggle ON, overlay open
2. Switches to different tab

**Expected:**
- ✅ Stays in queue (1-min grace)
- ✅ Overlay loses presence tracking
- ✅ Background queue takes over

**Code Check:**
```typescript
// MatchmakeOverlay.tsx lines 801-805
if (socketRef.current && socketRef.current.connected && !backgroundQueue.isBackgroundEnabled()) {
  // SKIPPED when toggle ON ✅
}
// backgroundQueue visibility handler (lib/backgroundQueue.ts lines 66-94)
if (document.hidden && this.inQueue) {
  if (!this.isBackgroundEnabled()) { // FALSE
    this.leaveQueue(); // SKIPPED
    return;
  }
  // Starts 1-min countdown ✅
}
```
✅ **WORKS** - 1-min grace period

---

## SCENARIO 9: Toggle ON, Call Ends, Returns to /main

**User Actions:**
1. Toggle ON
2. In call
3. Call ends
4. Returns to /main

**Expected:**
- ✅ Still in background queue
- ✅ Can receive new calls immediately

**Code Check:**
```typescript
// Server marks available after call (server/src/index.ts lines 1843-1848) ✅
// GlobalCallHandler stays mounted ✅
// backgroundQueue.inQueue should still be true ✅

// ISSUE: What if inQueue was set to false during call?
```

⚠️ **POTENTIAL ISSUE** - Need to verify queue state persists through call

---

## SCENARIO 10: Toggle OFF → ON (while overlay open)

**User Actions:**
1. Overlay open, toggle OFF
2. Toggles ON

**Expected:**
- ✅ Joins background queue
- ✅ Stays in queue when overlay closes
- ✅ Overlay might refresh

**Code Check:**
```typescript
// main/page.tsx lines 68-69
backgroundQueue.syncWithToggle(true); // Calls joinQueue() ✅
```
✅ **WORKS** - Joins queue

---

## SCENARIO 11: Toggle ON → OFF (while overlay open)

**User Actions:**
1. Overlay open, toggle ON
2. Toggles OFF

**Expected:**
- ❌ Leaves queue
- ❌ Not visible to others
- ❌ Removed from their cards

**Code Check:**
```typescript
// main/page.tsx line 68-69
backgroundQueue.syncWithToggle(false); // Calls leaveQueue() ✅

// backgroundQueue.ts lines 306-312
this.socket.emit('queue:leave');
this.socket.emit('presence:leave'); // ✅ Emits

// Server broadcasts presence:update (online: false, available: false)

// Other clients - MatchmakeOverlay.tsx lines 593-607
socket.on('presence:update', ({ userId, online, available }) => {
  if (!online || !available) {
    setUsers(prev => prev.filter(u => u.userId !== userId)); // ✅ Removes
  }
});
```
✅ **WORKS** - User removed from cards

---

## SCENARIO 12: Toggle ON, In Call, Toggle OFF

**User Actions:**
1. Toggle ON
2. Accepts call, in room
3. Toggles OFF (if accessible)

**Expected:**
- Toggle might not be accessible in room
- If accessible, should leave queue

**Code Check:**
- Toggle only on /main page
- Not accessible in /room

✅ **N/A** - Toggle not in room page

---

## SCENARIO 13: Mobile - Background Queue ON, Switches Apps

**User Actions:**
1. Mobile user, toggle ON
2. Switches to different app

**Expected:**
- ✅ Tab hidden → 1-min grace
- ✅ Stays in queue for 1 min
- ❌ Leaves after 1 min

**Code Check:**
```typescript
// backgroundQueue.ts lines 145-148
const handlePageHide = () => {
  console.log('[BackgroundQueue] Page hidden (mobile/iOS), leaving queue immediately');
  this.leaveQueue();
};
```
❌ **ISSUE FOUND** - Mobile leaves immediately, no grace period!

---

## SCENARIO 14: PC - Background Queue ON, Minimizes Window

**User Actions:**
1. PC user, toggle ON
2. Minimizes browser window

**Expected:**
- ✅ Window blur → 1-min grace
- ✅ Stays in queue for 1 min

**Code Check:**
```typescript
// backgroundQueue.ts lines 106-133
const handleBlur = () => {
  if (this.inQueue) {
    if (!this.isBackgroundEnabled()) {
      this.leaveQueue();
      return;
    }
    // Starts 1-min countdown ✅
  }
};
```
✅ **WORKS** - 1-min grace

---

## SCENARIO 15: User Idle 5+ Minutes

**User Actions:**
1. Toggle ON
2. No mouse/keyboard activity for 5+ min

**Expected:**
- ❌ Auto-leave queue (prevent ghost users)

**Code Check:**
```typescript
// backgroundQueue.ts lines 184-190
this.visibilityCheckInterval = setInterval(() => {
  const idle = Date.now() - this.lastActivity > 5 * 60 * 1000;
  if (idle && this.inQueue) {
    this.leaveQueue();
  }
}, 30000);
```
✅ **WORKS** - Auto-leaves after 5 min idle

---

## SCENARIO 16: Profile Incomplete, Tries to Toggle ON

**User Actions:**
1. New user without photo/video
2. Tries to toggle background queue ON

**Expected:**
- ❌ Toggle disabled or warning shown

**Code Check:**
```typescript
// main/page.tsx lines 241-247
onChange={(enabled) => {
  if (enabled && !profileComplete) {
    alert('⚠️ Please upload a photo and intro video first!...');
    return;
  }
  setBackgroundQueueEnabled(enabled);
```
✅ **WORKS** - Shows alert

---

## SCENARIO 17: Toggle ON, Receives Call, Switches Tab During Notification

**User Actions:**
1. Toggle ON
2. Receives call notification (CalleeNotification shows)
3. Switches tab while notification visible

**Expected:**
- ✅ Notification persists (GlobalCallHandler in layout)
- ✅ Can still accept when tab returns

**Code Check:**
```typescript
// GlobalCallHandler mounts in layout - never unmounts ✅
// incomingInvite state persists ✅
```
✅ **WORKS** - Notification persists

---

## SCENARIO 18: Overlay Open, Profile Incomplete User Appears

**User Actions:**
1. Browsing cards in overlay
2. User without photo/video appears

**Expected:**
- Should be filtered by server
- Shouldn't appear in cards

**Code Check:**
```typescript
// Server side filtering in getQueue
// Client side - no additional filtering shown
```
⚠️ **ASSUMED** - Server filters, need to verify

---

## ISSUES FOUND:

### 1. ❌ Mobile PageHide - No Grace Period
**Location:** `lib/backgroundQueue.ts` line 146
**Issue:** Leaves immediately on app switch
**Fix Needed:** Check toggle state before leaving

### 2. ⚠️ Socket Connection Timeout
**Location:** `lib/backgroundQueue.ts` line 209
**Issue:** If socket doesn't connect in 5s, join fails silently
**Fix Needed:** Better error handling or retry

### 3. ⚠️ Queue State After Call
**Issue:** Need to verify background queue state persists through call
**Fix Needed:** Test and verify

---

## RECOMMENDED FIXES:

1. **Fix mobile pagehide** - Check toggle before leaving
2. **Remove 5s timeout** - Socket will connect when ready
3. **Add rejoin on /main load** - If toggle ON and not in queue, rejoin

Let me know which to fix.

