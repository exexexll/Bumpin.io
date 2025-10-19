# 🚨 URGENT: Run Database Migration on Railway

**Error You're Seeing:**
```
column "event_title" of relation "event_settings" does not exist
```

**Why:** The code was deployed but the database schema wasn't updated!

---

## 🚀 Quick Fix (2 Methods)

### Method 1: Railway Dashboard (EASIEST - 2 minutes)

1. **Go to Railway Dashboard:**
   - https://railway.app/dashboard
   - Click on your Napalmsky project
   - Click on the **PostgreSQL** service (the database icon)

2. **Open Query Tool:**
   - Click the **"Data"** tab (or "Query" depending on UI)
   - You should see a SQL query input box

3. **Copy and Paste This:**
   ```sql
   ALTER TABLE event_settings 
   ADD COLUMN IF NOT EXISTS event_title TEXT DEFAULT 'Event Mode Active';

   ALTER TABLE event_settings 
   ADD COLUMN IF NOT EXISTS event_banner_text TEXT DEFAULT 'Event Mode';

   UPDATE event_settings 
   SET 
     event_title = COALESCE(event_title, 'Event Mode Active'),
     event_banner_text = COALESCE(event_banner_text, 'Event Mode')
   WHERE id = 1;

   SELECT id, event_title, event_banner_text FROM event_settings;
   ```

4. **Click "Run" or "Execute"**

5. **Should see:**
   ```
   id | event_title         | event_banner_text
   ---|---------------------|------------------
   1  | Event Mode Active   | Event Mode
   ```

6. **Done!** ✅

---

### Method 2: psql Command Line (ADVANCED - 5 minutes)

**Step 1: Get Database URL**
```bash
# In Railway dashboard:
1. Click PostgreSQL service
2. Click "Variables" tab
3. Find DATABASE_URL
4. Copy the full URL (looks like):
   postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway
```

**Step 2: Connect**
```bash
# Open terminal and run:
psql "postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway"

# Or if you have the variable:
psql $DATABASE_URL
```

**Step 3: Run Migration**
```sql
-- Paste this:
ALTER TABLE event_settings 
ADD COLUMN IF NOT EXISTS event_title TEXT DEFAULT 'Event Mode Active';

ALTER TABLE event_settings 
ADD COLUMN IF NOT EXISTS event_banner_text TEXT DEFAULT 'Event Mode';

UPDATE event_settings 
SET 
  event_title = COALESCE(event_title, 'Event Mode Active'),
  event_banner_text = COALESCE(event_banner_text, 'Event Mode')
WHERE id = 1;

-- Verify
SELECT * FROM event_settings;

-- Exit
\q
```

---

## ✅ How to Verify It Worked

After running the migration:

1. **Go back to admin panel**
2. **Refresh the page** (Cmd+R or Ctrl+R)
3. **Click "Event Settings" tab**
4. **Scroll to "Custom Event Text" section**
5. **You should see two input fields:**
   - Event Wait Page Title
   - Banner Notification Text

6. **Try saving again:**
   - Event Title: "HALLOWEEN IS GOIN TO BE LIT!"
   - Banner Text: "🎃 Halloween Night"
   - Click "Save Event Settings"

7. **Should work now!** ✅

---

## 🐛 If Migration Fails

### Error: "relation event_settings does not exist"

**Cause:** event_settings table doesn't exist at all

**Fix:** Run the full event mode schema first
```sql
CREATE TABLE IF NOT EXISTS event_settings (
  id SERIAL PRIMARY KEY,
  event_mode_enabled BOOLEAN DEFAULT FALSE,
  event_start_time TIME DEFAULT '15:00:00',
  event_end_time TIME DEFAULT '18:00:00',
  timezone TEXT DEFAULT 'America/Los_Angeles',
  event_days JSONB DEFAULT '[]',
  event_title TEXT DEFAULT 'Event Mode Active',
  event_banner_text TEXT DEFAULT 'Event Mode',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default row
INSERT INTO event_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
```

### Error: "permission denied"

**Cause:** User doesn't have ALTER TABLE permission

**Fix:** Use the postgres superuser (Railway default is postgres)

---

## 📋 Quick Checklist

- [ ] Railway dashboard open
- [ ] PostgreSQL service selected
- [ ] Query tab open
- [ ] Migration SQL pasted
- [ ] Query executed successfully
- [ ] Verification query shows new columns
- [ ] Admin panel refreshed
- [ ] Custom text fields visible
- [ ] Save works without errors

---

## 🎉 After Migration Success

You'll be able to:

✅ Set custom event titles like "HALLOWEEN IS GOIN TO BE LIT!"  
✅ Set custom banner text like "🎃 Spooky Night"  
✅ Changes appear instantly for all users  
✅ Text persists across restarts  
✅ Can change for each event  

---

**Total Time:** 2 minutes  
**Difficulty:** Easy (copy/paste SQL)  
**Impact:** Unlocks custom event branding! 🎨

