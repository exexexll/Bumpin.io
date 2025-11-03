BACKGROUND QUEUE - CRITICAL ISSUES TO FIX
==========================================

## Issue 1: User Cards Stop Showing After Exiting Overlay

Symptom: Exit matchmaking overlay → Cards don't load on re-enter
Root Cause: MatchmakeOverlay calls queue:leave on close
- Even when background queue is ON
- Should NOT leave queue if background enabled

Fix Needed:
- Check backgroundQueue.isBackgroundEnabled() before emitting queue:leave
- Only leave if background queue is OFF

## Issue 2: Can't Receive Calls When Overlay Closed

Symptom: Close overlay → No call/invite notifications
Root Cause: CalleeNotification only renders inside MatchmakeOverlay
- When overlay closed (showMatchmake = false)
- CalleeNotification unmounts
- Can't receive notifications!

Fix Needed:
- Move CalleeNotification to app/main/page.tsx
- Render it OUTSIDE the conditional {showMatchmake && ...}
- Always render, even when overlay closed
- Pass socket from main page

Implementing fixes now...
