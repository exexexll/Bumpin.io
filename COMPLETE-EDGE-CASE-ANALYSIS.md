# Complete Edge Case & Logic Verification

## 🔍 Comprehensive System Analysis

This document verifies ALL edge cases, logic flows, and potential flaws across:
1. WebRTC Video Reconnection
2. Text Mode Torch Rule
3. Klipy GIF API
4. Cooldown System
5. Room Management

---

## 1️⃣ WEBRTC VIDEO RECONNECTION - Edge Cases

### ✅ Covered Edge Cases:

#### A. Initial Connection vs. Reconnection
**Edge Case**: System confuses new connection with reconnection
**Coverage**:
- ✅ Compare `storedRoomId` with `currentRoomId`
- ✅ Check `timeSinceJoin < 30000` (30 seconds)
- ✅ Validate all three conditions: same room + recent + was active
- ✅ Clear old sessionStorage when joining new room
**Files**: `app/room/[roomId]/page.tsx` (lines 454-467)

#### B. Disconnection During Initial Setup
**Edge Case**: Disconnect handler fires before connection established
**Coverage**:
- ✅ Check `connectionPhase !== 'connected'` before triggering reconnection
- ✅ Ignore disconnects during 'initializing', 'gathering', 'connecting' phases
- ✅ Only act on disconnect if `connectionPhase === 'connected'`
**Files**: `app/room/[roomId]/page.tsx` (lines 345-348)

#### C. Duplicate Reconnection Triggers
**Edge Case**: Disconnect handler fires multiple times
**Coverage**:
- ✅ Check if already in 'reconnecting' state
- ✅ Skip duplicate handler calls
- ✅ Track reconnection timeouts to prevent overlaps
**Files**: `app/room/[roomId]/page.tsx` (lines 355-358)

#### D. M-Line Order Mismatch (SDP Renegotiation)
**Edge Case**: Both peers create offers simultaneously (glare condition)
**Coverage**:
- ✅ Detect renegotiation state
- ✅ Rollback to stable state if in 'have-local-offer'
- ✅ Only set remote description in valid signaling states
- ✅ Specific error detection for m-line issues
**Files**: `app/room/[roomId]/page.tsx` (lines 491-520)

#### E. Reconnection Timeout Cleanup
**Edge Case**: Multiple pending timeouts causing memory leaks
**Coverage**:
- ✅ Track all reconnection timeouts in array
- ✅ Clear all timeouts on success
- ✅ Clear all timeouts on failure
**Files**: `app/room/[roomId]/page.tsx` (lines 374, 404-405, 413)

#### F. Tab Reload vs. Network Disconnect
**Edge Case**: Different reconnection strategies needed
**Coverage**:
- ✅ Tab reload: Normal connection flow (getUserMedia, create PC, etc.)
- ✅ Network disconnect: ICE restart only (preserve existing PC)
- ✅ Don't set 'reconnecting' phase on tab reload
**Files**: `app/room/[roomId]/page.tsx` (lines 467-472)

#### G. SessionStorage Persistence Across Rooms
**Edge Case**: Old room data affects new room connections
**Coverage**:
- ✅ Store `current_room_id` for comparison
- ✅ Clear old sessionStorage when roomId doesn't match
- ✅ Remove all sessionStorage on component unmount
**Files**: `app/room/[roomId]/page.tsx` (lines 474-479, 807-809)

### ⚠️ Potential Edge Cases to Monitor:

#### 1. Very Slow Networks (< 100 kbps)
**Issue**: 10 seconds may not be enough
**Mitigation**: User can manually refresh within grace period
**Risk**: Low - rare edge case

#### 2. Both Users Disconnect Simultaneously
**Issue**: No one to accept reconnection offer
**Coverage**: ✅ Server grace period handles this
**Result**: Room ends after 10s, proper cleanup occurs

#### 3. Reconnection During Grace Period Expiration
**Issue**: Race condition - reconnect at exactly 10s
**Coverage**: ✅ Server checks `room.status === 'grace_period'` before ending
**Result**: If reconnected, status changes to 'active', timeout doesn't trigger

---

## 2️⃣ TEXT MODE TORCH RULE - Edge Cases

### ✅ Covered Edge Cases:

#### A. Room Creation Without Activity Tracking
**Edge Case**: Text room starts before activity tracking initialized
**Coverage**:
- ✅ Background job initializes tracking if not found
- ✅ Sets both users' last message time to `now` on init
- ✅ Prevents false inactivity warning on new rooms
**Files**: `server/src/index.ts` (lines 237-246)

#### B. First Message Sent Before Background Job Runs
**Edge Case**: User sends message before 30s background job initializes tracking
**Coverage**:
- ✅ On `textchat:send`, create activity object if doesn't exist
- ✅ Initialize with timestamp 0, then update immediately
**Files**: `server/src/index.ts` (lines 1310-1319)

#### C. Message Sent During Warning Period
**Edge Case**: User messages during 60s warning countdown
**Coverage**:
- ✅ Update last message timestamp
- ✅ Clear `warningStartedAt` to null
- ✅ Emit 'textroom:inactivity-cleared' to both users
- ✅ Next check cycle will see both active, no warning
**Files**: `server/src/index.ts` (lines 1330-1335)

#### D. Only One User Inactive
**Edge Case**: One user stops messaging, other continues
**Coverage**:
- ✅ Check: `user1Inactive OR user2Inactive`
- ✅ Warning triggers if EITHER user inactive
- ✅ Both users see warning
- ✅ Either user can send message to clear warning
**Files**: `server/src/index.ts` (lines 249-250)

#### E. Warning Countdown Accuracy
**Edge Case**: Countdown might skip seconds or be inaccurate
**Coverage**:
- ✅ Calculate remaining time from `warningStartedAt` timestamp
- ✅ Use `Math.ceil` to round up (never shows 0 prematurely)
- ✅ Emit countdown every 30s (user sees approximate time)
**Files**: `server/src/index.ts` (lines 321-324)

#### F. Video Upgrade During Inactivity Warning
**Edge Case**: Users upgrade to video while warning active
**Coverage**:
- ✅ Activity tracking stays in `textRoomActivity` Map
- ✅ On upgrade, room.chatMode changes to 'video'
- ✅ Background job skips if `chatMode !== 'text'`
- ✅ Activity tracking remains (not deleted until room ends)
**Files**: `server/src/index.ts` (line 235)

#### G. Room Cleanup on Inactivity End
**Edge Case**: Memory leak if activity tracking not deleted
**Coverage**:
- ✅ Delete from both `activeRooms` AND `textRoomActivity`
- ✅ Async handler ensures both Maps cleaned up
**Files**: `server/src/index.ts` (lines 316-317)

### ⚠️ Potential Edge Cases to Monitor:

#### 1. Exactly 2 Minutes of Inactivity
**Issue**: Edge case at boundary (120000ms)
**Coverage**: ✅ Uses `>` comparison, clear threshold
**Risk**: None

#### 2. Background Job Timing
**Issue**: 30s intervals might miss exact warning expiration
**Coverage**: ✅ Calculates from timestamp, not intervals
**Result**: Warning ends between 60-90s (30s window acceptable)

#### 3. Rapid Message Spam to Game System
**Issue**: Users send messages just to keep session alive
**Coverage**: ✅ Rate limit (1.5s between messages) prevents spam
**Risk**: Low - rate limiting enforced

---

## 3️⃣ KLIPY GIF API - Edge Cases

### ✅ Covered Edge Cases:

#### A. API Request Failures
**Edge Case**: Klipy API returns error or timeout
**Coverage**:
- ✅ Try-catch blocks on all API calls
- ✅ Return empty array `[]` on failure
- ✅ Fallback categories defined
- ✅ Error logging with response text
**Files**: `lib/klipyAPI.ts` (lines 38-39, 80-81, 125)

#### B. Missing Response Fields
**Edge Case**: API response structure changes
**Coverage**:
- ✅ Multiple fallbacks: `data.results || data.data || []`
- ✅ Safe property access with `?.` operators
- ✅ Default values for all fields
**Files**: `lib/klipyAPI.ts` (lines 47, 52-55)

#### C. Impression Tracking Failures
**Edge Case**: Share trigger API fails
**Coverage**:
- ✅ Silent fail (doesn't block UX)
- ✅ Error logged but not shown to user
- ✅ GIF still selectable even if tracking fails
**Files**: `lib/klipyAPI.ts` (lines 154-157)

#### D. Invalid GIF URLs
**Edge Case**: API returns malformed URLs
**Coverage**:
- ✅ Multiple URL fallbacks: `item.media?.[0]?.gif?.url || item.url || item.gif_url`
- ✅ Backend validates only Klipy/Tenor domains allowed
**Files**: `lib/klipyAPI.ts` (line 52), `server/src/text-chat.ts`

### ⚠️ Potential Issues:

#### 1. API Key Exposure
**Issue**: API key hardcoded in client-side code
**Risk**: Medium - key visible in browser
**Mitigation**: Move to server-side proxy endpoint (future enhancement)

#### 2. Rate Limiting
**Issue**: Klipy might have request limits
**Coverage**: ⚠️ No client-side rate limiting
**Mitigation**: Add request caching (future enhancement)

---

## 4️⃣ COOLDOWN SYSTEM - Edge Cases

### ✅ All Session End Paths Verified:

| Path | Cooldown Set | Activity Cleanup | User Availability | Session Saved |
|------|--------------|------------------|-------------------|---------------|
| Normal call end | ✅ 24h | N/A | ✅ Both available | ✅ Yes |
| Decline invite | ✅ 24h | N/A | ✅ Both available | ❌ No (no call) |
| Rescind invite | ✅ 1h | N/A | ✅ Both available | ❌ No (no call) |
| Client disconnect (reconnect fail) | ✅ 24h | ✅ Deleted | ✅ Both available | ✅ Yes |
| Socket disconnect (grace period) | ✅ 24h | ✅ Deleted | ✅ Both available | ✅ Yes |
| Text inactivity timeout | ✅ 24h | ✅ Deleted | ✅ Both available | ✅ Yes |
| Disconnect with pending invite | ✅ 1h | N/A | ✅ Both available | ❌ No (no call) |

### ✅ Covered Edge Cases:

#### A. Bidirectional Cooldown Key Generation
**Edge Case**: `setCooldown(A, B)` vs `setCooldown(B, A)` must be same
**Coverage**:
- ✅ Lexicographic comparison ensures consistent ordering
- ✅ `userId1 < userId2` comparison
- ✅ Same key generated regardless of parameter order
**Files**: `server/src/store.ts` (lines 601-607)

#### B. Database vs. Memory Sync
**Edge Case**: Cooldown in database but not in memory (or vice versa)
**Coverage**:
- ✅ `hasCooldown()` checks memory first, then database
- ✅ Loads from database and caches in memory
- ✅ `setCooldown()` saves to both simultaneously
**Files**: `server/src/store.ts` (lines 632-653)

#### C. Cooldown Expiration
**Edge Case**: Cooldown expired but still in Map
**Coverage**:
- ✅ Check `expires > Date.now()` before returning true
- ✅ Auto-delete expired cooldowns when checked
- ✅ Delete from both memory and database
**Files**: `server/src/store.ts` (lines 660-670)

#### D. Cooldown on Partial Session
**Edge Case**: User disconnects 5 seconds into call
**Coverage**:
- ✅ Check `actualDuration > 3` seconds
- ✅ If > 3s, save history and set cooldown
- ✅ Prevents spam connecting/disconnecting
**Files**: `server/src/index.ts` (lines 1831-1845)

---

## 5️⃣ ROOM MANAGEMENT - Edge Cases

### ✅ Covered Edge Cases:

#### A. Room ID Collisions
**Edge Case**: Two rooms get same UUID (extremely rare)
**Coverage**:
- ✅ UUID v4 has 122 bits of randomness (collision probability: 1 in 10^36)
- ✅ Map.set() would overwrite (last write wins)
**Risk**: Negligible (statistically impossible)

#### B. Room Not Found After Creation
**Edge Case**: User joins room immediately after creation but it's deleted
**Coverage**:
- ✅ Server validates room exists before allowing join
- ✅ Emits 'room:invalid' if not found
- ✅ Client redirects to /main
**Files**: `server/src/index.ts` (lines 1042-1045)

#### C. Unauthorized Room Access
**Edge Case**: User tries to join room they're not part of
**Coverage**:
- ✅ Check `room.user1 !== currentUserId && room.user2 !== currentUserId`
- ✅ Emit 'room:unauthorized' and reject
- ✅ Security logged
**Files**: `server/src/index.ts` (lines 1048-1051)

#### D. Room Status Race Conditions
**Edge Case**: Grace period expires while user is reconnecting
**Coverage**:
- ✅ Server checks `room.status === 'grace_period'` before ending
- ✅ If status changed to 'active' (reconnected), timeout doesn't fire cleanup
- ✅ Atomic status transitions
**Files**: `server/src/index.ts` (lines 1078-1079, 1702-1703)

#### E. Multiple Rooms for Same User
**Edge Case**: User somehow in two rooms simultaneously
**Coverage**:
- ✅ Presence system marks user as `available: false` when in room
- ✅ Cannot receive new invites while in active room
- ✅ Disconnect handler finds room via iteration
**Files**: `server/src/index.ts` (lines 917-918, 1621-1625)

### ⚠️ Potential Edge Cases to Monitor:

#### 1. Server Restart with Active Rooms
**Issue**: In-memory rooms lost on restart
**Coverage**: ⚠️ No persistence - users disconnected
**Mitigation**: Add room persistence to database (future enhancement)

#### 2. Very Long Text Sessions (> 24 hours)
**Issue**: Room stays in memory indefinitely if users keep messaging
**Coverage**: ⚠️ No max duration for text mode
**Mitigation**: Consider max session duration (e.g., 12 hours)

---

## 6️⃣ TEXT MODE TORCH RULE - Specific Logic Verification

### Activity Tracking Pipeline:

```
Room Created (Text Mode)
  ↓
Background Job (First 30s check):
  activity = null
  → Initialize: user1LastMessageAt = now
                user2LastMessageAt = now
                warningStartedAt = null
  ↓
User A sends message at t=0s:
  → Update: activity.user1LastMessageAt = t=0s
  ↓
Background Job (t=30s):
  user1Inactive = (30s - 0s) > 120s? NO ✅
  user2Inactive = (30s - 30s) > 120s? NO ✅
  → Both active, no warning
  ↓
... Users keep messaging ...
  ↓
User A sends message at t=60s:
  → Update: activity.user1LastMessageAt = t=60s
  ↓
User B stops messaging (last message at t=30s)
  ↓
Background Job (t=180s = 3 minutes):
  user1Inactive = (180s - 60s) > 120s? NO ✅
  user2Inactive = (180s - 30s) > 120s? YES ✅
  → Start warning: warningStartedAt = t=180s
  → Emit 'textroom:inactivity-warning' with 60s countdown
  ↓
Background Job (t=210s = 3.5 minutes):
  warningSince = (210s - 180s) = 30s
  30s > 60s? NO
  → Emit countdown: secondsRemaining = 30s
  ↓
User B sends message at t=220s:
  → Update: activity.user2LastMessageAt = t=220s
  → Clear: warningStartedAt = null
  → Emit 'textroom:inactivity-cleared'
  ↓
Background Job (t=240s = 4 minutes):
  user1Inactive = (240s - 60s) > 120s? YES
  user2Inactive = (240s - 220s) > 120s? NO
  → Start NEW warning (User A inactive now)
  ↓
... and so on ...
```

### ✅ Covered Scenarios:

1. **Both users active** → No warning, session continues ✅
2. **One user inactive** → Warning shown to both ✅
3. **Message during warning** → Warning cleared ✅
4. **Both users inactive** → Session ends after 2min + 60s ✅
5. **Warning expires** → Session ends, history saved, cooldown set ✅

### ⚠️ Edge Cases to Monitor:

#### 1. Users Trade Messages at Exactly 2-Minute Intervals
**Issue**: Could keep session alive with minimal engagement
**Coverage**: ✅ This is intended behavior (torch rule)
**Risk**: None - this is the feature

#### 2. Video Upgrade Button Spam
**Issue**: Users keep requesting video, declining, repeat
**Coverage**: ⚠️ No cooldown on video requests
**Mitigation**: Could add per-session request limit (future)

#### 3. Activity Tracking Not Deleted on Normal End
**Issue**: Memory leak if tracking persists
**Coverage**: ⚠️ **POTENTIAL BUG FOUND**
**Location**: Need to add `textRoomActivity.delete(roomId)` to normal `call:end` handler

---

## 🐛 BUGS FOUND DURING VERIFICATION

### Bug 1: Text Activity Not Cleaned on Normal End
**Location**: `server/src/index.ts` - `call:end` event handler
**Issue**: `textRoomActivity` not deleted when text session ends normally
**Impact**: Memory leak over time
**Fix**: Add `textRoomActivity.delete(roomId)` after room cleanup

### Bug 2: Text Activity Not Cleaned on Connection Failure
**Location**: `server/src/index.ts` - `connection:failed` handler  
**Issue**: `textRoomActivity` not deleted when connection fails
**Impact**: Memory leak
**Fix**: Add `textRoomActivity.delete(roomId)` in cleanup

---

## 📊 Complete Cleanup Matrix

All places where `activeRooms.delete()` occurs should also delete `textRoomActivity`:

| Location | activeRooms.delete | textRoomActivity.delete | Status |
|----------|-------------------|------------------------|--------|
| Inactivity timeout | ✅ Line 316 | ✅ Line 317 | ✅ OK |
| room:disconnected grace timeout | ✅ Line 1157 | ❌ MISSING | 🐛 BUG |
| Connection failed | ✅ Line 1440 | ❌ MISSING | 🐛 BUG |
| call:end (normal) | ✅ Line 1601 | ❌ MISSING | 🐛 BUG |
| Socket disconnect grace timeout | ✅ Line 1705 | ❌ MISSING | 🐛 BUG |
| Disconnect with partial session | ✅ Line 1854 | ❌ MISSING | 🐛 BUG |

---

## ✅ ACTION ITEMS

### Must Fix:
1. Add `textRoomActivity.delete(roomId)` to all room cleanup paths
2. Verify no other Maps need cleanup

### Should Monitor:
1. Very long text sessions (> 12 hours)
2. Klipy API rate limits
3. Server restart handling

### Optional Enhancements:
1. Move Klipy API key to server-side
2. Add max session duration for text mode
3. Add video request cooldown per session
4. Add room persistence to database

---

## 🧪 TESTING CHECKLIST

### WebRTC Video Mode:
- [ ] Join new room → Normal loading screen
- [ ] Join Room B after Room A → Normal loading screen  
- [ ] Tab reload during call → Reconnects successfully
- [ ] WiFi off 5s → Reconnects automatically
- [ ] WiFi off 15s → Fails gracefully after 10s
- [ ] Timer runs full duration without premature end
- [ ] Cooldown set after call completion

### Text Mode Torch Rule:
- [ ] New text chat → Shows "Active" indicator (green)
- [ ] Message every minute → Session never ends
- [ ] Stop messaging 2min → Warning appears (yellow, 60s)
- [ ] Message during warning → Warning clears immediately
- [ ] Stop messaging 2min + 60s → Session ends, saved to history
- [ ] Cooldown set after inactivity end

### Klipy GIF API:
- [ ] Open GIF picker → Shows trending GIFs
- [ ] Search "happy" → Shows search results
- [ ] Click GIF → Sends to chat successfully
- [ ] No console errors about API failures

### Cooldown System:
- [ ] Complete call → 24h cooldown on that user
- [ ] Decline invite → 24h cooldown
- [ ] Disconnect during call → 24h cooldown still set
- [ ] Cannot invite user with active cooldown

---

**Status**: ⚠️ **5 Bugs Found - Must Fix Before Deploy**
**Files to Fix**: `server/src/index.ts` (add textRoomActivity cleanup)
**Priority**: HIGH (memory leak)

