# Text Mode Reconnection Pipeline - Complete Analysis

## 🔍 CURRENT IMPLEMENTATION STAGES

### Stage 1: User WiFi Disconnects
**What SHOULD happen**:
```
User A's WiFi drops
  ↓
Socket.io detects disconnect
  ↓
Client: socket.on('disconnect') fires
  ↓
Client: Shows reconnecting banner
  ↓
Server: Socket disconnect event fires
  ↓
Server: Starts 10s grace period
  ↓
Server: Notifies partner: room:partner-disconnected
```

**What's CURRENTLY in code** (app/text-room/[roomId]/page.tsx lines 175-179):
```typescript
socket.on('disconnect', (reason) => {
  console.log('[TextRoom] Socket disconnected:', reason);
  setShowReconnecting(true);
  setReconnectCountdown(10);
});
```
✅ Shows reconnecting banner locally

**Server side** (server/src/index.ts lines 1621-1654):
- Finds user's active room
- Marks user as disconnected
- Sets grace period
- Emits `room:partner-disconnected` to partner
✅ Implemented

**ISSUE**: Partner doesn't see banner immediately
**ROOT CAUSE**: Partner event might not be emitting correctly

---

### Stage 2: WiFi Comes Back On (< 10s)
**What SHOULD happen**:
```
User A's WiFi reconnects
  ↓
Socket.io auto-reconnects
  ↓
Client: socket.on('reconnect') or socket.on('connect') fires
  ↓
Client: Rejoins room: socket.emit('room:join')
  ↓
Server: Validates room still in grace period
  ↓
Server: Marks user as reconnected
  ↓
Server: Emits room:partner-reconnected
  ↓
Both users: Hide reconnecting banner
```

**What's in code**:

**Client** (lines 84-96):
```typescript
socket.on('connect', () => {
  setShowReconnecting(false); // ✅ Added
  socket.emit('room:join', { roomId });
});

socket.on('reconnect', () => {
  setShowReconnecting(false); // ✅ Added  
  socket.emit('room:join', { roomId });
});
```

**Client** (lines 129-131):
```typescript
socket.on('room:partner-reconnected', () => {
  setShowReconnecting(false);
});
```
✅ Hides banner when partner reconnects

**Server** (server/src/index.ts lines 1046-1052):
```typescript
if (room.status === 'grace_period') {
  // Reconnection successful
  room.status = 'active';
  room.user1Connected = true / user2Connected = true;
  
  // Notify partner
  io.to(roomId).emit('room:partner-reconnected', { userId });
}
```
✅ Should work

**ISSUE**: User says they couldn't reconnect after tab refresh

---

### Stage 3: Tab Reload During Active Chat
**What SHOULD happen**:
```
User A refreshes tab
  ↓
Page reloads
  ↓
Socket connects (new connection)
  ↓
socket.emit('room:join', { roomId })
  ↓
Server: Room still active (or in grace period)
  ↓
Server: Allows rejoin
  ↓
Messages reload from database
  ↓
Chat continues
```

**What's in code**:
✅ sessionStorage stores roomId
✅ Socket emit('room:join') on mount
✅ Server allows rejoin if in grace period
✅ Messages load from database

**POTENTIAL ISSUE**: If grace period expired (> 10s), room is deleted, rejoin fails

---

## 🐛 ISSUES IDENTIFIED

### Issue 1: Partner Not Seeing Reconnection Immediately
**Problem**: When User A disconnects, User B doesn't see banner right away

**Root Cause**: Server emits to `partnerSocketId` but might not be finding it correctly

**Server code** (lines 1642-1650):
```typescript
const partnerSocketId = activeSockets.get(
  userRoom.user1 === currentUserId ? userRoom.user2 : userRoom.user1
);
if (partnerSocketId) {
  io.to(partnerSocketId).emit('room:partner-disconnected', {
    gracePeriodSeconds: 10,
  });
}
```

**FIX NEEDED**: Add more logging to verify partner socket ID is found

---

### Issue 2: Tab Refresh Doesn't Reconnect
**Problem**: After refresh, can't rejoin room

**Possible Causes**:
1. Grace period expired before refresh (> 10s)
2. Room was deleted
3. Server not allowing rejoin
4. Different issue

**FIX NEEDED**: 
- Extend grace period to 30s for text mode (gives time to refresh)
- Or persist room state to database (survives restarts)

---

### Issue 3: GIF URL Validation Failing
**Problem**: Backend rejects `static.klipy.com` URLs

**Klipy returns**: `https://static.klipy.com/ii/.../file.gif`
**Backend allows**: Only `media.klipy.com`, `klipy.com`, `api.klipy.com`

**FIX**: Add `static.klipy.com` to regex ✅ DONE

---

## ✅ FIXES TO APPLY

1. ✅ Add `static.klipy.com` to URL validator
2. ✅ Add scrollbar to GIF picker  
3. ✅ Hide reconnecting banner on successful reconnect
4. ⚠️ Need to verify partner notification works
5. ⚠️ Need to extend grace period or improve rejoin logic

---

## 🧪 TESTING PIPELINE

### Test 1: WiFi Off/On (< 10s)
1. Start text chat
2. Turn off WiFi
3. **Expected**: "Partner Disconnected" banner appears
4. Turn WiFi back on within 10s
5. **Expected**: Banner disappears, chat continues

### Test 2: Tab Refresh During Chat
1. Start text chat
2. Refresh tab (Cmd+R)
3. **Expected**: Page reloads, messages appear, chat continues

### Test 3: WiFi Off/On Partner View
1. User A and B in chat
2. User A turns off WiFi
3. **Expected**: User B sees "Partner Disconnected (10s countdown)"
4. User A turns WiFi back on
5. **Expected**: User B sees banner disappear

---

Next: Apply all fixes and test carefully.

