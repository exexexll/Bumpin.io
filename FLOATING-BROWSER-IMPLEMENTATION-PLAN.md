# Floating In-App Browser - Comprehensive Implementation Plan

**Feature**: Instagram-style in-app browser for links  
**Date**: October 27, 2025  
**Status**: PLANNING PHASE

---

## 📋 REQUIREMENTS

### User Story:
"When users click a link (e.g., shared social media), open it in a floating browser overlay instead of leaving the app"

### Inspired By:
- Instagram in-app browser
- Twitter/X link previews
- LinkedIn article viewer
- Discord embedded browser

---

## 🎯 CORE FUNCTIONALITY

### Features Needed:
1. ✅ **Floating Modal** - Overlay on current page
2. ✅ **iframe** - Load external content
3. ✅ **URL Bar** - Show current URL
4. ✅ **Navigation** - Back, forward, refresh
5. ✅ **Close Button** - Return to app
6. ✅ **Loading State** - Show while page loads
7. ✅ **Error Handling** - Handle blocked sites
8. ✅ **Mobile & Desktop** - Responsive design
9. ✅ **Security** - Sandbox iframe properly

---

## 🏗️ ARCHITECTURE

### Component Structure:
```
<FloatingBrowser>
  <BrowserHeader>
    <BackButton />
    <ForwardButton />
    <URLBar url={currentUrl} />
    <RefreshButton />
    <CloseButton />
  </BrowserHeader>
  
  <BrowserContent>
    <LoadingOverlay show={loading} />
    <iframe 
      src={url}
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      onLoad={handleLoad}
      onError={handleError}
    />
  </BrowserContent>
</FloatingBrowser>
```

### State Management:
```typescript
interface BrowserState {
  isOpen: boolean;
  url: string;
  title: string;
  loading: boolean;
  error: string | null;
  history: string[];
  currentIndex: number;
}
```

---

## 💻 TECHNICAL IMPLEMENTATION

### 1. Floating Browser Component (`components/FloatingBrowser.tsx`)

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingBrowserProps {
  isOpen: boolean;
  url: string;
  onClose: () => void;
}

export function FloatingBrowser({ isOpen, url, onClose }: FloatingBrowserProps) {
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setError('Failed to load page');
    setLoading(false);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="absolute inset-x-4 bottom-4 top-20 md:inset-x-20 md:top-24 md:bottom-20 bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Browser Header */}
            <div className="bg-[#f5f5f5] border-b border-gray-300 p-3 flex items-center gap-2">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* URL Bar */}
              <div className="flex-1 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-700 truncate border border-gray-300">
                {currentUrl}
              </div>
            </div>

            {/* Browser Content */}
            <div className="relative h-[calc(100%-60px)]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#ffc46a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="text-center">
                    <p className="text-red-500 mb-2">{error}</p>
                    <button onClick={handleRefresh} className="text-[#ffc46a] hover:underline">
                      Try again
                    </button>
                  </div>
                </div>
              )}

              <iframe
                ref={iframeRef}
                src={currentUrl}
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                onLoad={handleLoad}
                onError={handleError}
                title="In-app browser"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 2. Link Interceptor Hook (`lib/useLinkInterceptor.ts`)

```typescript
import { useEffect } from 'react';

export function useLinkInterceptor(onLinkClick: (url: string) => void) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const url = new URL(link.href);
        
        // Only intercept external links
        if (url.origin !== window.location.origin) {
          e.preventDefault();
          onLinkClick(link.href);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onLinkClick]);
}
```

### 3. Integration in Chat/Messages

```typescript
// In text-room or wherever links appear
const [browserUrl, setBrowserUrl] = useState('');
const [browserOpen, setBrowserOpen] = useState(false);

useLinkInterceptor((url) => {
  setBrowserUrl(url);
  setBrowserOpen(true);
});

return (
  <>
    {/* Chat content */}
    
    <FloatingBrowser
      isOpen={browserOpen}
      url={browserUrl}
      onClose={() => setBrowserOpen(false)}
    />
  </>
);
```

---

## 🔒 SECURITY CONSIDERATIONS

### iframe Sandbox Attributes:
```html
sandbox="
  allow-same-origin  // Allows cookies, localStorage
  allow-scripts      // Allows JavaScript
  allow-popups       // Allows popups (for login flows)
  allow-forms        // Allows form submission
"
```

**What to BLOCK**:
- ❌ `allow-top-navigation` - Prevents iframe from navigating parent
- ❌ `allow-modals` - Prevents alert/confirm spam
- ❌ No download permission

### CSP Updates Needed:
```javascript
// next.config.js
"frame-src 'self' https://* http://*" // Allow any HTTPS iframe
```

---

## 🎨 DESIGN SPECIFICATIONS

### Desktop:
- **Size**: 80% width, 80% height
- **Position**: Centered overlay
- **Header**: 60px height, gray background
- **Rounded**: 2xl (16px) corners
- **Shadow**: Heavy for depth

### Mobile:
- **Size**: Full screen minus 80px top/bottom
- **Position**: Bottom sheet style
- **Header**: 56px height
- **Slide Up**: Spring animation
- **Safe Area**: iOS notch/home indicator

---

## 📊 IMPLEMENTATION PHASES

### Phase 1: Core Browser (4-6 hours)
- [ ] Create FloatingBrowser component
- [ ] Add iframe with sandbox
- [ ] Header with URL bar
- [ ] Close/refresh buttons
- [ ] Loading state
- [ ] Error handling

### Phase 2: Link Interception (2 hours)
- [ ] Create useLinkInterceptor hook
- [ ] Detect external links
- [ ] Prevent default navigation
- [ ] Open in floating browser

### Phase 3: Social Handles Integration (3 hours)
- [ ] Fetch user's social handles
- [ ] Display in matchmaking card
- [ ] Make links clickable
- [ ] Open in floating browser

### Phase 4: Polish (2 hours)
- [ ] Navigation history (back/forward)
- [ ] Smooth animations
- [ ] Mobile gestures (swipe to close)
- [ ] Desktop resize handle

---

## 🎯 SOCIAL HANDLES DISPLAY PLAN

### Current System:
**Storage**: `localStorage.getItem('bumpin_user_socials')`  
**Format**: `{ instagram: 'username', snapchat: 'username', ... }`

### Where to Display:
**Option A**: Matchmaking Card (UserCard.tsx)
- Add social icons below name
- Show Instagram, Snapchat, TikTok
- Click → Open in floating browser

**Option B**: User Profile Modal
- "View Profile" button
- Shows all socials
- Click any → Open in browser

**Option C**: Both
- Preview icons in card
- Full list in profile modal

### Recommended: Option C

---

## ⚠️ CHALLENGES & SOLUTIONS

### Challenge 1: iframe X-Frame-Options
**Problem**: Many sites block iframe embedding  
**Solution**: Show error message, offer "Open in New Tab"

### Challenge 2: Login Flows
**Problem**: OAuth redirects break in iframe  
**Solution**: Detect redirect, offer external open

### Challenge 3: Mobile Performance
**Problem**: Heavy sites slow in iframe  
**Solution**: Show loading state, timeout after 10s

### Challenge 4: Cookie Sharing
**Problem**: Third-party cookie restrictions  
**Solution**: Use `allow-same-origin` sandbox attribute

---

## 📝 FILES TO CREATE/MODIFY

### New Files:
1. `components/FloatingBrowser.tsx` (200 lines)
2. `lib/useLinkInterceptor.ts` (50 lines)
3. `components/SocialHandlesDisplay.tsx` (150 lines)

### Modify:
1. `app/text-room/[roomId]/page.tsx` - Add browser
2. `app/room/[roomId]/page.tsx` - Add browser
3. `components/matchmake/UserCard.tsx` - Add social icons
4. `next.config.js` - Update CSP for iframe
5. `app/faq/page.tsx` - Remove paywall check

---

## 💰 ESTIMATED EFFORT

**Total Time**: 11-13 hours  
**Complexity**: High  
**Lines of Code**: ~500 lines  
**Files Changed**: 8 files  

---

## ✅ IMMEDIATE FIXES (Before Browser Feature)

1. **FAQ Paywall Issue** - Likely Header.tsx has guard
2. **Email Change** - everything@bumpin.com → everything@napalmsky.com
3. **Chat Button** - Already fixed (z-200)
4. **Video Preview** - Already fixed (80% overlay)

Should I:
A) Fix immediate issues first (email, FAQ) - 30 minutes
B) Implement full floating browser - 11-13 hours
C) Just social handles display - 3 hours

**Recommendation**: Fix immediate issues (A), then tackle browser feature in next session when you're ready for a major feature addition.

