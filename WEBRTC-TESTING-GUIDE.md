# WebRTC Reconnection - Testing Guide

## 🎯 Testing Overview

This guide provides step-by-step instructions for testing the WebRTC reconnection fixes, including the 10-second grace period, tab reload support, and ephemeral signal loss recovery.

---

## ✅ Prerequisites

1. **Two devices/browsers** (for testing between different connections)
2. **Stable internet connection** (to start)
3. **Browser Developer Tools** open (Console tab)
4. **Testing scenarios**: WiFi, 5G/4G, WiFi ↔ 5G switching

---

## 🧪 Test Scenarios

### Test 1: Ephemeral Signal Loss (Brief Network Interruption)

**Purpose**: Verify automatic reconnection during brief network drops

**Steps**:
1. Start a video call between User A and User B
2. **User A**: Turn off WiFi/disconnect network
3. **Expected**:
   - Yellow banner appears: "Connection lost - attempting to reconnect..."
   - Loading overlay shows: "🔄 Reconnecting..."
   - Console logs: `[WebRTC] Connection disconnected - entering grace period`
   
4. **Wait 2-3 seconds**
5. **User A**: Turn WiFi back on
6. **Expected**:
   - Console logs: `[WebRTC] Reconnection attempt 1/3`
   - ICE restart triggered
   - New offer created (if initiator)
   
7. **Within 10 seconds**:
   - Console logs: `[WebRTC] ✅ Reconnected successfully during grace period`
   - Yellow banner disappears
   - Call continues normally
   - **User B** sees brief "Partner disconnected" then "Partner reconnected"

**Success Criteria**:
- ✅ No error shown
- ✅ Call continues without manual intervention
- ✅ Banner disappears after reconnection
- ✅ Video/audio resumes

---

### Test 2: Tab Reload During Active Call

**Purpose**: Verify users can reload their browser tab without losing the call

**Steps**:
1. Start a video call between User A and User B
2. **User A**: Press `Cmd+R` (Mac) or `Ctrl+R` (Windows) to reload page
3. **Expected immediately**:
   - Page reloads and shows "🔄 Reconnecting..." state
   - Console logs: `[Room] Detected tab reload during active call - attempting reconnection`
   
4. **User A's page reloads**:
   - Socket automatically reconnects
   - Emit `room:join` with same `roomId`
   - Server allows rejoin (within grace period)
   
5. **User B sees**:
   - Brief "Partner disconnected" notification
   - Then "Partner reconnected" notification
   
6. **Within 10 seconds**:
   - WebRTC connection re-negotiated
   - New offer/answer exchange
   - ICE candidates exchanged
   - Connection restored
   
7. **Expected result**:
   - **User A** back in call with video/audio working
   - **User B** never left call, just saw reconnection notification
   - Timer continues from where it was
   - Chat history preserved

**Success Criteria**:
- ✅ Page reload doesn't end the call
- ✅ Connection restores automatically
- ✅ Timer keeps running
- ✅ Both users can continue normally

---

### Test 3: Extended Disconnection (> 10 seconds)

**Purpose**: Verify graceful failure after grace period expires

**Steps**:
1. Start a video call between User A and User B
2. **User A**: Turn off internet completely
3. **Expected** (for User A):
   - Yellow banner: "Connection lost - attempting to reconnect..."
   - Console logs 3 reconnection attempts at 2s, 5s, 8s
   - Progress bar shows 75%
   
4. **User B sees**:
   - "Partner disconnected" notification
   - Countdown: "10... 9... 8..." seconds
   
5. **Keep internet off for 12 seconds**
6. **Expected after 10 seconds**:
   - **User A**: Error shown: "Connection lost - unable to reconnect"
   - **User A**: Prompt: "Please refresh the page or check your internet connection"
   - **User B**: "Session ended - partner lost connection"
   - Both redirected to history page
   - Session saved to history with actual duration

**Success Criteria**:
- ✅ Grace period lasts exactly 10 seconds
- ✅ 3 reconnection attempts made
- ✅ Clear error messages shown
- ✅ Session properly saved
- ✅ Cooldown set between users

---

### Test 4: Network Switch (WiFi ↔ 5G on Mobile)

**Purpose**: Verify reconnection during network interface changes

**Steps**:
1. **User A** on mobile: Start call using WiFi
2. **User B** on desktop: Connected via WiFi
3. **User A**: Disable WiFi (phone automatically switches to 5G/4G)
4. **Expected**:
   - Brief "Reconnecting..." banner (2-5 seconds)
   - ICE candidates re-gathered on new network
   - Connection restored automatically
   
5. **No manual intervention needed**
6. **Result**: Call continues on 5G without interruption

**Success Criteria**:
- ✅ Network switch handled automatically
- ✅ Reconnection within 5 seconds
- ✅ No error shown
- ✅ Call quality may vary (WiFi vs 5G) but connection stable

---

### Test 5: M-Line Order Error Prevention

**Purpose**: Verify SDP rollback prevents m-line order mismatch

**Steps**:
1. Start a video call
2. **Simulated disconnect**: User A's connection drops briefly
3. **Simultaneous offers** (glare condition):
   - User A creates reconnection offer
   - User B also tries to create offer
   
4. **Expected**:
   - Console logs: `[WebRTC] Renegotiation detected, rolling back to stable state`
   - Console logs: `[WebRTC] Rolling back local offer to accept remote offer`
   - One peer rolls back their offer
   - Other peer's offer is accepted
   - No "m-line order mismatch" error
   
5. **Result**: Connection renegotiates cleanly without errors

**Success Criteria**:
- ✅ No `InvalidAccessError` about m-lines
- ✅ Rollback mechanism works
- ✅ Connection re-establishes
- ✅ No console errors

---

### Test 6: Multiple Rapid Disconnects

**Purpose**: Stress test the reconnection logic

**Steps**:
1. Start a video call
2. **User A**: Rapidly toggle WiFi on/off 3 times (3 seconds each)
3. **Expected**:
   - Each disconnect triggers grace period
   - Multiple reconnection attempts
   - System handles rapid state changes
   
4. **After stabilization**:
   - Call either reconnects successfully or fails gracefully
   - No hung state or infinite loops
   - Clear UI feedback throughout

**Success Criteria**:
- ✅ No crashes or freezes
- ✅ System recovers or fails gracefully
- ✅ Consistent UI state
- ✅ No memory leaks

---

## 📊 What to Look For in Console

### Successful Reconnection Logs:

```
[WebRTC] Connection disconnected - entering grace period
[WebRTC] Reconnection attempt 1/3
[WebRTC] Creating new offer for reconnection (preserving m-line order)
[WebRTC] Reconnection offer sent
[WebRTC] Received answer, current signaling state: have-local-offer
[WebRTC] Remote answer set successfully
[WebRTC] ✅ Reconnected successfully during grace period
[WebRTC] Connection state: connected
```

### Failed Reconnection Logs:

```
[WebRTC] Connection disconnected - entering grace period
[WebRTC] Reconnection attempt 1/3
[WebRTC] Reconnection attempt 2/3
[WebRTC] Reconnection attempt 3/3
[WebRTC] Still disconnected after 10000ms grace period, treating as failed
[Room] Notifying peer of connection failure
[Room] Session ended due to disconnection timeout
```

### M-Line Error (Should NOT appear after fix):

```
❌ [WebRTC] Error handling offer: InvalidAccessError: 
   The order of m-lines in subsequent offer doesn't match order from previous offer/answer
```

---

## 🔍 Debugging Tips

### If Reconnection Fails:

1. **Check TURN servers**:
   ```javascript
   // In console during call:
   pc = window.peerConnectionRef?.current
   pc.getConfiguration().iceServers
   // Should show multiple servers including relay
   ```

2. **Check ICE candidates**:
   ```javascript
   pc.addEventListener('icecandidate', (e) => {
     console.log('ICE candidate:', e.candidate?.type, e.candidate?.protocol);
   });
   ```

3. **Check connection state**:
   ```javascript
   pc.connectionState // Should be 'connected', not 'failed' or 'disconnected'
   pc.iceConnectionState // Should be 'connected' or 'completed'
   ```

4. **Monitor signaling state**:
   ```javascript
   pc.signalingState // Should be 'stable' when connected
   ```

### Common Issues:

| Issue | Cause | Solution |
|-------|-------|----------|
| Reconnection times out | TURN servers not responding | Check TURN credentials, try different TURN server |
| M-line error persists | Renegotiation glare not handled | Verify rollback logic executes |
| Connection stuck in "reconnecting" | Socket not reconnecting | Check Socket.io connection, reload page |
| Partner not notified | Server grace period handler not firing | Check server logs, verify `room:disconnected` event |

---

## 🎮 Manual Testing Checklist

- [ ] Test 1: Ephemeral Signal Loss - PASS
- [ ] Test 2: Tab Reload - PASS
- [ ] Test 3: Extended Disconnection - PASS
- [ ] Test 4: Network Switch (WiFi ↔ 5G) - PASS
- [ ] Test 5: M-Line Error Prevention - PASS
- [ ] Test 6: Multiple Rapid Disconnects - PASS

---

## 🚀 Automated Testing (Future)

For production, consider automated E2E tests:

```javascript
// Example Playwright test
test('should reconnect after brief network loss', async ({ page, context }) => {
  await page.goto('/room/test-room-id');
  
  // Wait for connection
  await page.waitForSelector('[data-testid="remote-video"]');
  
  // Simulate network loss
  await context.setOffline(true);
  await page.waitForSelector('[data-testid="reconnecting-banner"]');
  
  // Restore network
  await context.setOffline(false);
  await page.waitForSelector('[data-testid="connected-state"]', { timeout: 10000 });
  
  // Verify call continues
  expect(await page.locator('[data-testid="call-ended"]').count()).toBe(0);
});
```

---

## 📈 Success Metrics

Track these metrics in production:

1. **Reconnection Success Rate**: % of disconnections that recover automatically
2. **Average Reconnection Time**: How long it takes to restore connection
3. **Grace Period Timeout Rate**: % of disconnections that fail after 10s
4. **M-Line Errors**: Should be 0 after fix
5. **User-Initiated Reloads**: Successful reconnections after tab reload

**Target Metrics**:
- Reconnection Success Rate: > 85%
- Average Reconnection Time: < 5 seconds
- Grace Period Timeout Rate: < 15%
- M-Line Errors: 0

---

## 🛠️ Troubleshooting Commands

### Check if grace period is active:
```bash
# Server logs should show:
[Room] Starting grace period for room <roomId>
[Room] ⏰ Grace period expired for room <roomId> - ending session
```

### Force reconnection test:
```javascript
// In browser console during call:
window.peerConnectionRef?.current?.restartIce();
```

### Check sessionStorage (tab reload detection):
```javascript
sessionStorage.getItem('room_connection_active') // Should be 'true' during call
sessionStorage.getItem('room_join_time') // Timestamp of join
```

---

## 📝 Reporting Issues

When reporting reconnection issues, include:

1. **Browser/Device**: Chrome 120 on MacBook, Safari 17 on iPhone 14, etc.
2. **Network Type**: WiFi, 5G, 4G, switching between networks
3. **Console Logs**: Full WebRTC-related logs from both users
4. **Steps to Reproduce**: Exact sequence that triggered the issue
5. **Expected vs Actual**: What should have happened vs what did happen
6. **Timing**: How long disconnection lasted, when reconnection was attempted

---

## ✨ Expected Behavior Summary

| Scenario | Grace Period | Attempts | Expected Outcome |
|----------|--------------|----------|------------------|
| Brief disconnect (< 5s) | 10s | 1-2 | ✅ Auto-reconnect |
| Medium disconnect (5-10s) | 10s | 3 | ✅ Auto-reconnect |
| Extended disconnect (> 10s) | 10s | 3 | ❌ Graceful failure |
| Tab reload | 30s | N/A | ✅ Rejoin room |
| Network switch | 10s | 2-3 | ✅ Auto-reconnect |
| Simultaneous offers | 10s | 1-2 | ✅ Rollback + reconnect |

---

**Last Updated**: October 24, 2025
**Status**: ✅ Ready for Testing
**Version**: 2.0 (WebRTC Reconnection Fix)

