# Instagram Post Embeds in Matchmaking Reel - Implementation Plan

**Feature**: Embed Instagram posts in matchmaking swipe interface  
**Status**: PLANNING → IMPLEMENTATION  
**Feasibility**: ✅ Possible using Instagram's official embed

---

## 🎯 FEATURE REQUIREMENTS

### User Experience:
```
Matchmaking Reel:
- Intro video (first, always)
- Instagram post 1 (swipe right)
- Instagram post 2 (swipe right)
- Instagram post 3 (swipe right)
- ... (up to 5-10 posts)

Navigation:
- Swipe right from intro → First post
- Swipe left from intro → Last post
- Swipe right from post → Next post
- Swipe left from post → Previous post
- Seamless transitions
```

---

## 🏗️ IMPLEMENTATION STEPS

### 1. Database Schema (Add post URLs to users)
```sql
-- Add to users table
ALTER TABLE users 
ADD COLUMN instagram_posts TEXT[]; -- Array of Instagram post URLs
```

### 2. Storage Format
```typescript
interface User {
  ...
  instagramPosts?: string[]; // ["https://instagram.com/p/ABC123/", ...]
}
```

### 3. UI for Adding Posts (in /refilm or /settings)
```typescript
<InstagramPostManager>
  <input placeholder="Paste Instagram post URL" />
  <button>Add Post</button>
  
  <PostList>
    {posts.map((url, i) => (
      <PostItem>
        {i + 1}. {url}
        <button>Remove</button>
        <button>Move Up</button>
        <button>Move Down</button>
      </PostItem>
    ))}
  </PostList>
  
  <p>Max 10 posts • Shown in order</p>
</InstagramPostManager>
```

### 4. Matchmaking Integration (UserCard carousel)
```typescript
interface MediaItem {
  type: 'video' | 'instagram';
  url: string;
  index: number;
}

const mediaItems: MediaItem[] = [
  { type: 'video', url: user.videoUrl, index: 0 }, // Always first
  ...user.instagramPosts.map((url, i) => ({
    type: 'instagram',
    url,
    index: i + 1
  }))
];

// Current index tracks position in mediaItems array
// Swipe left/right changes index
```

### 5. Instagram Embed Component
```typescript
<InstagramEmbed postUrl={url}>
  <Script src="//www.instagram.com/embed.js" />
  <blockquote className="instagram-media">
    ...
  </blockquote>
</InstagramEmbed>
```

---

## 📋 FILES TO CREATE/MODIFY

### New Files:
1. `components/InstagramEmbed.tsx` - Official embed wrapper
2. `components/InstagramPostManager.tsx` - Post URL management UI
3. `migrations/add-instagram-posts.sql` - Database migration

### Modify:
1. `server/src/types.ts` - Add instagramPosts field
2. `server/src/store.ts` - Handle post arrays
3. `server/src/user.ts` - CRUD for posts
4. `server/src/room.ts` - Include posts in queue
5. `app/refilm/page.tsx` - Add post manager
6. `components/matchmake/UserCard.tsx` - Carousel for video + posts
7. `lib/matchmaking.ts` - Type updates

---

## ⏱️ ESTIMATED EFFORT

**Total Time**: 6-8 hours  
**Complexity**: High (carousel logic, Instagram API)  
**Lines of Code**: ~400 lines  
**Files**: 10 files  

---

## ✅ WHAT'S FEASIBLE

**Instagram Official Embed**: ✅ YES
- Approved by Instagram
- Legal and safe
- Requires POST URL (not username)
- Works in iframe
- Users paste their post URLs

**TikTok Embed**: ✅ YES
- TikTok has official embed
- Similar to Instagram
- Requires video URL
- `<script src="tiktok.com/embed.js">`

**Twitter/X Embed**: ✅ YES
- Twitter has official embed
- Requires tweet URL
- `<script src="platform.twitter.com/widgets.js">`

**Snapchat**: ❌ NO
- No official embed API
- Stories are ephemeral
- No persistent post URLs

---

## 🎯 SIMPLIFIED SCOPE (RECOMMENDED)

**Phase 1**: Instagram Only (Most Popular)
- Users add Instagram post URLs
- Max 5 posts
- Swipe carousel: Video → Posts
- Official Instagram embed

**Phase 2** (Later): Add TikTok, Twitter
- Same carousel approach
- Different embed scripts

**Phase 3** (Optional): Snapchat fallback
- Just show Snapchat profile link
- No embed (not supported)

---

## ⚠️ CRITICAL LIMITATIONS

**You CANNOT**:
- ❌ Auto-fetch user's most recent posts (needs API OAuth)
- ❌ Show posts without user providing URLs
- ❌ Pull from username alone (need post IDs)

**Users MUST**:
- ✅ Manually paste Instagram post URLs
- ✅ https://www.instagram.com/p/POST_ID/
- ✅ Add posts one by one
- ✅ Manage their own post list

**This is a limitation of Instagram's API, not our code**

---

## 🎯 RECOMMENDATION

**Implement Instagram Post Embeds?**

**Pros**:
- ✅ Users can showcase their posts
- ✅ More engaging profiles
- ✅ Legal (official embed)
- ✅ Better than just video

**Cons**:
- ⚠️ Users must manually add post URLs
- ⚠️ 6-8 hours implementation
- ⚠️ Complex carousel logic
- ⚠️ Another thing users need to manage

**My Recommendation**: 
This is a great feature but requires significant time. 

**Should I proceed with implementation now, or save it for next session?**

Current platform is already production-ready with 91 commits. This would be a major v2.0 feature.

