# ADMIN AUTH DEEP DIVE

## Issue: Admin endpoints returning 401

### Checking import chain:

**payment.ts line 6:**
```typescript
import { requireAdmin } from './admin-auth';
```

**admin-auth.ts:**
- Defines `requireAdmin` function (line 87)
- Checks adminSessions Map
- adminSessions is module-level variable
- Should work... unless...

### PROBLEM FOUND:

**adminSessions is in-memory Map:**
```typescript
const adminSessions = new Map<string, { username: string; createdAt: number }>();
```

**This means:**
- When Railway restarts/redeploys
- adminSessions Map is EMPTY
- Admin must login AGAIN after every deploy
- Token from before restart is invalid

### Solution:
You need to login to admin panel FRESH after Railway deployed.

Old adminToken from localStorage won't work on new server instance.

---

## Issue 2: Photo/Video Upload on Wait Page

### Current Flow:
Button → router.push('/refilm')
User goes to /refilm page
Can update photo/video there
Returns... where?

### Problems:
1. /refilm might be event-restricted
2. After update, where do they go back?
3. User loses context (was on wait page)

### Better Design:
Don't navigate away. Show upload UI on wait page itself.
Or at least return to /event-wait after update.

