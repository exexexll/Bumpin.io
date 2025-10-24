# Reconnection Logic - Complete Analysis & Industry Standards

**Date**: October 24, 2025  
**Status**: Current Implementation Review + Proposed Improvements

---

## Table of Contents
1. [Current WebRTC Reconnection Flow](#webrtc-reconnection)
2. [Current Text Mode Reconnection Flow](#text-mode-reconnection)
3. [Socket.io Layer](#socketio-layer)
4. [Server-Side Grace Period](#server-side-handling)
5. [Issues & Gaps](#issues-found)
6. [Industry Standard Improvements](#industry-standards)
7. [Proposed Fixes](#proposed-improvements)

---

## 1. WebRTC Reconnection Flow {#webrtc-reconnection}

### Current Implementation

#### State Machine
```
'initializing' → 'gathering' → 'connecting' → 'connected'
                                     ↓
                              'reconnecting' ↔ 'connected'
                                     ↓
                                  'failed'
```

#### Detection (Lines 346-447 in room/[roomId]/page.tsx)
```typescript
pc.onconnectionstatechange = () => {
  if (state === 'disconnected') {
    // Check: Only if previously connected (prevents false positives)
    if (connectionPhase !== 'connected' && connectionPhase !== 'reconnecting') {
      return; // Ignore during initial setup
    }
    
    // Already reconnecting? Skip duplicate
    if (connectionPhase === 'reconnecting') return;
    
    // Enter grace period
    setConnectionPhase('reconnecting');
    
    // 3 reconnection attempts at 2s, 5s, 8s
    // 10 second total grace period
  }
}
```

#### Reconnection Mechanism
1. **ICE Restart**: `pc.restartIce()` - triggers ICE gathering
2. **New Offer**: If initiator, creates fresh offer with `iceRestart: true`
3. **SDP Renegotiation**: Preserves m-line order (critical fix)
4. **Retry Schedule**: 3 attempts at 2s, 5s, 8s intervals
5. **Grace Period**: 10 seconds total before failure

#### Success Handling
```typescript
if (pc.connectionState === 'connected') {
  setConnectionPhase('connected');
  setPermissionError('');
  // Clear all pending reconnection attempts
  reconnectTimeouts.forEach(t => clearTimeout(t));
}
```

#### Failure Handling
```typescript
// After 10s
if (still disconnected) {
  // Notify peer
  socket.emit('connection:failed', { roomId, reason });
  
  // Update server: Start server-side grace period
  socket.emit('room:disconnected', { roomId });
  
  // Show error UI
  setConnectionFailed(true);
  setShowPermissionSheet(true);
}
```

### Strengths ✅
- **False Positive Prevention**: Only reconnects if previously `connected`
- **Duplicate Prevention**: Checks if already reconnecting
- **Multiple Retries**: 3 attempts with increasing delays
- **ICE Restart**: Proper WebRTC reconnection mechanism
- **m-line Order Preservation**: Prevents SDP mismatch errors
- **Peer Notification**: Informs partner immediately

### Weaknesses ❌
1. **No Network Change Detection**: Doesn't detect WiFi → 4G switches
2. **No Connection Quality Tracking**: No RTCStats monitoring
3. **Fixed Retry Strategy**: Doesn't adapt to network conditions
4. **No Exponential Backoff**: Linear retry schedule
5. **Tab Reload Handling**: Relies on sessionStorage (fragile)
6. **No ICE Candidate Trickle**: Batches candidates inefficiently

---

## 2. Text Mode Reconnection {#text-mode-reconnection}

### Current Implementation (text-room/[roomId]/page.tsx)

#### Socket Reconnection (Lines 126-135)
```typescript
socket.on('connect', () => {
  setShowReconnecting(false);
  socket.emit('room:join', { roomId });
});

socket.on('reconnect', () => {
  setShowReconnecting(false);
  socket.emit('room:join', { roomId });
});
```

#### Tab Reload Detection (Lines 89-111)
```typescript
const storedRoomId = sessionStorage.getItem('current_text_room_id');
const wasActive = sessionStorage.getItem('text_room_active') === 'true';
const lastJoinTime = parseInt(sessionStorage.getItem('text_room_join_time') || '0');
const timeSinceJoin = Date.now() - lastJoinTime;

const isSameRoom = storedRoomId === roomId;
const isRecentReload = timeSinceJoin > 0 && timeSinceJoin < 10000; // 10s

if (isSameRoom && wasActive && isRecentReload) {
  setShowReconnecting(true); // Show reconnecting UI
}
```

#### Torch Rule Reset on Reconnection (Server: index.ts:1046-1059)
```typescript
// CRITICAL: Reset activity timestamps on reconnection
if (room.chatMode === 'text') {
  const activity = textRoomActivity.get(roomId);
  if (activity) {
    const isUser1 = room.user1 === currentUserId;
    if (isUser1) {
      activity.user1LastMessageAt = Date.now();
    } else {
      activity.user2LastMessageAt = Date.now();
    }
    // Clear warning
    activity.warningStartedAt = null;
    io.to(roomId).emit('textroom:inactivity-cleared');
  }
}
```

### Strengths ✅
- **Socket.io Auto-Reconnect**: Built-in exponential backoff (1s, 2s, 4s, 8s, 16s)
- **Simple Rejoin**: Just re-emit `room:join`
- **Activity Reset**: Prevents false inactivity after reconnect
- **Grace Period Support**: Server allows 10s reconnection window

### Weaknesses ❌
1. **No Message Queue**: Messages sent during disconnect are lost
2. **No State Sync**: Doesn't reload messages after reconnect
3. **No Typing State Restore**: Partner's typing indicator lost
4. **sessionStorage Reliance**: Can be cleared by browser
5. **No Offline Detection**: Doesn't show "You are offline"

---

## 3. Socket.io Layer {#socketio-layer}

### Current Configuration (lib/socket.ts)

```typescript
socket = io(SOCKET_URL, {
  autoConnect: true,
  auth: { token: sessionToken },
  transports: ['websocket', 'polling'], // WS preferred
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
});
```

### Heartbeat Mechanism (Lines 53-66)
```typescript
// Send heartbeat every 20s to keep presence alive
heartbeatInterval = setInterval(() => {
  if (socket?.connected) {
    socket.emit('heartbeat');
  }
}, 20000);
```

### Events Handled
- ✅ `connect` - Connection established
- ✅ `disconnect` - Connection lost
- ✅ `reconnect` - Reconnection successful
- ✅ `connect_error` - Connection error
- ✅ `auth:success` / `auth:failed` - Authentication

### Strengths ✅
- **Exponential Backoff**: Built into Socket.io
- **Dual Transport**: WebSocket + Polling fallback
- **Auth in Handshake**: Secure token passing
- **Heartbeat**: Keeps connection alive

### Weaknesses ❌
1. **Fixed Reconnection Attempts**: Only 5 attempts (50s max)
2. **No Reconnection Timeout**: Could reconnect forever
3. **No Network Type Detection**: Doesn't adapt to 4G vs WiFi
4. **Heartbeat Too Frequent**: 20s is aggressive for mobile
5. **No Ping-Pong Monitoring**: Doesn't track latency

---

## 4. Server-Side Grace Period {#server-side-handling}

### Implementation (server/src/index.ts:1094-1181)

#### Disconnect Detection
```typescript
socket.on('room:disconnected', async ({ roomId }) => {
  // Mark user as disconnected
  if (room.user1 === currentUserId) room.user1Connected = false;
  if (room.user2 === currentUserId) room.user2Connected = false;
  
  // Start grace period
  if (room.status === 'active') {
    room.status = 'grace_period';
    room.gracePeriodExpires = Date.now() + 10000; // 10s
    
    // Notify partner
    io.to(partnerSocketId).emit('room:partner-disconnected', {
      gracePeriodSeconds: 10,
      userId: currentUserId,
    });
    
    // Schedule cleanup after 10s
    setTimeout(async () => {
      if (room.status === 'grace_period') {
        // End session, save history, set cooldown
        room.status = 'ended';
        io.to(roomId).emit('room:ended-by-disconnect');
        // ... save history, cleanup ...
        activeRooms.delete(roomId);
        textRoomActivity.delete(roomId);
      }
    }, 10000);
  }
});
```

#### Rejoin During Grace Period (Lines 1032-1064)
```typescript
socket.on('room:join', async ({ roomId }) => {
  if (room.status === 'grace_period') {
    // Check not expired
    if (Date.now() > room.gracePeriodExpires) {
      return socket.emit('room:ended');
    }
    
    // Allow reconnection
    room.status = 'active';
    room.user1Connected = true; // or user2
    
    // Reset torch rule activity (TEXT MODE)
    if (room.chatMode === 'text') {
      const activity = textRoomActivity.get(roomId);
      activity.user1LastMessageAt = Date.now();
      activity.warningStartedAt = null;
      io.to(roomId).emit('textroom:inactivity-cleared');
    }
    
    // Notify partner
    io.to(roomId).emit('room:partner-reconnected', { userId });
  }
});
```

### Strengths ✅
- **Grace Period**: 10s window for reconnection
- **Partner Notification**: Real-time UI updates
- **History Preservation**: Saves session before deletion
- **Cooldown Management**: Prevents immediate re-matching
- **Memory Cleanup**: Deletes both room and activity data

### Weaknesses ❌
1. **Fixed Grace Period**: 10s might be too short for mobile
2. **No Retry Tracking**: Doesn't count reconnection attempts
3. **Single Timeout**: Not cancellable if reconnected early
4. **No Persistent State**: Room lost on server restart
5. **Memory Leaks**: setTimeout references not tracked

---

## 5. Issues & Gaps {#issues-found}

### Critical Issues 🔴

1. **Race Condition on Tab Reload**
   - sessionStorage writes happen async
   - If tab closes before write completes → data lost
   - No guarantee room state is saved

2. **Server Restart = Lost Sessions**
   - All activeRooms in-memory only
   - Server restart disconnects all users
   - No recovery mechanism

3. **WebRTC State Desync**
   - Client thinks connected, server shows disconnected
   - Or vice versa
   - No heartbeat for WebRTC connection state

4. **m-line Order Still Fragile**
   - Only handles during renegotiation
   - Doesn't validate SDP structure
   - Could fail on complex tracks (screen share)

### Medium Issues 🟡

1. **No Message Persistence**
   - Text chat messages only in-memory
   - Lost on server restart
   - Not saved in history

2. **No Offline Queue**
   - Messages sent while offline are dropped
   - No retry mechanism
   - Poor UX on spotty networks

3. **Tab Reload Ambiguity**
   - Hard to distinguish: reconnect vs new room
   - sessionStorage can be stale
   - 10s window too narrow?

4. **No Connection Quality Monitoring**
   - Doesn't track packet loss, jitter, RTT
   - Can't adapt quality
   - No warning before disconnect

### Low Issues 🟢

1. **Heartbeat Overhead**
   - Every 20s is frequent
   - Could be 30s+ for battery life
   - No adaptive interval

2. **Fixed Retry Strategy**
   - Doesn't adapt to network type
   - 4G needs longer delays than WiFi
   - No jitter in retry schedule

---

## 6. Industry Standards {#industry-standards}

### WebRTC Reconnection Best Practices

#### 1. **Connection State Monitoring** (RFC 5245)
```typescript
// Track multiple state dimensions
pc.oniceconnectionstatechange = () => {
  // Monitor: new, checking, connected, completed, failed, disconnected, closed
}

pc.onconnectionstatechange = () => {
  // Monitor: new, connecting, connected, disconnected, failed, closed
}

// Use BOTH to determine true connection health
```

#### 2. **ICE Restart Triggers** (RFC 8863)
- Network interface change (WiFi ↔ 4G)
- TURN server failure
- Consecutive failed STUN requests
- RTCStats shows degrading quality

#### 3. **Graceful Degradation**
```typescript
// Step 1: Try ICE restart (5-10s)
// Step 2: Force TURN relay if on WiFi (10-15s)
// Step 3: Create new PeerConnection (15-25s)
// Step 4: Give up (30s total)
```

#### 4. **Network Change Detection**
```typescript
// Modern browsers support
navigator.connection.addEventListener('change', () => {
  const { type, downlink, rtt } = navigator.connection;
  if (type changed) {
    // Proactively trigger ICE restart
    pc.restartIce();
  }
});
```

#### 5. **RTCStats Monitoring**
```typescript
setInterval(async () => {
  const stats = await pc.getStats();
  stats.forEach(report => {
    if (report.type === 'inbound-rtp') {
      const { packetsLost, jitter, bytesReceived } = report;
      // Detect: packet loss > 5%, jitter > 100ms
      if (packetsLost / report.packetsReceived > 0.05) {
        // Warn user or degrade quality
      }
    }
  });
}, 5000); // Every 5s
```

### Socket.io Reconnection Best Practices

#### 1. **Exponential Backoff with Jitter**
```typescript
reconnectionDelay: (attempt) => {
  const base = 1000;
  const delay = Math.min(base * Math.pow(2, attempt), 30000); // Cap at 30s
  const jitter = Math.random() * 1000; // ±1s randomness
  return delay + jitter;
}
```

#### 2. **Message Queueing**
```typescript
// Queue messages during disconnect
const messageQueue: Message[] = [];

socket.on('disconnect', () => {
  queueEnabled = true;
});

socket.on('reconnect', () => {
  // Flush queue
  messageQueue.forEach(msg => socket.emit('chat', msg));
  messageQueue.length = 0;
  queueEnabled = false;
});
```

#### 3. **Sequence Numbers**
```typescript
// Ensure message ordering
let messageSeq = 0;

socket.emit('chat', { 
  text: 'Hello', 
  seq: messageSeq++,
  timestamp: Date.now()
});

// Server ACKs with seq
socket.on('chat:ack', ({ seq }) => {
  // Remove from retry queue
});
```

#### 4. **Heartbeat with Timeout**
```typescript
let lastPong = Date.now();

// Ping every 25s
setInterval(() => {
  const now = Date.now();
  if (now - lastPong > 60000) {
    // No pong for 60s - disconnect stale connection
    socket.disconnect();
  }
  socket.emit('ping', { timestamp: now });
}, 25000);

socket.on('pong', ({ timestamp }) => {
  lastPong = Date.now();
  const rtt = Date.now() - timestamp;
  console.log('RTT:', rtt, 'ms');
});
```

### Presence System Best Practices

#### 1. **Stale Presence Detection**
```typescript
// Server-side
const presenceTimeout = 60000; // 1 minute

setInterval(() => {
  for (const [userId, presence] of presences.entries()) {
    if (Date.now() - presence.lastHeartbeat > presenceTimeout) {
      // Mark as offline
      presence.online = false;
      presence.available = false;
      // Notify subscribers
      io.emit('presence:update', { userId, online: false });
    }
  }
}, 30000); // Check every 30s
```

#### 2. **Presence Subscription**
```typescript
// Only send presence updates to interested users
socket.on('presence:subscribe', ({ userIds }) => {
  // Track subscriptions
  subscriptions.set(socket.id, userIds);
});

// When user goes offline
userIds.forEach(subscriberId => {
  const socketId = activeSockets.get(subscriberId);
  if (socketId) {
    io.to(socketId).emit('presence:update', { userId, online: false });
  }
});
```

### State Persistence Best Practices

#### 1. **Redis for Active Sessions**
```typescript
// Store room state in Redis (survives server restart)
await redis.hset(`room:${roomId}`, {
  user1,
  user2,
  startedAt,
  chatMode,
  status,
  gracePeriodExpires,
});

// TTL: Auto-delete after 1 hour
await redis.expire(`room:${roomId}`, 3600);
```

#### 2. **Database for Message History**
```typescript
// Save every message immediately
await db.query(
  'INSERT INTO messages (room_id, from_user, content, sent_at) VALUES ($1, $2, $3, $4)',
  [roomId, userId, content, new Date()]
);

// On reconnect: Load last N messages
const messages = await db.query(
  'SELECT * FROM messages WHERE room_id = $1 ORDER BY sent_at DESC LIMIT 50',
  [roomId]
);
```

---

## 7. Proposed Improvements {#proposed-improvements}

### Phase 1: Critical Fixes (1-2 days)

#### 1.1 Network Change Detection
```typescript
// Add to room/[roomId]/page.tsx
useEffect(() => {
  if (!('connection' in navigator)) return;
  
  const handleNetworkChange = () => {
    const conn = (navigator as any).connection;
    console.log('[Network] Type changed to:', conn.effectiveType);
    
    // Proactively restart ICE
    if (peerConnectionRef.current?.connectionState === 'connected') {
      console.log('[Network] Proactive ICE restart due to network change');
      peerConnectionRef.current.restartIce();
    }
  };
  
  (navigator as any).connection?.addEventListener('change', handleNetworkChange);
  
  return () => {
    (navigator as any).connection?.removeEventListener('change', handleNetworkChange);
  };
}, []);
```

#### 1.2 Message Queueing (Text Mode)
```typescript
// Add message queue
const messageQueue = useRef<QueuedMessage[]>([]);
const [isOnline, setIsOnline] = useState(true);

socket.on('disconnect', () => {
  setIsOnline(false);
});

socket.on('reconnect', () => {
  setIsOnline(true);
  // Flush queue
  messageQueue.current.forEach(msg => {
    socket.emit('textchat:send', msg);
  });
  messageQueue.current = [];
});

const handleSendMessage = (content: string) => {
  const message = { roomId, messageType: 'text', content, timestamp: Date.now() };
  
  if (!socket.connected) {
    // Queue for later
    messageQueue.current.push(message);
    // Show in UI optimistically
    setMessages(prev => [...prev, { ...message, pending: true }]);
  } else {
    socket.emit('textchat:send', message);
  }
};
```

#### 1.3 RTCStats Monitoring
```typescript
// Add connection quality monitoring
useEffect(() => {
  if (!peerConnectionRef.current) return;
  
  const interval = setInterval(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || pc.connectionState !== 'connected') return;
    
    const stats = await pc.getStats();
    let packetsLost = 0;
    let packetsReceived = 0;
    
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        packetsLost += report.packetsLost || 0;
        packetsReceived += report.packetsReceived || 0;
      }
    });
    
    const lossRate = packetsReceived > 0 ? packetsLost / packetsReceived : 0;
    
    if (lossRate > 0.1) {
      console.warn('[WebRTC] High packet loss:', (lossRate * 100).toFixed(1), '%');
      // Show warning to user
      setConnectionQuality('poor');
    } else if (lossRate > 0.05) {
      setConnectionQuality('fair');
    } else {
      setConnectionQuality('good');
    }
  }, 5000);
  
  return () => clearInterval(interval);
}, []);
```

### Phase 2: Robustness (3-5 days)

#### 2.1 Redis for Session Persistence
```typescript
// Server: Store active rooms in Redis
await redis.hset(`room:${roomId}`, {
  user1: room.user1,
  user2: room.user2,
  startedAt: room.startedAt.toString(),
  chatMode: room.chatMode,
  status: room.status,
  gracePeriodExpires: room.gracePeriodExpires?.toString() || '',
});

await redis.expire(`room:${roomId}`, 3600); // 1 hour TTL

// On server restart: Recover rooms from Redis
async function recoverRooms() {
  const keys = await redis.keys('room:*');
  for (const key of keys) {
    const data = await redis.hgetall(key);
    const roomId = key.replace('room:', '');
    activeRooms.set(roomId, {
      user1: data.user1,
      user2: data.user2,
      // ... restore state
    });
  }
  console.log(`[Recovery] Restored ${keys.length} rooms from Redis`);
}
```

#### 2.2 Database Message Persistence
```typescript
// Save all text chat messages to database
socket.on('textchat:send', async ({ roomId, content }) => {
  const messageId = uuidv4();
  
  // Save to database FIRST
  await db.query(
    `INSERT INTO text_messages (message_id, room_id, from_user, content, sent_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [messageId, roomId, currentUserId, content]
  );
  
  // Then broadcast
  io.to(roomId).emit('textchat:message', {
    messageId,
    from: currentUserId,
    content,
    timestamp: Date.now(),
  });
});

// On reconnect: Load message history
socket.on('textchat:get-history', async ({ roomId, since }, callback) => {
  const result = await db.query(
    `SELECT * FROM text_messages 
     WHERE room_id = $1 AND sent_at > $2
     ORDER BY sent_at ASC`,
    [roomId, since || new Date(0)]
  );
  
  callback({ success: true, messages: result.rows });
});
```

#### 2.3 Exponential Backoff with Jitter
```typescript
// Update lib/socket.ts
socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity, // Keep trying
  reconnectionDelay: (attempt) => {
    const base = 1000;
    const delay = Math.min(base * Math.pow(2, attempt), 30000);
    const jitter = Math.random() * 1000;
    return delay + jitter;
  },
  reconnectionDelayMax: 30000, // Max 30s between attempts
  timeout: 20000,
});
```

### Phase 3: Optimization (5-7 days)

#### 3.1 Adaptive Heartbeat
```typescript
// Adjust heartbeat based on network type
const getHeartbeatInterval = () => {
  if (!('connection' in navigator)) return 20000;
  
  const conn = (navigator as any).connection;
  const type = conn.effectiveType; // '4g', '3g', '2g', 'slow-2g'
  
  if (type === '4g' || type === 'wifi') return 25000; // 25s
  if (type === '3g') return 30000; // 30s
  return 45000; // 45s for 2g
};

let heartbeatInterval = setInterval(() => {
  socket.emit('heartbeat');
}, getHeartbeatInterval());

// Update on network change
navigator.connection?.addEventListener('change', () => {
  clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    socket.emit('heartbeat');
  }, getHeartbeatInterval());
});
```

#### 3.2 ICE Candidate Optimization
```typescript
// Trickle ICE candidates immediately (don't batch)
pc.onicecandidate = (event) => {
  if (event.candidate) {
    // Send immediately for faster connection
    socket.emit('rtc:ice', { roomId, candidate: event.candidate });
    
    // Log candidate type for debugging
    console.log('[ICE] Sending candidate:', event.candidate.type);
  } else {
    // Gathering complete
    console.log('[ICE] Gathering complete');
  }
};

// Prioritize TURN candidates on mobile
if (isMobile) {
  config.iceTransportPolicy = 'relay'; // Force TURN
}
```

#### 3.3 Server-Side Cleanup Improvements
```typescript
// Cancel grace period timeout if reconnected
const gracePeriodTimeouts = new Map<string, NodeJS.Timeout>();

socket.on('room:disconnected', ({ roomId }) => {
  // ... existing grace period logic ...
  
  const timeout = setTimeout(async () => {
    // ... end session logic ...
  }, 10000);
  
  // Store timeout so we can cancel it
  gracePeriodTimeouts.set(roomId, timeout);
});

socket.on('room:join', ({ roomId }) => {
  // ... existing rejoin logic ...
  
  // CANCEL grace period timeout
  const timeout = gracePeriodTimeouts.get(roomId);
  if (timeout) {
    clearTimeout(timeout);
    gracePeriodTimeouts.delete(roomId);
    console.log('[Room] Grace period cancelled - user reconnected');
  }
});
```

---

## Summary

### Current State: ⭐⭐⭐☆☆ (3/5)
- Basic reconnection works
- Grace period implemented
- ICE restart functional
- No major crashes

### After Phase 1: ⭐⭐⭐⭐☆ (4/5)
- Network change detection
- Message queueing
- Connection quality monitoring
- Production-ready for most scenarios

### After Phase 2: ⭐⭐⭐⭐⭐ (5/5)
- Redis persistence
- Message history
- Server restart recovery
- Exponential backoff
- Industry-standard robustness

### After Phase 3: ⭐⭐⭐⭐⭐+ (5+/5)
- Adaptive heartbeat
- ICE optimization
- Advanced cleanup
- Best-in-class reconnection

---

**Next Steps**: Prioritize Phase 1 fixes. They provide the most immediate value with minimal complexity.

