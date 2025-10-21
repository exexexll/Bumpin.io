# 🔍 Final Debug Checklist - Two Active Issues

---

## Issue 1: Location Badge Not Showing

### Check Backend Logs (Railway):

Look for these lines when someone opens matchmaking:
```
[Queue API] 📍 Current user has location, calculating distances...
[Queue API] 📍 Sorted by distance: X users with location
[Queue API] 📍 UserName: nearby (0m)  ← Should see this!
```

If you DON'T see these logs:
- Backend location sorting isn't running
- User doesn't have location in DB

### Check Frontend Console (Browser F12):

After loading queue, check:
```javascript
// In console, when viewing matchmaking:
console.log(users[0]); 
// Should show: { distance: 0, hasLocation: true, ... }
```

If distance/hasLocation are missing:
- Backend isn't sending them
- Frontend API not receiving them

### Quick Test:

Open browser console and run:
```javascript
// Check if formatDistance function works:
const { formatDistance } = window;
console.log(formatDistance(0));    // Should: "nearby"
console.log(formatDistance(100));  // Should: "within 100 ft"
```

---

## Issue 2: Call End Doesn't Redirect

### Check When Timer Reaches 0:

Browser console should show:
```
[Timer] ⏱️ Countdown: 3 seconds remaining
[Timer] ⏱️ Countdown: 2 seconds remaining
[Timer] ⏱️ Countdown: 1 seconds remaining
[Timer] ⏰ Time expired - ending call
[Room] 🔴 handleEndCall called - ending video call
[Room] Emitting call:end to server for room: abc123
[Room] 🧹 Cleaning up WebRTC connections...
[Room] ✅ Cleanup complete
```

Then should see:
```
[Room] Session finalized: session_123
```

If you DON'T see "Session finalized":
- Server isn't sending session:finalized
- Socket disconnected before receiving
- Mobile browser backgrounded the tab

### Check Railway Logs:

Should see:
```
[Room] Emitting session:finalized to room abc123
[Room] Direct emit to user1 socket: xyz
[Room] Direct emit to user2 socket: xyz
```

---

## Most Likely Causes:

**Location Badge:**
- Backend calculates but frontend doesn't receive
- Check API response in Network tab

**Call End:**
- Mobile browser backgrounds tab during call
- WebSocket disconnects
- session:finalized lost

---

Next: Add extensive frontend logging to see exact data received.

