RECONNECTION LOGIC - COMPLETE EDGE CASE ANALYSIS
================================================

## VIDEO ROOM (WebRTC) RECONNECTION

### Socket Reconnection
File: app/room/[roomId]/page.tsx (lines 675-719)

Edge Cases:
-----------
1. ✅ Partner socket disconnects
   - Shows "Partner reconnecting..." modal
   - 10-second countdown
   - If reconnects: Resume call
   - If timeout: End session

2. ✅ Own socket disconnects
   - Auto-reconnect (Socket.io built-in)
   - Re-auth with sessionToken
   - Rejoin room
   - ICE restart if needed

3. ✅ Both sockets disconnect simultaneously
   - Both see countdown
   - First to reconnect waits for other
   - If both timeout: Session ends

4. ✅ WebRTC disconnects but socket stays
   - ICE restart triggered
   - New offer/answer exchange
   - Media streams reconnected

5. ❌ EDGE CASE: Network switch (WiFi → 4G)
   - Socket may disconnect
   - WebRTC will fail
   - Both reconnect simultaneously
   - May cause race condition

6. ❌ EDGE CASE: Page hidden (tab switch)
   - Browser may throttle timers
   - Reconnection countdown may freeze
   - Partner may timeout even if still connected

7. ✅ Grace period expired
   - Backend emits 'room:grace-period-expired'
   - Shows modal with time up
   - Ends call gracefully

8. ❌ EDGE CASE: Partner closes tab during reconnection
   - Their socket disconnects
   - Countdown reaches 0
   - Session ends correctly
   - BUT: May leave orphaned room in backend

### WebRTC Reconnection
File: app/room/[roomId]/page.tsx (lines 698-718)

Edge Cases:
-----------
1. ✅ ICE connection failed
   - Initiator calls restartIce()
   - Creates new offer with iceRestart: true
   - Sends to partner
   - New ICE candidates exchanged

2. ❌ EDGE CASE: TURN server unavailable
   - ICE may fail permanently
   - No fallback to different TURN server
   - Call will fail

3. ✅ Media stream lost
   - getUserMedia called again
   - New stream created
   - Sent to peer connection

4. ❌ EDGE CASE: Camera permission revoked mid-call
   - Stream stops
   - No automatic recovery
   - Call continues with black screen

5. ❌ EDGE CASE: Both users behind symmetric NAT
   - TURN required
   - If TURN fails, can't connect
   - No UDP hole punching fallback

---

## TEXT ROOM RECONNECTION

### Socket Reconnection
File: app/text-room/[roomId]/page.tsx (lines 171-217)

Edge Cases:
-----------
1. ✅ Socket disconnects
   - Shows "Reconnecting..." banner
   - Auto-reconnect (Socket.io)
   - Re-auth
   - Rejoin room
   - Flush message queue

2. ✅ Message queue during disconnect
   - Messages stored in messageQueueRef
   - Count shown in UI
   - Flushed on reconnect
   - All messages delivered

3. ✅ Partner disconnects
   - Backend emits 'room:partner-disconnected'
   - Shows countdown modal
   - 10 seconds to reconnect
   - If timeout: End session

4. ❌ EDGE CASE: Reconnect during message send
   - Message added to queue
   - Reconnect happens
   - Queue flushed
   - BUT: Message may duplicate if server received it

5. ❌ EDGE CASE: Multiple rapid disconnects/reconnects
   - Queue may have duplicates
   - Socket handlers may be registered multiple times
   - Potential memory leak

6. ✅ Session ends during disconnect
   - Countdown reaches 0
   - Session ended
   - Redirect to home

7. ❌ EDGE CASE: Page reload during disconnect
   - Room state lost
   - Message queue lost
   - User sent back to home (session check fails)

---

## CRITICAL ISSUES IDENTIFIED

### High Priority
1. ❌ No deduplication for queued messages
2. ❌ Page hidden (tab switch) freezes timers
3. ❌ Camera permission revoked has no recovery
4. ❌ TURN server failover missing

### Medium Priority
5. ❌ Orphaned rooms on abrupt disconnect
6. ❌ Multiple socket handler registrations
7. ❌ Network switch (WiFi→4G) race condition

### Low Priority
8. ✅ All other cases handled correctly

---

## EXISTING PROTECTIONS

✅ Socket auto-reconnect (Socket.io)
✅ Message queueing (text mode)
✅ ICE restart (WebRTC)
✅ Partner disconnect countdown (10s)
✅ Grace period handling
✅ Session timeout
✅ State sync on reconnect
✅ Queue flushing

---

## RECOMMENDATIONS

1. Add message deduplication (messageId check)
2. Add visibilitychange listener to pause timers
3. Add camera permission watcher
4. Add TURN server array with failover
5. Add cleanup job for orphaned rooms
6. Remove duplicate socket listeners on reconnect

---

## NEW: EXIT PROTECTION

✅ beforeunload event (confirm tab close)
✅ popstate event (confirm back button)
✅ Shows leave confirmation modal
✅ Prevents accidental exit

Files Modified:
- app/room/[roomId]/page.tsx (video)
- app/text-room/[roomId]/page.tsx (text)
