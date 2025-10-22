# 🎁 Tenor GIF API Setup Guide

## What is Tenor?

Tenor is Google's official GIF platform. Free API for searching and sharing GIFs.

**Free Tier:**
- 1 million requests/month
- No credit card required
- No rate limits (within reason)
- Official Google product

---

## 📋 Setup Steps:

### Step 1: Get API Key (5 minutes)

1. **Go to:** https://developers.google.com/tenor/guides/quickstart

2. **Click:** "Get a Key" button

3. **Create Project:**
   - Project name: "Napalmsky"
   - Click "Next"

4. **Enable Tenor API:**
   - Check "Tenor GIF API"
   - Click "Enable"

5. **Get API Key:**
   - Copy the API key (looks like: `AIzaSy...`)
   - Save it somewhere safe

---

### Step 2: Add to Environment Variables

**Local Development (.env.local):**
```bash
NEXT_PUBLIC_TENOR_API_KEY=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ
```

**Railway (Backend):**
```bash
# Add in Railway dashboard > Variables
NEXT_PUBLIC_TENOR_API_KEY=your_api_key_here
```

**Vercel (Frontend):**
```bash
# Add in Vercel dashboard > Settings > Environment Variables
NEXT_PUBLIC_TENOR_API_KEY=your_api_key_here
```

---

### Step 3: Verify It Works

1. **Test API:**
   ```bash
   curl "https://tenor.googleapis.com/v2/search?q=happy&key=YOUR_API_KEY&limit=5"
   ```

2. **Expected Response:**
   ```json
   {
     "results": [
       {
         "id": "12345",
         "title": "Happy GIF",
         "media_formats": {
           "gif": { "url": "https://media.tenor.com/..." }
         }
       }
     ]
   }
   ```

3. **In App:**
   - Open text chat
   - Click GIF button
   - Search for "happy"
   - Should see GIF results ✅

---

## 🔧 Current Implementation:

**File:** `lib/gifAPI.ts`

```typescript
const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY || 'AIza...';
```

**We're using:**
- `v2/search` - Search GIFs
- `v2/featured` - Trending GIFs
- Media formats: `gif`, `tinygif` (optimized)

**Already integrated:**
✅ GIFPicker component
✅ Search functionality
✅ Categories
✅ Backend validation (only Tenor URLs allowed)

---

## ⚠️ Important Notes:

1. **API Key is Public:**
   - `NEXT_PUBLIC_` means it's exposed in frontend
   - This is normal for Tenor (designed for client-side use)
   - Tenor allows this (no security risk)

2. **Rate Limits:**
   - Free tier: 1M requests/month
   - That's ~33,000 per day
   - More than enough for your use case

3. **Fallback:**
   - Currently using a demo key
   - Works but has lower limits
   - Get your own key for production

---

## 🚀 Next Steps:

1. Get your Tenor API key (5 minutes)
2. Add to Vercel environment variables
3. Add to Railway environment variables
4. Redeploy both (auto-deploy on push)
5. Test GIF search in app ✅

---

## 📊 Usage Example:

```typescript
import { searchGIFs } from '@/lib/gifAPI';

// Search for GIFs
const gifs = await searchGIFs('happy', 20);

// Returns:
[
  {
    id: '12345',
    title: 'Happy Dance',
    url: 'https://media.tenor.com/...',
    previewUrl: 'https://media.tenor.com/.../tinygif',
    width: 498,
    height: 280
  },
  ...
]
```

---

**That's it! GIF support is already fully implemented, just needs your API key for production!**

