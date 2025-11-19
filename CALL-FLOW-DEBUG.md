# Call Flow Debugging

## Issue: One side loads chatroom, other side stuck loading

## Expected Flow:
1. User A sends invite → server stores ActiveInvite
2. User B accepts → server receives call:accept
3. Server creates room
4. Server emits call:start to BOTH User A and User B
5. Both navigate to /room/[roomId]

## Potential Issues:
- Server only emitting to one user
- Socket IDs not found for one user
- One user's socket disconnected
- Navigation happening before call:start received

Let me check the emission logic...
