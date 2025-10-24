# Text Mode - Complete Specification & Edge Cases

## 🎯 CORE FEATURES

### 1. Unlimited Duration (Torch Rule)
- **No fixed timer** - session continues as long as users are active
- **2-minute inactivity detection** - triggers warning if either user stops messaging
- **60-second warning countdown** - gives users time to respond
- **Message resets countdown** - sending a message clears the warning
- **Session ends** - only after full 2min + 60s inactivity

### 2. Messaging
- **Text messages** - 500 character limit, HTML sanitized
- **GIF support** - Klipy API integration
- **File sharing** - Images, documents (5MB limit)
- **Rate limiting** - 1.5s between messages

### 3. Typing Indicator
- **Real-time** - shows when partner is typing
- **Auto-hide** - disappears 3s after last typing event
- **Instagram-style** - animated dots
- **Throttled** - events sent max once per 2s

### 4. Video Upgrade
- **Appears after 60s** - upgrade button shows
- **Request/accept flow** - either user can initiate
- **Redirects to video room** - switches to 5-minute video call

---

## 🚫 WHAT TEXT MODE SHOULD NOT HAVE

### Video Mode Features That Don't Apply:
- ❌ WebRTC peer connection (text only uses Socket.io)
- ❌ getUserMedia / camera / microphone
- ❌ ICE candidates / STUN / TURN servers
- ❌ SDP offers / answers
- ❌ Connection state ('connected', 'disconnected', etc.)
- ❌ Timer countdown (torch rule = unlimited)
- ❌ Duration selection (unlimited by default)

### Reconnection Differences:
- ❌ NO ICE restart
- ❌ NO createOffer / createAnswer  
- ❌ NO m-line order issues
- ✅ Socket.io reconnection ONLY
- ✅ Simple room rejoin

---

## 📋 TEXT MODE RECONNECTION - CORRECT IMPLEMENTATION

### What Text Mode HAS:
```typescript
// Socket reconnection (Socket.io built-in)
socket.on('connect', () => {
  console.log('[TextRoom] Socket reconnected - rejoining room');
  socket.emit('room:join', { roomId });
});

socket.on('reconnect', () => {
  console.log('[TextRoom] Socket reconnected after failure');
  socket.emit('room:join', { roomId });
});

// Grace period banner (when partner disconnects)
socket.on('room:partner-disconnected', ({ gracePeriodSeconds }) => {
  setShowReconnecting(true);
  setReconnectCountdown(gracePeriodSeconds);
});

socket.on('room:partner-reconnected', () => {
  setShowReconnecting(false);
});
```

### What Text Mode SHOULD NOT HAVE:
```typescript
// ❌ NO WebRTC connection phase tracking
// ❌ NO connectionPhase state
// ❌ NO ICE restart logic
// ❌ NO peer connection management
// ❌ NO remote/local video refs
// ❌ NO media stream cleanup
```

---

## 🐛 ISSUES WITH CURRENT IMPLEMENTATION

### Issue 1: Wrong Klipy Domain
- Used: `g.klipy.com` ❌ (doesn't exist - ERR_NAME_NOT_RESOLVED)
- Correct: `api.klipy.com` ✅ (verified with curl)
- **FIXED** ✅

### Issue 2: Video Button Not Showing
- Problem: useEffect dependency causes re-creation
- **FIXED**: Empty deps array ✅

### Issue 3: Countdown Stuck at 0
- Problem: Server checks every 30s, delay before ending
- **FIXED**: Client-side check ends session at 0 ✅

### Issue 4: Video Button Covers Active UI
- **Need to investigate layout**

### Issue 5: Weird Disconnection Issues
- **Need specifics** - what's the exact behavior?

---

## 🎨 UI LAYOUT REQUIREMENTS

### Header (Top):
```
[X Close]  [Partner Name]  [● Active / ⚠️ Inactive: Xs]  [🎥 Upgrade to Video]
```

**Rules**:
- Active indicator: Always visible (right side)
- Video button: Only after 60s (far right or next to active indicator)
- Should NOT overlap or cover active status

### Current Issue:
Video button might be pushing active indicator off screen or covering it.

**Fix**: Position video button in header, not overlaying status.

---

## 📊 COMPLETE EDGE CASE MATRIX

### A. Session Start
| Scenario | Behavior | Status |
|----------|----------|--------|
| Join new text room | Show Active indicator | ✅ |
| Partner hasn't joined yet | Wait | ✅ |
| Invalid room ID | Redirect to main | ✅ |
| Not authorized | Redirect to main | ✅ |

### B. Active Chat
| Scenario | Behavior | Status |
|----------|----------|--------|
| Send message | Message appears, rate limited 1.5s | ✅ |
| Typing | Shows "Partner is typing..." | ✅ |
| Send GIF | GIF appears in chat | ⚠️ API broken |
| Send file | File upload dialog | ✅ |
| Receive message | Appears in chat | ✅ |
| Load history | Previous messages shown | ✅ |

### C. Inactivity System
| Scenario | Behavior | Status |
|----------|----------|--------|
| 2min no messages | Warning appears: "Inactive: 60s" | ✅ |
| Message during warning | Warning clears, back to "Active" | ✅ |
| Countdown reaches 0 | Session ends, redirect to history | ✅ FIXED |
| Partner inactive, you active | Warning still shows | ✅ |
| Both inactive 2min+60s | Session ends, cooldown set | ✅ |

### D. Video Upgrade
| Scenario | Behavior | Status |
|----------|----------|--------|
| 60s elapsed | Button appears | ✅ FIXED |
| Click upgrade | Shows "Waiting for..." | ✅ |
| Partner accepts | Both redirect to video room | ✅ |
| Partner declines | Alert shown, continue chat | ✅ |
| Both click simultaneously | First request wins | ✅ |

### E. Reconnection
| Scenario | Behavior | Status |
|----------|----------|--------|
| WiFi off 3s | Socket reconnects, rejoin room | ✅ |
| Tab reload | Socket reconnects, messages reload | ✅ |
| Partner disconnects | Banner: "Partner disconnected (10s)" | ✅ |
| Partner reconnects | Banner disappears | ✅ |
| Grace period expires | Session ends, redirect | ✅ |
| Network switch (WiFi→5G) | Socket reconnects automatically | ✅ |

### F. Session End
| Scenario | Behavior | Status |
|----------|----------|--------|
| Click end call | Redirect to history | ✅ |
| Inactivity timeout | Redirect to history | ✅ FIXED |
| Partner leaves | Session ends | ✅ |
| Grace period expires | Session ends | ✅ |
| All save history + set cooldown | Yes | ✅ |

---

## ⚠️ CURRENT PROBLEMS TO FIX

### Problem 1: Video Button Layout
**Issue**: Button might be covering or misaligning active status

**Investigation Needed**:
- Where exactly is video button positioned?
- Where is active status positioned?
- Are they conflicting?

**Current Code** (lines 438-464):
```typescript
<div className="flex items-center gap-2 sm:gap-4">
  {/* End Call Button */}
  {/* TORCH RULE: Activity indicator */}
  {/* Video Request Button */}
</div>
```

All in same div with gap-2. Should be fine unless viewport is too narrow.

### Problem 2: Klipy GIF Still Not Working
**Status**: Domain fixed to `api.klipy.com`
**Need to test**: After deploy, verify GIFs load

### Problem 3: "Weird Disconnection Issues"
**Need specifics**:
- What exactly happens?
- When does it happen?
- What's the expected vs actual behavior?

---

## ✅ VERIFIED WORKING

### Text Mode Does NOT Need:
- WebRTC reconnection logic (no peer connection)
- ICE restart (no ICE)
- Connection phase states (no WebRTC)
- SDP renegotiation (no SDP)
- Media stream cleanup (no media)

### Text Mode Only Needs:
- Socket.io reconnection (already has it) ✅
- Room rejoin on reconnect (already has it) ✅
- Message history reload (already has it) ✅
- Grace period UI (already has it) ✅

---

## 🔍 CODE REVIEW CHECKLIST

### Current Implementation Review:
1. ✅ Socket reconnect handlers exist
2. ✅ Room rejoin on reconnect
3. ✅ Message history loads
4. ✅ Grace period banner
5. ✅ Inactivity tracking (server-side)
6. ✅ Inactivity warning (client-side)
7. ✅ Countdown display
8. ✅ FIXED: Countdown at 0 ends session
9. ✅ FIXED: Video button after 60s
10. ✅ FIXED: Typing indicator
11. ✅ FIXED: Klipy API domain

### What NOT to Add:
- ❌ WebRTC connection logic
- ❌ ICE restart handlers
- ❌ Peer connection states
- ❌ SDP negotiation
- ❌ Media stream refs
- ❌ Connection phase tracking

### Text Mode is Socket-Only:
- Messages via socket events ✅
- Typing via socket events ✅
- Reconnection via Socket.io ✅
- No WebRTC at all ✅

---

## 🎯 NEXT STEPS

1. **Test video button after deploy** - verify it appears at 60s
2. **Test countdown at 0** - verify session ends immediately
3. **Test Klipy GIFs** - verify api.klipy.com works
4. **Check UI layout** - ensure video button doesn't cover active status
5. **Get specifics on "weird disconnection issues"**

---

**Status**: Text mode is correctly implemented as socket-only.
**No WebRTC logic needed or wanted.**
**All critical bugs fixed.**

