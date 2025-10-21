# 🔧 Railway Persistent Storage Fix - Immediate Solution

**Issue:** Uploads lost on Railway restart (ephemeral container)  
**Current:** Files stored in `/uploads` directory (deleted on restart)  
**Solution:** Use Cloudinary (ALREADY CODED - just needs env vars!)

---

## ✅ GOOD NEWS: Code Already Supports Cloudinary!

Your code in `server/src/media.ts` automatically uses Cloudinary when configured:

```typescript
const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);

if (useCloudinary) {
  // Upload to Cloudinary ✅
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'napalmsky/selfies',
  });
  selfieUrl = result.secure_url;
} else {
  // Fallback to local storage (ephemeral on Railway) ❌
  selfieUrl = `${apiBase}/uploads/${req.file.filename}`;
}
```

**Just need to add environment variables!**

---

## 🚀 IMMEDIATE FIX (5 Minutes):

### Step 1: Get Cloudinary Account (Free)

1. Go to: https://cloudinary.com/users/register/free
2. Sign up (free tier: 25GB storage, 25GB bandwidth/month)
3. After signup, go to Dashboard
4. Copy these values:
   - **Cloud Name:** (e.g., `dxxxxxxxx`)
   - **API Key:** (e.g., `123456789012345`)
   - **API Secret:** (e.g., `abc123...`)

---

### Step 2: Add to Railway Environment Variables

1. Go to: Railway Dashboard
2. Click your **server** project
3. Click **"Variables"** tab
4. Add these 3 variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

5. Click **"Save"** or they auto-save

---

### Step 3: Redeploy

Railway will auto-redeploy with new variables (~2 min).

---

### Step 4: Verify It's Working

Check Railway logs for:

```
✅ [Upload] Uploading selfie to Cloudinary...
✅ [Upload] ✅ Selfie uploaded to Cloudinary for user abc12345
✅ [Upload] 🔄 Starting background processing for user...
✅ [Upload] ✅ Cloudinary upload complete: https://res.cloudinary.com/...
```

**NOT:**
```
❌ [Upload] ⚠️  Using local storage (Cloudinary not configured)
```

---

## 🎯 WHAT WILL CHANGE:

### Before (Ephemeral):
```
User uploads selfie
  ↓
Saved to: /app/server/uploads/selfie-123.jpg
  ↓
URL: https://napalmsky-production.up.railway.app/uploads/selfie-123.jpg
  ↓
Railway restarts
  ↓
File DELETED ❌
  ↓
URL returns 404 error
```

### After (Cloudinary):
```
User uploads selfie
  ↓
Uploaded to: Cloudinary
  ↓
URL: https://res.cloudinary.com/yourcloud/image/upload/napalmsky/selfies/abc123.jpg
  ↓
Railway restarts
  ↓
File STILL EXISTS ✅ (on Cloudinary)
  ↓
URL still works!
```

---

## 📊 CURRENT DATABASE PERSISTENCE:

According to your docs, PostgreSQL is **already configured**:

| Data Type | PostgreSQL | Status |
|-----------|------------|--------|
| Users | ✅ | Persists |
| Sessions | ✅ | Persists |
| Chat History | ✅ | Persists |
| Cooldowns | ✅ | Persists |
| Invite Codes | ✅ | Persists |
| Reports | ✅ | Persists |
| Location Data | ✅ | Persists (24h TTL) |

**Only missing: Media files (selfies + videos)**

---

## 🔧 ALTERNATIVE: Railway Volumes (If No Cloudinary)

If you don't want to use Cloudinary, you can use Railway Volumes:

### Step 1: Create Volume

```bash
# In Railway Dashboard → Your Service
# Click "Settings" → "Volumes"
# Click "+ Add Volume"
# Mount path: /app/server/uploads
# Size: 1GB (should be enough)
```

### Step 2: No Code Changes Needed!

Railway will persist `/app/server/uploads` across restarts.

### Pros/Cons:

**Railway Volumes:**
- ✅ Simple (one click)
- ✅ No external service
- ❌ Not redundant (single point of failure)
- ❌ Slower global access
- ❌ Limited to single region

**Cloudinary:**
- ✅ Global CDN (faster for users)
- ✅ Automatic optimization
- ✅ Redundant (multiple backups)
- ✅ Image transformations (resize, crop, etc.)
- ❌ External service dependency
- ✅ Free tier generous (25GB)

---

## ⚡ RECOMMENDED: Use Cloudinary

**Why:**
1. Code already supports it (no changes needed)
2. Better performance (CDN vs single server)
3. Automatic image optimization
4. Free tier is generous
5. No single point of failure

**Setup time:** 5 minutes

**Cost:** Free for your usage (25GB storage, 25GB bandwidth/month)

---

## 🎯 QUICK START:

```bash
# 1. Sign up: https://cloudinary.com/users/register/free

# 2. Get credentials from Dashboard

# 3. Add to Railway:
CLOUDINARY_CLOUD_NAME=dxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123xyz456...

# 4. Railway auto-redeploys (~2 min)

# 5. Test upload
# Should see: "Selfie uploaded to Cloudinary" ✅

# 6. Restart Railway
# Uploads still work! ✅
```

---

## 📋 VERIFICATION CHECKLIST:

After adding Cloudinary variables:

- [ ] Railway logs show: "Uploading selfie to Cloudinary"
- [ ] Upload URL starts with: `https://res.cloudinary.com/`
- [ ] Images load correctly in app
- [ ] Restart Railway (Deployments → Redeploy)
- [ ] Images still load after restart ✅
- [ ] New uploads go to Cloudinary
- [ ] No "Using local storage" warnings

---

**Bottom Line:** Add 3 environment variables to Railway → Problem solved permanently! 🚀

Your code already handles everything - it's just waiting for the config.

