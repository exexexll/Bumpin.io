# Email 409 Error - Deeper Diagnosis

## Current State:
- My fix added store.deleteUser() to clear cache
- This IS deployed (commit 2481224)

## Issue Persists:
User still gets 409 after deleting account and signing up again.

## getUserByEmail Logic (store.ts line 318-336):
```typescript
async getUserByEmail(email: string): Promise<User | undefined> {
  // Check memory first
  let user = Array.from(this.users.values()).find(u => u.email === email);
  
  // If not found and database available, check there
  if (!user && this.useDatabase && email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      user = this.dbRowToUser(result.rows[0]);
      this.users.set(user.userId, user); // ← PUTS IT BACK IN CACHE!
    }
  }
  return user;
}
```

## THE REAL PROBLEM:

1. User deletes account
2. DELETE FROM users (database) ✅
3. store.deleteUser() clears cache ✅
4. User tries to signup with same email
5. verification/send calls getUserByEmail()
6. Checks cache first → Not found ✅
7. Checks database → Still there? ❌ Should be deleted
8. OR: Database deleted but then... wait

## Hypothesis:
The database delete is failing silently!

Check:
- Are there foreign key constraints blocking delete?
- Does CASCADE work on all tables?
- Is the transaction rolling back?

Let me check if DELETE is actually working...
