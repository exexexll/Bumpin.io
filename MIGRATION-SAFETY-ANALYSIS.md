# Migration Safety Analysis - BEFORE Implementation

**Date**: October 24, 2025  
**Migration**: add-active-rooms-and-referrals.sql  
**Status**: ⚠️ SAFE TO RUN, BUT CODE CHANGES REQUIRE CAREFUL REVIEW

---

## ✅ Migration SQL Safety Check

### 1. **Uses IF NOT EXISTS** ✅
```sql
CREATE TABLE IF NOT EXISTS active_rooms (...)
CREATE TABLE IF NOT EXISTS referral_mappings (...)
CREATE TABLE IF NOT EXISTS text_room_activity (...)
CREATE TABLE IF NOT EXISTS rate_limits (...)
```
**Safety**: ✅ Won't fail if tables already exist  
**Idempotent**: ✅ Can run multiple times safely

### 2. **Uses ADD COLUMN IF NOT EXISTS** ✅
```sql
ALTER TABLE chat_history 
ADD COLUMN IF NOT EXISTS chat_mode VARCHAR(10)...

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS session_data JSONB;
```
**Safety**: ✅ Won't fail if columns exist  
**Backward Compatible**: ✅ Existing data unaffected

### 3. **Foreign Key Constraints** ✅
```sql
user_1 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
```
**Safety**: ✅ Ensures referential integrity  
**Cascade**: ✅ Auto-cleanup when user deleted

### 4. **Check Constraints** ✅
```sql
CHECK (chat_mode IN ('video', 'text'))
CHECK (status IN ('active', 'grace_period', 'ended'))
```
**Safety**: ✅ Prevents invalid data  
**Type Safety**: ✅ Matches TypeScript enums

---

## ⚠️ CODE CHANGES ANALYSIS

### activeRooms - 22 References in index.ts

**Current Implementation**:
```typescript
const activeRooms = new Map<string, {...}>(); // In-memory, fast

// Usage (synchronous):
activeRooms.set(roomId, {...}); // Create room
const room = activeRooms.get(roomId); // Get room (used 15+ times)
activeRooms.delete(roomId); // Delete room
for (const [roomId, room] of activeRooms.entries()) // Iterate
```

**Challenge**: All operations are SYNCHRONOUS and FAST  
**Risk**: Adding `await` for database operations could:
1. Break real-time signaling (WebRTC needs instant responses)
2. Introduce race conditions (async timing issues)
3. Slow down critical paths (every room operation)

### Safe Approach:

**Keep Dual Storage**:
1. **In-Memory Map**: For real-time operations (PRIMARY)
2. **Database Table**: For persistence (SECONDARY)

**Pattern**:
```typescript
// Create room - SAFE
activeRooms.set(roomId, {...}); // Instant (memory)
saveRoomToDatabase(roomId, {...}); // Background (async, don't await)

// Get room - SAFE
const room = activeRooms.get(roomId); // Instant (from memory)

// Update room - SAFE
room.status = 'grace_period'; // Instant (memory)
updateRoomInDatabase(roomId, { status: 'grace_period' }); // Background

// Delete room - SAFE
activeRooms.delete(roomId); // Instant (memory)
deleteRoomFromDatabase(roomId); // Background

// Startup recovery - NEW
async function loadActiveRoomsFromDatabase() {
  const rooms = await query('SELECT * FROM active_rooms WHERE status != \'ended\'');
  rooms.forEach(room => {
    activeRooms.set(room.room_id, convertToMemoryFormat(room));
  });
}
```

---

## 🚨 RISKS OF IMMEDIATE IMPLEMENTATION

### High Risk:
1. **WebRTC Signaling Delays**
   - If we await database on every room operation
   - ICE candidates need instant response
   - Could break video calls

2. **Race Conditions**
   - Memory updated but DB save fails
   - Or vice versa
   - Data inconsistency

3. **Performance Degradation**
   - Database roundtrip: 5-50ms
   - In-memory access: <1ms
   - Could cause lag in calls

### Medium Risk:
4. **Dual-Write Complexity**
   - Need to update both memory AND database
   - Easy to forget one
   - Hard to debug

5. **Recovery Logic**
   - On startup, need to load rooms
   - What if users already disconnected?
   - Grace periods might have expired

---

## ✅ SAFE IMPLEMENTATION PLAN

### Phase 1: Migration Only (SAFE - Do Now)
```bash
# Run migration to create tables
psql $DATABASE_URL -f migrations/add-active-rooms-and-referrals.sql

# Result: Tables exist, but code doesn't use them yet
# Impact: ZERO - Completely safe, no behavior change
```

### Phase 2: Add Background Persistence (SAFE - Next)
```typescript
// In server/src/index.ts

// Helper function (background, non-blocking)
async function syncRoomToDatabase(roomId: string, room: any) {
  if (!process.env.DATABASE_URL) return;
  
  try {
    await query(`
      INSERT INTO active_rooms (room_id, user_1, user_2, started_at, duration_seconds, chat_mode, status, ...)
      VALUES ($1, $2, $3, $4, $5, $6, $7, ...)
      ON CONFLICT (room_id) DO UPDATE SET
        status = EXCLUDED.status,
        user_1_connected = EXCLUDED.user_1_connected,
        ...
    `, [roomId, room.user1, room.user2, ...]);
  } catch (err) {
    console.error('[DB] Failed to sync room (non-critical):', err);
  }
}

// Usage (fire-and-forget):
activeRooms.set(roomId, {...});
syncRoomToDatabase(roomId, {...}); // Don't await! Background only
```

### Phase 3: Add Startup Recovery (SAFE - After Phase 2)
```typescript
// On server startup
async function recoverActiveRooms() {
  try {
    const result = await query(`
      SELECT * FROM active_rooms 
      WHERE status IN ('active', 'grace_period')
      AND updated_at > NOW() - INTERVAL '10 minutes'
    `);
    
    result.rows.forEach(row => {
      // Only recover recent rooms (< 10 min old)
      const room = convertRowToRoom(row);
      activeRooms.set(row.room_id, room);
    });
    
    console.log(`[Recovery] Loaded ${result.rows.length} active rooms`);
  } catch (err) {
    console.error('[Recovery] Failed to load rooms:', err);
    // Non-fatal, continue with empty rooms
  }
}

// Call before starting server
server.listen(PORT, async () => {
  await recoverActiveRooms();
  console.log('Server running');
});
```

---

## 🎯 RECOMMENDATION

### DO NOW (100% Safe):
1. ✅ Run migration to create tables
2. ✅ Tables exist but unused (no risk)
3. ✅ Commit migration file (already done)

### DO NEXT (Requires Testing):
1. ⚠️ Add background database sync (non-blocking)
2. ⚠️ Add startup recovery
3. ⚠️ Test thoroughly before deploying

### DON'T DO YET:
1. ❌ Make all room operations async/await
2. ❌ Replace in-memory Map with DB queries
3. ❌ Remove memory caching

---

## 📋 Migration Integrity Check

### Foreign Keys: ✅ SAFE
- `user_1 REFERENCES users(user_id)` - Ensures valid users
- `ON DELETE CASCADE` - Auto-cleanup when user deleted
- `room_id REFERENCES active_rooms` - Maintains relationships

### Constraints: ✅ SAFE
- `CHECK (chat_mode IN ('video', 'text'))` - Matches code
- `CHECK (status IN ('active', 'grace_period', 'ended'))` - Matches code
- Primary keys prevent duplicates

### Indexes: ✅ SAFE
- All foreign keys indexed (performance)
- Common query patterns covered
- No unnecessary indexes (bloat)

### Data Types: ✅ SAFE
- UUID for IDs (matches code)
- TIMESTAMP for dates (matches Date.now())
- JSONB for arrays/objects (matches code)
- BOOLEAN for flags (matches code)

---

## ✅ VERDICT

**Migration SQL**: ✅ 100% SAFE TO RUN  
**Code Changes**: ⚠️ NEED CAREFUL IMPLEMENTATION  

**Recommendation**:
1. Run migration NOW (creates tables, zero risk)
2. Let me implement the dual-storage pattern carefully
3. Test on staging before production
4. Or accept that active rooms are lost on restart (current behavior)

---

**The migration file itself is safe and ready. Should I proceed with implementing the code changes to actually USE these tables?**

