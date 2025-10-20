# 🔧 Quick Fix Instructions - 3 Issues

---

## Issue 1: Event Custom Text Not Changing ❌

**Problem:** You set custom text in admin but it doesn't show on wait page

**Solution:** Run this SQL in Railway PostgreSQL:

```sql
ALTER TABLE event_settings 
ADD COLUMN IF NOT EXISTS event_title TEXT,
ADD COLUMN IF NOT EXISTS event_banner_text TEXT;
```

**How:**
1. Railway → PostgreSQL service → "Data" tab → "Query"
2. Paste SQL above
3. Click "Run"
4. Done! Now custom text will work.

---

## Issue 2: SendGrid DNS Errors ❌

**Problem:** CNAME records showing errors

**Cause:** You added records to Squarespace, but your DNS is actually managed by **Vercel**!

**Solution:** Add records to Vercel DNS instead:

1. **Vercel Dashboard** → Your project → Settings → Domains
2. Click **napalmsky.com**
3. Scroll to **"DNS Records"**
4. Click **"Add Record"**

Add each CNAME:
```
Name: url7912
Value: sendgrid.net

Name: 56832113  
Value: sendgrid.net

Name: em8509
Value: u56832113.wl114.sendgrid.net

Name: s1._domainkey
Value: s1.domainkey.u56832113.wl114.sendgrid.net

Name: s2._domainkey
Value: s2.domainkey.u56832113.wl114.sendgrid.net
```

Add TXT record:
```
Name: _dmarc
Value: v=DMARC1; p=none;
```

**Wait 15 minutes, then verify in SendGrid.**

---

## Issue 3: Easier Alternative - Skip DNS!

**Don't want DNS hassle?**

### Use Single Sender Verification (5 minutes):

1. SendGrid → Settings → Sender Authentication
2. Click **"Verify a Single Sender"**  
3. Fill form:
   - From Email: `noreply@napalmsky.com`
   - From Name: `Napalm Sky`
   - Reply To: `support@napalmsky.com`
4. Submit
5. Check email
6. Click verification link
7. **Done!**

**Then in Railway:**
```bash
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@napalmsky.com
```

**This works immediately - no DNS needed!**

