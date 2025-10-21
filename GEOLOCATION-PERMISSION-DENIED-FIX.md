# 🔧 Geolocation Permission Denied - Troubleshooting

**Error:** Permission denied when requesting location

---

## Common Causes & Fixes:

### 1. **Browser Blocked Location (Most Common)**

**Check:** Chrome → Settings → Privacy → Site settings → Location

**Fix:**
1. Open Chrome settings
2. Search for "Location"
3. Find "napalmsky.com"
4. Change from "Block" to "Ask" or "Allow"
5. Refresh page
6. Permission modal should work now

---

### 2. **HTTPS Required**

**Geolocation API only works on:**
- ✅ https:// (secure)
- ✅ localhost (development)
- ❌ http:// (blocked by browser)

**Your site:** https://napalmsky.com ✅ (Should work)

---

### 3. **Browser Compatibility**

**Supported:**
- ✅ Chrome/Edge (desktop + mobile)
- ✅ Firefox (desktop + mobile)
- ✅ Safari (desktop + iOS)

**Check:** Open console (F12) and run:
```javascript
console.log('Geolocation supported:', !!navigator.geolocation);
```

---

### 4. **Permissions-Policy Header**

**Fixed:** Just deployed `geolocation=*` in next.config.js

**Wait 2-3 minutes** for Vercel to deploy, then hard refresh:
- Mac: Cmd+Shift+R
- Windows: Ctrl+Shift+R

---

### 5. **User Previously Blocked**

If you clicked "Block" before, browser remembers!

**Fix (Chrome):**
1. Click lock icon in address bar
2. Click "Site settings"
3. Find "Location"
4. Change to "Ask" or "Allow"
5. Refresh page

---

### 6. **Test Geolocation Manually**

Open console and run:
```javascript
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('SUCCESS:', pos.coords),
  (err) => console.log('ERROR:', err.message, err.code)
);
```

**Error Codes:**
- Code 1: PERMISSION_DENIED (user blocked or browser blocked)
- Code 2: POSITION_UNAVAILABLE (GPS/network issue)
- Code 3: TIMEOUT (took too long)

---

### 7. **Clear Site Data**

Sometimes cached permissions cause issues:

**Chrome:**
1. F12 → Application tab
2. Clear site data
3. Refresh page
4. Try permission again

---

## ✅ Most Likely Solution:

**You previously blocked location permission.**

**Fix in 30 seconds:**
1. Click lock icon in address bar
2. Site settings
3. Location → "Allow"
4. Refresh page
5. Permission modal will work!

