# Background Queue Debugging Guide

## Current Status

**Database Error:** ✅ FIXED (Non-critical)
- The `last_login` column error is already handled with try-catch
- Line 432 in `server/src/usc-verification.ts` logs warning but continues
- No action needed - this is intentional for backward compatibility

**Background Queue:** 🔍 NEEDS TESTING

---

## How to Test Background Queue

### Step 1: Open Browser Console
Open Developer Tools (F12) and watch for these logs:

### Step 2: Check GlobalCallHandler Initialization
When you first load any page, you should see:
```
[GlobalCallHandler] No socket exists, creating new connection...
[Socket] Creating new socket connection to: wss://...
[Socket] ✅ Connected: {socket_id}
[GlobalCallHandler] Background queue initialized with socket
[GlobalCallHandler] Setting up persistent call listeners
[GlobalCallHandler] ✅ Persistent listeners active (works on ALL pages)
```

### Step 3: Check Background Queue Setup
You should also see:
```
[BackgroundQueue] Setting up global call listeners for background queue
[BackgroundQueue] Global call listeners active
```

### Step 4: Turn ON Background Queue Toggle
On `/main` page, click the Background Queue toggle to ON.

You should see:
```
[Main] Background queue: ON
[BackgroundQueue] ========== JOIN QUEUE CALLED ==========
[BackgroundQueue] Socket exists: true
[BackgroundQueue] Socket connected: true
[BackgroundQueue] Already in queue: false
[BackgroundQueue] Document hidden: false
[BackgroundQueue] Background enabled: true
[BackgroundQueue] Current page: /main
[BackgroundQueue] ✅ Emitting queue:join to server
[BackgroundQueue] ✅ Successfully joined queue, inQueue = true
```

### Step 5: Navigate to Settings
Click "Settings" button. You should see:
```
[Main] Closing matchmaking overlay
[Main] Background queue toggle ON - staying in queue for other pages
```

Socket listeners should stay active (no disconnect logs).

### Step 6: Simulate Incoming Call
Have another user send you an invite while on `/settings`.

You should see:
```
[BackgroundQueue] ✅ Received call notification while in background queue
[BackgroundQueue] From: {sender_name}
[BackgroundQueue] Current page: /settings
[GlobalCallHandler] ✅ INCOMING CALL: {data}
[GlobalCallHandler] From: {sender_name}
[GlobalCallHandler] Current page: /settings
```

CalleeNotification modal should appear on top of settings page.

---

## Common Issues & Solutions

### Issue 1: No [GlobalCallHandler] logs
**Problem:** GlobalCallHandler not mounting  
**Check:** Is `<GlobalCallHandler />` in `app/layout.tsx`?  
**Fix:** Verify line 103 in layout.tsx has the component

### Issue 2: "Socket not connected" when joining queue
**Problem:** Socket connecting asynchronously  
**Solution:** Wait a few seconds for connection, or check [Socket] ✅ Connected log

### Issue 3: "Background disabled, not on /main"
**Problem:** Toggle is OFF  
**Solution:** Turn toggle ON first on /main page

### Issue 4: "Tab hidden, not joining queue"
**Problem:** Browser tab not focused  
**Solution:** Make sure tab is visible and focused

### Issue 5: No logs at all
**Problem:** Session might not exist  
**Check:** Look for `[GlobalCallHandler] No session, skipping socket setup`  
**Solution:** Make sure you're logged in

---

## Test Checklist

- [ ] GlobalCallHandler mounts on page load
- [ ] Socket connects successfully
- [ ] Background queue initializes
- [ ] Toggle ON triggers joinQueue()
- [ ] Console shows "inQueue = true"
- [ ] Navigate to /settings
- [ ] Queue stays active (no leave logs)
- [ ] Incoming call shows notification on /settings
- [ ] Accept works and navigates to room

---

## Debug Commands

### Check localStorage:
```javascript
localStorage.getItem('bumpin_background_queue')
// Should return: "true" when toggle is ON
```

### Check session:
```javascript
JSON.parse(localStorage.getItem('bumpin_session'))
// Should return: { sessionToken, userId, ... }
```

### Manual test:
```javascript
// In console on ANY page with toggle ON
window.dispatchEvent(new CustomEvent('backgroundqueue:call', { 
  detail: { 
    inviteId: 'test',
    fromUser: { name: 'Test User', userId: 'test' },
    requestedSeconds: 300,
    chatMode: 'video',
    ttlMs: 20000
  }
}))
// Should show CalleeNotification if GlobalCallHandler is working
```

---

## Expected Console Output (Full Flow)

```
// Page Load
[GlobalCallHandler] Socket not connected, connecting now...
[Socket] Creating new socket connection to: wss://...
[Socket] ✅ Connected: abc123
[Socket] ✅ Authenticated successfully
[GlobalCallHandler] Background queue initialized with socket
[BackgroundQueue] Setting up global call listeners for background queue
[BackgroundQueue] Global call listeners active
[GlobalCallHandler] ✅ Persistent listeners active (works on ALL pages)

// Toggle ON
[Main] Background queue: ON
[BackgroundQueue] ========== JOIN QUEUE CALLED ==========
[BackgroundQueue] Socket exists: true
[BackgroundQueue] Socket connected: true
[BackgroundQueue] ✅ Emitting queue:join to server
[BackgroundQueue] ✅ Successfully joined queue, inQueue = true

// Navigate to /settings
(No queue leave logs - stays active)

// Incoming call
[BackgroundQueue] ✅ Received call notification while in background queue
[GlobalCallHandler] ✅ INCOMING CALL: {...}
(CalleeNotification appears)

// Accept call
[GlobalCallHandler] ✅ Call ACCEPTED
[GlobalCallHandler] Waiting for call:start...
[GlobalCallHandler] ✅ CALL STARTING: {...}
[GlobalCallHandler] Navigating to room from: /settings
(Navigate to /room/{roomId})
```

---

## If Still Not Working

Please share console logs showing:
1. When you first load the page
2. When you toggle background queue ON
3. When you navigate to another page
4. Any errors in red

This will help identify the exact failure point.

