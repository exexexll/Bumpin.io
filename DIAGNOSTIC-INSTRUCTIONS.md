# Diagnostic Instructions

## Issue: User count shows but cards don't appear

This means totalAvailable is correct but users[] array is wrong.

## What to Check in Console:

### When you open matchmaking overlay, look for:

```
[Matchmake] ✅ Received from API: X users shown, Y total available
```

**CRITICAL QUESTION:**  
- If X = 0 but Y > 0 → Server returning empty users array (server bug)
- If X = Y > 0 → Users received but not rendering (frontend bug)

### Also check:

```
[Matchmake] User names: [list of names]
[Matchmake] Setting users state with X users
```

This shows if users are being set in React state.

### Then check:

```
[Matchmake] 🔍 Users array changed - now has: X users  
[Matchmake] 🔍 User list: [names]
```

This shows if state update triggered.

## Quick Test:

Open console, open matchmaking, and paste this:

```javascript
// Check users state
const matchmakeComponent = document.querySelector('[role="list"]');
console.log('Matchmake element exists:', !!matchmakeComponent);

// Check what API returns
fetch('http://localhost:3001/room/queue', {
  headers: { 
    'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('bumpin_session')).sessionToken 
  }
}).then(r => r.json()).then(d => {
  console.log('API totalAvailable:', d.totalAvailable);
  console.log('API users.length:', d.users.length);
  console.log('API users:', d.users.map(u => u.name));
});
```

Share the output!
