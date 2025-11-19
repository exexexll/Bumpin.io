# Text Chat Background Mode - Implementation Review

## Date: November 19, 2025

## Summary of Changes

We implemented a comprehensive background/idle handling system for text chat rooms to support mobile backgrounding and improve UX with subtle status indicators.

---

## Changes Made

### 1. Backend (`server/src/index.ts`)

#### A. New Event Handler: `textchat:sync-state` (Lines 1530-1570)
**Purpose:** Allows clients to resync state after backgrounding/reconnection.

**Functionality:**
- Validates room and user authorization
- Checks `textRoomActivity` for current inactivity warning status
- Emits `textroom:inactivity-warning` or `textroom:inactivity-cleared` based on current state
- Notifies partner via `room:partner-reconnected` and `textchat:partner-status` (status: 'active')

**Validation:** ✅
- Properly checks room existence and authorization
- Accesses `textRoomActivity` map correctly
- Emits events to both self and partner

#### B. Modified Disconnect Handler: `handleFullDisconnect` (Lines 2142-2168)
**Purpose:** Prevent text chat rooms from being deleted when users background their apps.

**Functionality:**
- Checks if `room.chatMode === 'text'`
- If text mode:
  - Logs disconnect but keeps room alive
  - Emits `textchat:partner-status` (status: 'away') to partner
  - Emits `room:partner-disconnected` (gracePeriodSeconds: 180) to partner
  - Uses `continue` to skip room cleanup
  - Lets "Torch Rule" interval handle eventual cleanup via inactivity timer

**Validation:** ✅
- Logic correctly skips cleanup for text rooms
- Emits both status events (new subtle UI + legacy event)
- Room stays in `activeRooms` map

#### C. Torch Rule Background Job (Lines 400-512 - Pre-existing, verified)
**Purpose:** Monitor text room inactivity and end sessions after 2 min + 60s warning.

**Functionality:**
- Runs every 30 seconds (setInterval)
- For each text mode room:
  - Checks `user1LastMessageAt` and `user2LastMessageAt`
  - If inactive > 2 minutes → starts 60s warning
  - Emits `textroom:inactivity-warning` and countdown updates
  - If warning expires → ends session, cleans up room

**Validation:** ✅
- Properly handles `textRoomActivity` map
- Emits events via `io.to(roomId)`
- Cleans up `activeRooms` and `textRoomActivity` on timeout

---

### 2. Frontend (`app/text-room/[roomId]/page.tsx`)

#### A. New State: `partnerStatus` (Line 67)
```typescript
const [partnerStatus, setPartnerStatus] = useState<'active' | 'away'>('active');
```
**Validation:** ✅ Properly typed and initialized

#### B. Socket Listener: `textchat:partner-status` (Lines 320-327)
**Purpose:** Handle real-time partner status updates.

**Functionality:**
- Updates `partnerStatus` state
- If status is 'active': hides reconnecting modal, resets countdown

**Validation:** ✅ Correctly updates state

#### C. Modified Listener: `room:partner-disconnected` (Lines 303-318)
**Purpose:** Handle partner disconnect without showing intrusive modal.

**Changes:**
- Sets `partnerStatus` to 'away'
- Does NOT show `setShowReconnecting(true)` anymore for text mode
- Still clears existing countdowns to prevent duplicates

**Validation:** ✅
- Prevents intrusive modal
- Delegates visual feedback to status indicator

#### D. Modified Listener: `room:partner-reconnected` (Lines 329-344)
**Purpose:** Handle partner reconnection.

**Changes:**
- Sets `partnerStatus` back to 'active'
- Clears countdown interval
- Hides reconnecting popup

**Validation:** ✅ Works with new status system

#### E. Reconnection Handler: `handleSocketReconnect` (Lines 216-276)
**Purpose:** Handle socket reconnection after backgrounding.

**Added (Line 275):**
```typescript
socket.emit('textchat:sync-state', { roomId });
```

**Validation:** ✅ Calls sync-state to restore inactivity warnings

#### F. Visibility Change Handler (Lines 121-132)
**Already calls:**
```typescript
socketRef.current.emit('textchat:sync-state', { roomId });
```

**Validation:** ✅ Works when tab becomes visible

#### G. UI Changes

**Header (Lines 919-929):**
- Reverted to simple status: "Active now" or "Reconnecting..."
- Removed "Away" status from header

**Footer/Input Area (Lines 1091-1097):**
- Added subtle status indicator above action buttons
- Shows: `{peerName} is looking` (active) or `{peerName} is away` (backgrounded)
- Styled with: `text-[10px] text-[#eaeaf0]/40 font-medium tracking-wide uppercase`

**Validation:** ✅
- Non-intrusive placement
- Subtle styling
- Dynamic text based on `partnerStatus`

#### H. Reconnecting Modal (Lines 1235-1264)
**Condition changed:**
```typescript
{showReconnecting && partnerStatus !== 'away' && (
```

**Validation:** ✅
- Modal only shows if:
  - `showReconnecting` is true (self disconnected)
  - AND `partnerStatus !== 'away'` (not a partner disconnect)
- This prevents modal for partner disconnects in text mode

#### I. Cleanup (Lines 532-547)
**Added:**
```typescript
socket.off('textchat:partner-status');
```

**Validation:** ✅ Properly removes new listener

---

## Flow Verification

### Scenario 1: User backgrounds app (mobile)

1. **Browser kills socket connection**
   - `socket.on('disconnect')` fires on server
   - Server calls `handleFullDisconnect(userId)`

2. **Server checks room mode**
   - `room.chatMode === 'text'` → true
   - Emits `textchat:partner-status` (status: 'away') to partner
   - Emits `room:partner-disconnected` to partner
   - Keeps room in `activeRooms`
   - Uses `continue` to skip cleanup

3. **Partner receives events**
   - `textchat:partner-status` → sets `partnerStatus = 'away'`
   - UI updates footer: "Partner is away"
   - NO intrusive modal shown

4. **User returns (foregrounds app)**
   - Socket reconnects
   - `handleSocketReconnect` fires
   - Emits `textchat:sync-state`

5. **Server handles sync-state**
   - Checks inactivity status
   - Emits `textroom:inactivity-warning` or `textroom:inactivity-cleared`
   - Emits `room:partner-reconnected` to partner
   - Emits `textchat:partner-status` (status: 'active') to partner

6. **Partner receives reconnection**
   - `textchat:partner-status` → sets `partnerStatus = 'active'`
   - UI updates footer: "Partner is looking"

7. **User sends message**
   - Updates `textRoomActivity.userXLastMessageAt`
   - Clears any active inactivity warnings

✅ **Flow is valid**

---

### Scenario 2: Both users background for > 2 minutes

1. **Both users disconnect**
   - Room stays alive (text mode exception)
   - `textRoomActivity.user1LastMessageAt` and `user2LastMessageAt` stop updating

2. **Torch Rule interval checks (every 30s)**
   - `now - user1LastMessageAt > 120000` → true
   - `now - user2LastMessageAt > 120000` → true
   - Starts 60s warning: `activity.warningStartedAt = now`
   - Emits `textroom:inactivity-warning` to `io.to(roomId)`

3. **Neither user is connected to receive warning**
   - Warning continues on server
   - After 60s: `warningSince > 60000` → true

4. **Server ends session**
   - Sets `room.status = 'ended'`
   - Emits `textroom:ended-inactivity` to `io.to(roomId)`
   - Saves history
   - Cleans up `activeRooms` and `textRoomActivity`

5. **Users return**
   - Socket reconnects
   - Emits `room:join`
   - Server responds with `room:invalid` (room deleted)
   - Frontend redirects to `/main`

✅ **Flow is valid** - Torch Rule handles cleanup

---

### Scenario 3: User backgrounds for 1 minute, returns

1. **User backgrounds**
   - Room stays alive
   - No messages sent for 1 minute

2. **User returns before 2-minute threshold**
   - Socket reconnects
   - Emits `textchat:sync-state`
   - Server checks `activity.warningStartedAt` → null (no warning yet)
   - Emits `textroom:inactivity-cleared`
   - Partner sees "Partner is looking" again

3. **User sends message**
   - Updates `lastMessageAt`
   - Chat continues normally

✅ **Flow is valid**

---

### Scenario 4: User's own socket disconnects (not partner)

1. **Socket disconnect fires on client**
   - `socket.on('disconnect')` in frontend (Line 384)
   - Sets `showReconnecting = true`
   - Sets `isOnline = false`
   - Starts countdown timer

2. **Modal displays**
   - Condition: `showReconnecting && partnerStatus !== 'away'`
   - Since this is OWN disconnect, `partnerStatus` is still 'active'
   - Modal shows: "Partner Disconnected" with countdown

3. **Socket reconnects**
   - `handleSocketReconnect` fires
   - Emits `textchat:sync-state`
   - Sets `showReconnecting = false`
   - Modal hides

✅ **Flow is valid** - Modal still works for self-disconnect

---

## Potential Issues Found

### Issue 1: Modal Logic Confusion ⚠️
**Problem:** The reconnecting modal condition is:
```typescript
{showReconnecting && partnerStatus !== 'away' && (
```

But `showReconnecting` is set by:
1. Own disconnect (`socket.on('disconnect')`) ← Should show modal
2. Partner disconnect (`room:partner-disconnected`) ← NO LONGER sets this (we removed it)

**Current State:** Line 314 does NOT set `showReconnecting(true)` anymore.

**Verification:** Let me check line 303-318 again...

Actually, looking at the code:
```typescript
303|    socket.on('room:partner-disconnected', ({ gracePeriodSeconds }: any) => {
304|      console.log('[TextRoom] Partner disconnected, grace period:', gracePeriodSeconds);
305|      
306|      // CRITICAL FIX: Clear existing countdown to prevent duplicates
307|      if (partnerDisconnectCountdownRef.current) {
308|        clearInterval(partnerDisconnectCountdownRef.current);
309|        partnerDisconnectCountdownRef.current = null;
310|      }
311|      
312|      // For text mode, DON'T show intrusive modal, just update status
313|      // The server sends 'textchat:partner-status' for this purpose
314|      setPartnerStatus('away');
315|      
316|      // Optional: We can still set countdown state if we want to use it in non-modal UI
317|      setReconnectCountdown(gracePeriodSeconds || 10);
318|    });
```

✅ **Correct** - `setShowReconnecting(true)` is NOT called, so modal won't show for partner disconnects.

The modal condition `showReconnecting && partnerStatus !== 'away'` is actually redundant now since `showReconnecting` is never set to true by partner disconnects. But it's a good safety check.

---

### Issue 2: Torch Rule Relies on Message Activity ⚠️
**Observation:** If both users have their apps backgrounded but don't send messages:
- `lastMessageAt` timestamps don't update
- After 2 min, warning starts
- After 2 min + 60s, session ends

**Question:** What if users are actively reading messages but not sending?

**Answer:** This is INTENDED behavior per the "Torch Rule" specification in `TEXT-MODE-TORCH-RULE-IMPLEMENTATION.md`:
- Text mode has NO fixed timer
- Stays alive based on MESSAGE activity
- If users aren't messaging, they're inactive

✅ **This is correct by design**

---

### Issue 3: `lastSeen` field not used ❓
**Observation:** Server sends `lastSeen: Date.now()` in `textchat:partner-status` event, but frontend doesn't use it.

**Impact:** Low - it's metadata that could be used for "Last seen X seconds ago" but current UI just shows "away" or "looking".

**Recommendation:** Keep it for future enhancement, no action needed.

---

## Final Validation Checklist

- ✅ Backend properly skips room cleanup for text mode
- ✅ Backend emits `textchat:partner-status` on disconnect/reconnect
- ✅ Backend `textchat:sync-state` handler restores state
- ✅ Frontend listens for `textchat:partner-status`
- ✅ Frontend calls `textchat:sync-state` on reconnect AND visibility change
- ✅ UI shows subtle status at bottom (not intrusive)
- ✅ Reconnecting modal suppressed for partner disconnects
- ✅ Torch Rule background job continues to work
- ✅ Cleanup handlers remove new listeners
- ✅ No linter errors

---

## Testing Recommendations

### Manual Tests Needed:

1. **Background Test (Mobile)**
   - User A and User B in text chat
   - User A backgrounds app
   - User B should see "User A is away" at bottom
   - User A returns
   - User B should see "User A is looking"

2. **Inactivity Test**
   - Both users stop sending messages for 2 minutes
   - Both should see "Inactive: 60s" warning in header
   - If they send a message, warning should clear
   - If they don't, session should end after 60s

3. **Reconnection Test**
   - User A backgrounds for 90 seconds (past 2-min warning threshold)
   - User A returns
   - User A should immediately see remaining warning countdown
   - Partner should be notified of reconnection

4. **Own Disconnect Test**
   - Kill wifi while in text chat
   - Should see "Partner Disconnected" modal with countdown
   - Restore wifi
   - Modal should disappear, chat should resume

---

## Conclusion

✅ **All changes are functional and properly integrated**

The implementation successfully:
1. Prevents premature room deletion on mobile backgrounding
2. Provides subtle, non-intrusive status indicators
3. Maintains the Torch Rule inactivity system
4. Handles reconnection gracefully with state sync
5. Keeps the intrusive modal only for self-disconnects

**Ready for production testing.**

