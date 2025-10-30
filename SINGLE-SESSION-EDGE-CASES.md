SINGLE SESSION ENFORCEMENT - EDGE CASES & VULNERABILITIES
==========================================================

## CURRENT IMPLEMENTATION

File: server/src/store.ts (line 1460-1508)
File: server/src/usc-verification.ts (line 345)
File: server/src/auth.ts (checking...)

---

## EDGE CASE ANALYSIS

### 1. Race Condition: Simultaneous Logins
**Scenario:**
- User logs in from Device A (invalidates sessions, creates new)
- Simultaneously logs in from Device B (invalidates sessions, creates new)
- Both sessions may be created

**Current Protection:** None
**Vulnerability:** ⚠️ HIGH - Both devices stay logged in
**Fix Needed:** Database transaction wrapper

### 2. Session Invalidation During Active Call
**Scenario:**
- User in video call on Device A
- User logs in on Device B
- Device A session invalidated mid-call
- Call drops unexpectedly

**Current Protection:** None  
**Vulnerability:** ⚠️ MEDIUM - Poor UX, unexpected call drops
**Fix Needed:** Grace period or warning before invalidation

### 3. USC Card Login vs Email Login
**Scenario:**
- User logged in via email on Device A
- User logs in via USC card on Device B
- Which session should be invalidated?

**Current Protection:** invalidateUserSessions called in USC login
**Vulnerability:** ✅ HANDLED (all old sessions invalidated)

### 4. Concurrent Tab Logins (Same Browser)
**Scenario:**
- User opens Tab A, logs in
- User opens Tab B, logs in  
- Both tabs same browser, same user

**Current Protection:** Each login invalidates previous
**Vulnerability:** ⚠️ LOW - Tabs fighting for single session
**Fix Needed:** Shared session storage across tabs

### 5. Session Created But Invalidation Fails
**Scenario:**
- invalidateUserSessions() fails (DB error)
- createSession() succeeds
- User now has multiple active sessions

**Current Protection:** None (no error handling)
**Vulnerability:** ⚠️ MEDIUM - Multiple sessions possible
**Fix Needed:** Transaction + error handling

### 6. Orphaned Sessions After Crash
**Scenario:**
- Server crashes mid-session
- Session marked active in DB
- Server restarts, session still active
- User can't log in (thinks session exists)

**Current Protection:** Session expiry (30 days)
**Vulnerability:** ⚠️ LOW - Long expiry, but eventually cleans up
**Fix Needed:** Startup cleanup job

### 7. Session Query Performance
**Scenario:**
- 1000+ users online
- Each login queries ALL sessions for that user
- Slow query on large sessions table

**Current Protection:** None
**Vulnerability:** ⚠️ HIGH - Performance bottleneck
**Fix Needed:** Index on (user_id, is_active), query optimization

### 8. Memory vs Database Sync
**Scenario:**
- Session invalidated in DB
- Session still in memory cache
- User makes request, memory returns active session

**Current Protection:** Memory cleared in invalidateUserSessions
**Vulnerability:** ✅ HANDLED (lines 1487-1490)

---

## OPTIMIZATION OPPORTUNITIES

### 1. Session Queries (HIGH IMPACT)
**Current:** Each getSession queries database
**Cost:** N database queries for N users
**Fix:** LRU cache (already exists, verify usage)
**Savings:** ~70% database queries

### 2. User Queries (HIGH IMPACT)
**Current:** Each queue request fetches all user data
**Cost:** Large SELECT * queries
**Fix:** Minimal field selection for queue
**Savings:** ~60% query size

### 3. Presence Updates (MEDIUM IMPACT)
**Current:** Updates on every heartbeat
**Cost:** Frequent DB writes
**Fix:** Batch updates, longer intervals
**Savings:** ~50% write operations

### 4. Location Queries (LOW IMPACT)
**Current:** Haversine calculation in JavaScript
**Cost:** CPU for each user pair
**Fix:** PostGIS distance function
**Savings:** ~30% CPU usage

### 5. Socket.io Compression (ALREADY DONE)
**Current:** perMessageDeflate enabled
**Status:** ✅ IMPLEMENTED
**Savings:** ~40% bandwidth

---

Analyzing code for fixes...
