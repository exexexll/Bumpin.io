# Text Mode "Torch Rule" - Comprehensive Implementation Plan

## Overview:
Text mode has NO fixed time limit. Connection stays alive based on activity.

---

## Rules:

### Stay Alive If:
1. ✅ User actively sending messages
2. ✅ Connection is open
3. ✅ Passes inactivity check

### Inactivity System:
- **2 minutes** of no messages from either user → Start 60s countdown
- **60 second** warning shows on UI
- User sends message → Countdown resets, session continues
- **Countdown reaches 0** → Session ends

---

## Database Changes:

```sql
-- Track last activity per room (for text mode only)
CREATE TABLE IF NOT EXISTS text_room_activity (
  room_id TEXT PRIMARY KEY,
  user1_last_message_at TIMESTAMP,
  user2_last_message_at TIMESTAMP,
  warning_started_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Backend Logic:

### On Message Send (textchat:send):
```typescript
// Update last activity timestamp
if (room.chatMode === 'text') {
  const isUser1 = room.user1 === currentUserId;
  updateTextRoomActivity(roomId, isUser1 ? 'user1' : 'user2');
}
```

### Background Check (Every 30s):
```typescript
setInterval(() => {
  for (const [roomId, room] of activeRooms.entries()) {
    if (room.chatMode !== 'text') continue;
    
    const activity = getTextRoomActivity(roomId);
    const now = Date.now();
    
    // Check both users' last message time
    const user1Inactive = now - activity.user1LastMessageAt > 120000; // 2min
    const user2Inactive = now - activity.user2LastMessageAt > 120000;
    
    if (user1Inactive || user2Inactive) {
      // Start warning if not already started
      if (!activity.warningStartedAt) {
        activity.warningStartedAt = now;
        io.to(roomId).emit('textroom:inactivity-warning', {
          secondsRemaining: 60
        });
      } else {
        // Check if 60s warning period expired
        const warningSince = now - activity.warningStartedAt;
        if (warningSince > 60000) {
          // End session
          endTextRoomDueToInactivity(roomId);
        } else {
          // Update countdown
          const remaining = Math.ceil((60000 - warningSince) / 1000);
          io.to(roomId).emit('textroom:inactivity-countdown', {
            secondsRemaining: remaining
          });
        }
      }
    } else {
      // Both active - clear warning
      if (activity.warningStartedAt) {
        activity.warningStartedAt = null;
        io.to(roomId).emit('textroom:inactivity-cleared');
      }
    }
  }
}, 30000); // Check every 30s
```

---

## Frontend Changes:

### TextChatRoom Component:

**Remove Fixed Timer:**
```typescript
// NO MORE:
const [timeRemaining, setTimeRemaining] = useState(agreedSeconds);

// INSTEAD:
const [inactivityWarning, setInactivityWarning] = useState(false);
const [inactivityCountdown, setInactivityCountdown] = useState(60);
```

**Listen for Inactivity:**
```typescript
socket.on('textroom:inactivity-warning', ({ secondsRemaining }) => {
  setInactivityWarning(true);
  setInactivityCountdown(secondsRemaining);
});

socket.on('textroom:inactivity-countdown', ({ secondsRemaining }) => {
  setInactivityCountdown(secondsRemaining);
});

socket.on('textroom:inactivity-cleared', () => {
  setInactivityWarning(false);
});

socket.on('textroom:ended-inactivity', () => {
  alert('Session ended due to inactivity');
  router.push('/history');
});
```

**UI Display:**
```tsx
{/* Header - NO timer for text mode */}
<div>
  {inactivityWarning ? (
    <div className="text-yellow-300 flex items-center gap-2">
      <svg className="w-5 h-5 animate-pulse">...</svg>
      <span>Inactive: {inactivityCountdown}s</span>
    </div>
  ) : (
    <span className="text-green-300">● Active</span>
  )}
</div>
```

---

## Matchmaking Changes:

### Remove Time Selection for Text Mode:
```typescript
// In UserCard.tsx
{chatMode === 'video' && (
  <button onClick={() => setShowTimerModal(true)}>
    {seconds}s
  </button>
)}

// Text mode: No timer button, fixed at unlimited
```

### CalleeNotification:
```typescript
{invite.chatMode === 'text' ? (
  <p>Unlimited time - activity-based</p>
) : (
  <input type="number" value={seconds} ... />
)}
```

---

## Video Upgrade Handling:

After 60s in text mode:
```typescript
useEffect(() => {
  // Count messages sent
  if (messages.length >= 5) { // After 5 messages exchanged
    const elapsed = Date.now() - roomStartTime;
    if (elapsed >= 60000) {
      setShowVideoUpgradeButton(true);
    }
  }
}, [messages]);
```

---

## Implementation Order:

1. **Backend**: Text room activity tracking
2. **Backend**: Inactivity check background job
3. **Backend**: Socket events for warnings/countdown
4. **Frontend**: Remove timer from text-room
5. **Frontend**: Add inactivity warning UI
6. **Frontend**: Reset warning on message send
7. **Matchmaking**: Hide time picker for text mode
8. **Testing**: Verify 2min → 60s → end flow

---

## Key Differences from Video Mode:

| Feature | Video Mode | Text Mode |
|---------|------------|-----------|
| Duration | Fixed (60-500s) | Unlimited |
| Timer | Countdown visible | Hidden (unless inactive) |
| End Condition | Timer reaches 0 | Inactivity (2min + 60s) |
| Time Selection | User chooses | N/A (unlimited) |
| Video Upgrade | N/A | After 60s |

---

## Testing Scenarios:

1. **Active Chat**: Send messages every minute → Session never ends ✅
2. **Inactive**: Stop messaging → 2min passes → 60s warning → Send message → Warning clears ✅
3. **Full Inactive**: Stop messaging → 2min + 60s → Session ends ✅
4. **One User Inactive**: Only one user stops → Warning shows → Session can continue ✅

---

This creates a "keep the torch alive" experience - as long as users are engaged, the conversation continues!

