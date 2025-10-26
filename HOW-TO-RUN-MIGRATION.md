# How to Run the Dual-Storage Migration

**Your DATABASE_URL**: `postgresql://postgres:...@postgres.railway.internal:5432/railway`

⚠️ **The `.railway.internal` domain is only accessible from within Railway's network.**

---

## ✅ Option 1: Via Railway CLI (RECOMMENDED)

```bash
# Install Railway CLI if you haven't:
# npm i -g @railway/cli
# railway login

# Run migration:
railway run psql $DATABASE_URL -f migrations/add-active-rooms-and-referrals.sql

# Or in one command:
railway run -- bash -c "psql \$DATABASE_URL -f migrations/add-active-rooms-and-referrals.sql"
```

---

## ✅ Option 2: Via Railway Dashboard SQL Editor

1. Go to Railway Dashboard → Your Project → PostgreSQL
2. Click "Query" tab
3. Copy entire contents of `migrations/add-active-rooms-and-referrals.sql`
4. Paste into query editor
5. Click "Run Query"

---

## ✅ Option 3: Let Railway Run It On Deploy

Add to `package.json` in server folder:

```json
"scripts": {
  "start": "node --max-old-space-size=920 dist/index.js",
  "postinstall": "psql $DATABASE_URL -f migrations/add-active-rooms-and-referrals.sql || echo 'Migration already applied or no DB'"
}
```

Railway will run migration automatically on next deploy.

---

## ✅ Option 4: Manual SQL Copy-Paste

**For Railway SQL Console**:

```sql
-- Copy from line 8 to line 122 in migrations/add-active-rooms-and-referrals.sql
-- Paste into Railway SQL console
-- Click Execute
```

---

## 🔍 How to Verify Migration Worked

After running migration, check in Railway SQL console:

```sql
-- Check if tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('active_rooms', 'referral_mappings', 'text_room_activity', 'rate_limits');

-- Should return 4 rows

-- Check active_rooms structure:
\d active_rooms

-- Check if columns were added:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'chat_history' AND column_name = 'chat_mode';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'session_data';
```

---

## 📊 Expected Output

After successful migration:
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
...
ALTER TABLE
ALTER TABLE
CREATE FUNCTION
CREATE TRIGGER
```

After server restart, you should see in logs:
```
[Recovery] Starting database recovery...
[Recovery] Found 0 active rooms in database
[Recovery] Loaded 0 referral mappings
[Recovery] ✅ Database recovery complete
```

(0 is normal on first run - will show actual numbers after calls/intros created)

---

## ⚠️ Troubleshooting

**Error: "relation already exists"**
- ✅ This is FINE - migration uses IF NOT EXISTS
- Tables already created, no action needed

**Error: "database does not exist"**
- Check DATABASE_URL is correct
- Verify Railway PostgreSQL is provisioned

**Error: "permission denied"**
- Check user has CREATE TABLE permission
- Should work with default Railway Postgres user

---

## 🎯 Recommended Approach

**Easiest**: Option 1 (Railway CLI)
- One command
- Runs in Railway's network
- Can see output immediately

**If no CLI**: Option 2 (Dashboard SQL Editor)
- Copy-paste migration file
- Run in browser
- Visual feedback

---

**After migration succeeds, active calls will survive server restarts!** 🎊

