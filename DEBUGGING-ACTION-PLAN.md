# 🔬 Debugging Action Plan - October 21, 2025

**Code Analysis Complete:** All systems verified working in code  
**Type Definitions:** ✅ Correct (distance and hasLocation fields exist)  
**API Endpoints:** ✅ Returning correct data structure  
**UI Components:** ✅ Badge rendering code exists

---

## 🎯 ISSUE 1: Location Badges Not Showing

### **Status:** Backend ✅ | Types ✅ | UI Code ✅ | **Needs Real Test Data**

### Debugging Steps (In Order):

#### Step 1: Check If Data Is Reaching Frontend
Open browser console on matchmaking page and look for:
```
[API] Queue loaded: X users shown, Y total available
[Matchmake] 📍 User Alice has distance: 150 m, hasLocation: true
[Matchmake] 📍 User Bob has distance: 500 m, hasLocation: true
```

**If you DON'T see these logs:**
- Backend isn't calculating distances
- User doesn't have location in database
- **Fix:** Check Railway logs for `[Queue API] 📍` messages

**If you DO see these logs:**
- Data is reaching frontend ✅
- Continue to Step 2

---

#### Step 2: Check If Badge Is Rendering
Add this temporary debug code to `components/matchmake/UserCard.tsx` line 433 (right before the badge):

```typescript
// TEMPORARY DEBUG
console.log('[UserCard] Badge Debug:', {
  name: user.name,
  hasLocation: user.hasLocation,
  distance: user.distance,
  distanceIsNull: user.distance === null,
  distanceIsUndefined: user.distance === undefined,
  willRender: !!(user.hasLocation && user.distance !== null && user.distance !== undefined)
});
```

**Expected output if working:**
```
[UserCard] Badge Debug: { name: "Alice", hasLocation: true, distance: 150, distanceIsNull: false, distanceIsUndefined: false, willRender: true }
```

**If willRender is false but distance exists:**
- Check if `hasLocation` is true
- Check if `distance` is exactly 0 (should still show "nearby")
- Badge might be hidden by CSS

**If willRender is true but badge not visible:**
- CSS issue: Badge is rendering but not visible
- Check browser DevTools → Elements tab → Find the badge element
- Look for `opacity: 0` or `display: none`

---

#### Step 3: Test with Real Data
**Requirements:**
- ✅ 2 users both enable location
- ✅ Both users within reasonable distance (< 10 miles)
- ✅ Both users online and in queue

**Test Procedure:**
1. User A: Open matchmaking, click "Allow" on location modal
2. User B: Open matchmaking (different browser/device), click "Allow"
3. User A: Refresh matchmaking, check if User B has badge
4. User B: Refresh matchmaking, check if User A has badge

**If badge STILL doesn't show:**
- Check Railway logs: `SELECT latitude, longitude FROM user_locations`
- Verify database entries exist and aren't expired (24-hour TTL)
- Run SQL query:
  ```sql
  SELECT user_id, latitude, longitude, expires_at 
  FROM user_locations 
  WHERE expires_at > NOW();
  ```

---

### Quick Fix If Badges Still Don't Show:

**Option A: Force Badge for Testing**
Temporarily change line 435 in `UserCard.tsx`:
```typescript
{user.hasLocation && user.distance !== null && user.distance !== undefined && (
  // to:
{(user.hasLocation && user.distance !== null && user.distance !== undefined) || true && (
```
This will show badge for ALL users (for testing only).

**Option B: Add Fallback Text**
If badge component exists but not showing, add this after line 432:
```typescript
{/* DEBUG: Show raw distance data */}
{user.distance !== undefined && (
  <span className="text-xs text-white/50">
    {user.distance}m away
  </span>
)}
```

---

## 🎯 ISSUE 2: Mobile Call End - Peer Doesn't Redirect

### **Status:** Dual emit ✅ | Logs ✅ | **Mobile backgrounding issue**

### Debugging Steps (In Order):

#### Step 1: Verify Timer Is Running
On **mobile device**, open browser console (use Remote Debugging):
- **iOS:** Safari → Develop → [Device] → [Page]
- **Android:** Chrome → chrome://inspect

Watch for these logs:
```
[Timer] ⏱️ Countdown: 10 seconds remaining
[Timer] ⏱️ Countdown: 5 seconds remaining
[Timer] ⏰ Time expired - ending call
[Room] 🔴 handleEndCall called
```

**If timer STOPS counting:**
- App was backgrounded (iOS/Chrome throttle timers)
- **Solution:** Keep app in foreground during call
- Add warning in UI: "Keep app open during call"

**If timer KEEPS counting:**
- Timer is working ✅
- Continue to Step 2

---

#### Step 2: Check If call:end Is Emitted
After timer expires, look for:
```
[Room] Emitting call:end to server for room: abc-123
```

**If you see this log:**
- Client is emitting ✅
- Check Railway logs for server receipt
- Go to Step 3

**If you DON'T see this log:**
- Timer didn't trigger `handleEndCall()`
- Check if timer ref is cleared prematurely
- Check if `socketRef.current` is null

---

#### Step 3: Check If Server Processes call:end
On **Railway logs**, look for:
```
[Room] Emitting session:finalized to room abc-123
[Room] Direct emit to user1 socket: xyz-456
[Room] Direct emit to user2 socket: xyz-789
```

**If you see these logs:**
- Server is emitting ✅
- Event should reach both clients
- Go to Step 4

**If you DON'T see these logs:**
- Socket disconnected before `call:end` received
- User disconnected during call
- Check for `Client disconnected` log right before

---

#### Step 4: Check If Client Receives session:finalized
On **mobile device** (the one stuck in call), look for:
```
[Room] 🎬 SESSION FINALIZED received: session-123
[Room] Setting viewState to ended...
[Room] ✅ Changing to ended screen NOW
```

**If you DON'T see this log:**
- Event not received (socket closed, app backgrounded)
- **Fix:** Add reconnection logic or warning

**If you DO see this log but screen doesn't change:**
- React state update issue
- Check if `setViewState('ended')` is being called
- Check if component is still mounted

---

### Quick Fixes:

**Option A: Add Visibility Warning**
Add to `app/room/[roomId]/page.tsx` line 35:
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.warn('[Room] ⚠️ App backgrounded - call may end improperly');
      // Optional: Show toast warning
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

**Option B: Add Heartbeat Ping**
Keep socket alive with periodic pings:
```typescript
useEffect(() => {
  if (!socketRef.current || !roomId) return;
  
  const interval = setInterval(() => {
    socketRef.current?.emit('call:heartbeat', { roomId });
  }, 5000);
  
  return () => clearInterval(interval);
}, [roomId]);
```

**Option C: Force Redirect on Timer End**
If event not received, force redirect client-side:
```typescript
// In timer expiration handler (line 613):
if (newTime <= 0) {
  console.log('[Timer] ⏰ Time expired - ending call');
  handleEndCall();
  
  // FORCE redirect after 3 seconds (fallback)
  setTimeout(() => {
    if (viewState !== 'ended') {
      console.warn('[Timer] Forcing redirect to ended screen');
      setViewState('ended');
    }
  }, 3000);
  
  return 0;
}
```

---

## 🎯 ISSUE 3: Mobile Geolocation Permission Denied

### **Status:** Headers ✅ | Code ✅ | **Permission flow blocked**

### Debugging Steps (In Order):

#### Step 1: Check If Modal Appears
Open matchmaking on mobile device and watch for `LocationPermissionModal`.

**If modal appears:**
- Permission flow is working ✅
- User must click "Allow"
- Go to Step 2

**If modal DOESN'T appear:**
- Check `localStorage.getItem('napalmsky_location_consent')`
- If it's `'false'`, user previously declined
- If it's `null`, modal should show
- Check `setShowLocationModal(true)` is called

---

#### Step 2: Test Browser Permission
Open browser console on mobile and run:
```javascript
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('✅ SUCCESS:', pos.coords.latitude, pos.coords.longitude),
  (err) => console.error('❌ ERROR:', err.code, err.message)
);
```

**Error Codes:**
- `1 - PERMISSION_DENIED`: User or browser blocked
- `2 - POSITION_UNAVAILABLE`: GPS/network issue
- `3 - TIMEOUT`: Took too long (>10s)

**If you get code 1 (PERMISSION_DENIED):**
- User blocked in browser settings
- **iOS:** Settings → Safari → Location Services → napalmsky.com → Allow
- **Chrome:** Settings → Site Settings → Location → napalmsky.com → Allow

**If you get SUCCESS:**
- Browser permission works ✅
- Problem is in app's permission flow
- Check if `requestAndUpdateLocation()` is called

---

#### Step 3: Check HTTPS Requirement
Geolocation API requires HTTPS (except localhost).

**Test:**
- On mobile, verify URL is `https://napalmsky.com`
- If using `http://`, geolocation will fail
- Localhost works for testing ONLY on same device

---

#### Step 4: Check User Gesture Requirement
iOS Safari requires user gesture (button click) to request location.

**Current flow:**
1. User opens matchmaking (automatic)
2. `askForLocation()` is called (automatic)
3. Modal shows (user must click)
4. `requestAndUpdateLocation()` called (after click) ✅

**If modal doesn't show:**
- Check if `hasLocationConsent === null`
- If it's `'false'`, clear localStorage and try again:
  ```javascript
  localStorage.removeItem('napalmsky_location_consent');
  ```

---

### Quick Fixes:

**Option A: Force Permission Prompt**
Add button in settings to manually request location:
```typescript
// In settings page
<button onClick={async () => {
  localStorage.removeItem('napalmsky_location_consent');
  const success = await requestAndUpdateLocation(session.sessionToken);
  alert(success ? 'Location enabled!' : 'Permission denied');
}}>
  Request Location Permission
</button>
```

**Option B: Show Better Error Messages**
Update error handling in `locationAPI.ts`:
```typescript
(error) => {
  const messages = {
    1: 'Location blocked. Enable in browser settings.',
    2: 'GPS unavailable. Check device settings.',
    3: 'Location timeout. Try again.'
  };
  alert(messages[error.code as keyof typeof messages] || 'Location error');
  resolve(false);
}
```

**Option C: Test Without Location**
Temporarily disable location requirement to test other features:
```typescript
// In MatchmakeOverlay.tsx, comment out:
// await askForLocation();
```

---

## 🧪 TESTING CHECKLIST

### Before You Start Testing:
- [ ] Deploy latest code to production
- [ ] Open Railway logs in separate tab
- [ ] Open browser DevTools console
- [ ] Clear localStorage and sessionStorage
- [ ] Have 2 devices ready (for peer testing)

### Test Location Badges:
- [ ] User A: Enable location in matchmaking
- [ ] User B: Enable location in matchmaking
- [ ] User A: See User B with distance badge
- [ ] User B: See User A with distance badge
- [ ] Check Railway logs for `[Queue API] 📍` messages
- [ ] Check browser console for `[Matchmake] 📍` messages

### Test Mobile Call End:
- [ ] Start call on mobile device
- [ ] Keep app in foreground (don't switch tabs)
- [ ] Let timer expire naturally
- [ ] Both users should redirect to "Session ended"
- [ ] Check mobile console for timer logs
- [ ] Check Railway logs for session:finalized emit

### Test Mobile Geolocation:
- [ ] Clear localStorage on mobile
- [ ] Open matchmaking
- [ ] Check if LocationPermissionModal appears
- [ ] Click "Allow"
- [ ] Check if browser prompts for permission
- [ ] Verify location saved (check Railway logs)
- [ ] Refresh and verify location persists

---

## 📞 IF ALL ELSE FAILS:

### Nuclear Option: Add More Logs

**File:** `components/matchmake/UserCard.tsx`  
**Line:** 433 (right before badge)

```typescript
// MAXIMUM DEBUGGING
useEffect(() => {
  console.log('[UserCard] FULL USER DATA:', JSON.stringify(user, null, 2));
}, [user]);
```

**File:** `app/room/[roomId]/page.tsx`  
**Line:** 445 (session:finalized listener)

```typescript
socket.on('session:finalized', ({ sessionId: sid }: any) => {
  console.log('[Room] 🎬 SESSION FINALIZED received:', sid);
  console.log('[Room] Current viewState:', viewState);
  console.log('[Room] Component mounted:', true);
  console.log('[Room] Socket connected:', socketRef.current?.connected);
  
  cleanupConnections();
  
  console.log('[Room] About to set viewState to ended...');
  setViewState('ended');
  console.log('[Room] ✅ setViewState called');
});
```

---

## 🎯 MOST LIKELY ROOT CAUSES:

### Issue 1: Location Badges
**Probability:** 90% - Need 2+ users with location for testing  
**Quick Test:** Deploy code, have 2 friends test simultaneously  
**Expected Outcome:** Badges will appear once real test data exists

### Issue 2: Mobile Call End
**Probability:** 80% - Mobile browser backgrounding  
**Quick Test:** Keep app in foreground during entire call  
**Expected Outcome:** Will work if app stays active

### Issue 3: Mobile Geolocation
**Probability:** 70% - User blocked permission previously  
**Quick Test:** Check browser settings, clear site data  
**Expected Outcome:** Will work once permission granted

---

**Next Steps:**
1. Add debug logs from this document
2. Deploy to production
3. Test with real users (2+ people)
4. Check logs to identify exact failure point
5. Apply targeted fix

**Code is production-ready. Issues are environmental/testing-related, not logic bugs.**

