# ANALYSIS BEFORE FIX

## Issue #1: QR Code Generation Broken

### Current Flow:
1. Admin panel: Click "Generate QR Code" button
2. Calls: handleGenerateQRCode()
3. Line 165-166: Gets adminToken, checks if exists
4. Line 170: POST to /payment/admin/generate-code
5. Line 173: Headers include adminToken
6. Backend: requireAdmin checks token
7. Should create QR code

### Where It Breaks:
**Line 173:** `'Authorization': \`Bearer ${adminToken}\``

**Problem:** adminToken is defined in line 165 scope, not line 173 scope!

**Fix Needed:**
- adminToken needs to be accessible inside fetch call
- It IS in scope (async function scope)
- Must be a different issue

**Actually checking line 165:**
```typescript
const adminToken = localStorage.getItem('napalmsky_admin_token');
if (!adminToken || !qrLabel.trim()) return;
```

If button is disabled when qrLabel is empty, that could prevent clicks.
Or backend is returning 401 because Railway hasn't deployed requireAdmin fix yet.

### Most Likely Cause:
Railway backend still has OLD code with requireAuth + requireAdmin collision.
Admin panel is working correctly, server endpoints returning 401.

---

## Issue #2: Wait Page Not Updating on Admin Changes

### Current Flow:
1. Admin toggles Event Mode
2. Backend: POST /admin/event/settings
3. Should emit: io.emit('event:settings-changed')
4. Wait page listens: socket.on('event:settings-changed')
5. Should trigger loadData() or redirect

### Checking Backend:
Let me verify if io.emit is actually being called...

### Checking Frontend:
Let me verify if socket listener is properly set up...

### Analysis Needed:
1. Does backend emit the event?
2. Does frontend listen for it?
3. Is socket properly connected?

---

## PLAN

1. First verify both issues in code
2. Identify root causes
3. Make targeted fixes
4. Test before committing

Not committing anything until thorough analysis complete.

