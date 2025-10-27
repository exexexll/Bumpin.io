# Reconnection Diagnostics - Why Calls Are Disconnecting

**Issue**: Call disconnects even though user reconnects  
**Date**: October 27, 2025

---

## 🔍 DIAGNOSTIC STEPS

### Check Railway Logs (CRITICAL)

Go to Railway Dashboard → Deployments → Logs

**Look for these patterns**:

#### Pattern 1: Successful Reconnection ✅
```
[Room] User d676c224 reported disconnection
[Room] Starting grace period for room abc12345
[Room] User d676c224 rejoined after 2500ms  ← Fast reconnect
[Room] ✅ Reconnection successful - room back to ACTIVE
[Room] Partner notified of reconnection
```
**Result**: Call continues ✅

#### Pattern 2: Slow Reconnection ❌
```
[Room] User d676c224 reported disconnection
[Room] Starting grace period for room abc12345
[Room] ⏰ Grace period EXPIRED
[Room] Disconnected user did NOT reconnect within 10 seconds (was gone 12s)
[Room] Ending call - both users will be redirected
```
**Result**: Call ends after 10s ❌

#### Pattern 3: No Reconnection Attempt ❌
```
[Room] User d676c224 reported disconnection
[Room] Starting grace period
[Room] ⏰ Grace period EXPIRED
(No room:join event received)
```
**Result**: User didn't reconnect at all ❌

---

## 🐛 POSSIBLE CAUSES

### 1. Network Issues (Most Likely)
**Symptom**: Calls disconnect randomly  
**Cause**: Actual network disconnection > 10 seconds  
**Fix**: None (real network issue)

**Check**:
- Is WiFi unstable?
- Is mobile data weak?
- Is Railway server healthy?
- Are both users on stable connections?

### 2. Socket.io Not Reconnecting Fast Enough
**Symptom**: Logs show reconnection takes > 10 seconds  
**Cause**: Socket.io reconnection backoff

**Current Settings** (`lib/socket.ts`):
```typescript
reconnectionDelay: 500,        // First retry after 500ms
reconnectionDelayMax: 2000,    // Max 2s between retries
reconnectionAttempts: Infinity // Unlimited attempts
```

**Timeline**:
- 0s: Disconnect
- 0.5s: Retry 1
- 1.5s: Retry 2  
- 3.5s: Retry 3
- 5.5s: Retry 4
- 7.5s: Retry 5
- 9.5s: Retry 6 ✅ (still within 10s grace period)

**Should work** unless network is completely down

### 3. Room Ending Too Soon
**Symptom**: Grace period < 10 seconds in practice  
**Cause**: Timer inaccuracy or server restart

**Check logs for**:
```
Grace period EXPIRED ... (was gone 5s)  ← Should be 10s!
```

If less than 10s, there's a bug.

### 4. Client Not Sending room:join
**Symptom**: No reconnection attempt in logs  
**Cause**: Socket.io reconnect handler not firing

**Check browser console for**:
```
[Socket] Transport closed
[Socket] Reconnecting...
[Socket] Reconnected successfully
[Room] ✅ Socket reconnected - rejoining room  ← Should see this
```

If missing, socket reconnection is broken.

---

## 🔧 TROUBLESHOOTING CHECKLIST

### Step 1: Check Railway Logs
```
1. Go to Railway → Deployments → Logs
2. Filter for your user ID (first 8 chars)
3. Look for "Grace period EXPIRED" messages
4. Check timing: How long was user gone?
```

### Step 2: Check Browser Console  
```
1. Open DevTools → Console
2. Refresh page during call
3. Watch for reconnection attempts
4. Should see: "Socket reconnected - rejoining room"
```

### Step 3: Test Network Stability
```
1. Check ping: ping napalmsky-production.up.railway.app
2. Check latency: <100ms good, >500ms bad
3. Try different network (WiFi vs mobile data)
```

### Step 4: Check Socket.io Health
```
Browser console:
- [Socket] Connected: true ✅
- [Socket] Transport: websocket ✅
- [Socket] Reconnect attempts: 0-5 (normal)
- [Socket] Transport closed: (check frequency)
```

---

## 🎯 EXPECTED vs ACTUAL BEHAVIOR

### Expected (Successful Reconnection):
```
Time 0s:   User disconnects
Time 0s:   Grace period starts (10s window)
Time 0.5s: Socket.io tries reconnect #1
Time 1.5s: Socket.io tries reconnect #2
Time 2s:   Socket reconnects ✅
Time 2.1s: room:join sent
Time 2.2s: Server receives room:join
Time 2.2s: Status → active
Time 2.3s: Partner notified
Result: Call continues ✅
```

### Actual (If Disconnecting):
```
Time 0s:   User disconnects
Time 0s:   Grace period starts
Time 10s:  Grace period expires ❌
Time 10s:  Room status → ended
Time 10s:  Both users redirected
Result: Call ends ❌
```

**Question**: What's happening between 0s and 10s?  
**Check logs**: Is socket reconnecting? Is room:join being sent?

---

## 📊 DIAGNOSTICS TO RUN

### Diagnostic 1: Measure Reconnection Time
Add to browser console:
```javascript
let disconnectTime = 0;
socket.on('disconnect', () => {
  disconnectTime = Date.now();
  console.log('⏱️ DISCONNECT at', new Date().toISOString());
});

socket.on('reconnect', () => {
  const duration = Date.now() - disconnectTime;
  console.log(`⏱️ RECONNECTED after ${duration}ms (${duration/1000}s)`);
  if (duration > 10000) {
    console.error('❌ TOO SLOW! Took longer than grace period!');
  }
});
```

### Diagnostic 2: Monitor Grace Period
Railway logs should show:
```
[Room] Starting grace period (ends at: 2025-10-27T05:45:32.123Z)
...
[Room] User rejoined at: 2025-10-27T05:45:29.456Z  ← Within window ✅
```

Or:
```
[Room] Starting grace period (ends at: 2025-10-27T05:45:32.123Z)
...
[Room] Grace period EXPIRED at: 2025-10-27T05:45:32.124Z  ← Timeout hit ❌
```

---

## 🛠️ POTENTIAL FIXES

### If Reconnection Takes > 10 Seconds:

#### Option 1: Increase Grace Period
```typescript
// server/src/index.ts line 1295
room.gracePeriodExpires = Date.now() + 20000; // 20 seconds (was 10)
```
**Pros**: More time to reconnect  
**Cons**: Longer wait for partner

#### Option 2: Faster Socket.io Reconnection
```typescript
// lib/socket.ts
reconnectionDelay: 200,     // First retry after 200ms (was 500ms)
reconnectionDelayMax: 1000, // Max 1s between retries (was 2s)
```
**Pros**: Reconnects faster  
**Cons**: More aggressive retry

#### Option 3: Manual room:join on Disconnect Detection
```typescript
// app/room/[roomId]/page.tsx
if (pc.connectionState === 'disconnected') {
  // Immediately try to rejoin room (don't wait for socket reconnect)
  socketRef.current?.emit('room:join', { roomId });
}
```
**Pros**: Proactive reconnection  
**Cons**: Might send duplicate joins

---

## ✅ WHAT'S ALREADY WORKING

Based on code review:

1. ✅ **Grace Period**: 10 seconds configured
2. ✅ **Socket Reconnection**: Handler registered
3. ✅ **room:join**: Sent on reconnect
4. ✅ **Status Change**: active → grace_period → active
5. ✅ **Timeout Cancellation**: Cleared on reconnect
6. ✅ **Partner Notification**: Sent after reconnect
7. ✅ **Popup Timing**: 1s delay to prevent false alerts

---

## 📝 ACTION ITEMS

1. **Check Railway Logs** (MOST IMPORTANT):
   - Are users reconnecting within 10s?
   - Are room:join events being received?
   - What's the actual reconnection timing?

2. **Test Network Stability**:
   - Try on stable WiFi
   - Check if issue persists

3. **Monitor Browser Console**:
   - Are socket reconnections happening?
   - Are room:join events being sent?

4. **If Consistently Failing**:
   - Consider increasing grace period to 20s
   - OR speed up socket reconnection delays

---

## 🎯 NEXT STEPS

**If you see in logs: "was gone 2s"** → Socket.io reconnection is working ✅  
**If you see in logs: "was gone 12s"** → Socket.io is too slow, need to optimize ⚠️  
**If you see no reconnection logs** → Socket.io not reconnecting at all ❌

**Send me the Railway logs from a failed reconnection** and I can pinpoint the exact issue!

