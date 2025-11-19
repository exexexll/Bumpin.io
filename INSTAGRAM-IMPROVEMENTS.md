# Instagram Carousel Improvements

## Current System:
- InstagramEmbed.tsx - Displays single post in iframe
- SocialPostManager.tsx - Manages post URLs
- UserCard.tsx - Shows posts with "More Posts" button
- Preloading for instant navigation

## Potential Improvements:

### 1. Loading Performance
- Add skeleton loader while iframe loads
- Better error state when post fails to load
- Lazy load posts (only load when viewed)

### 2. Navigation UX
- Swipe indicators (dots showing which post)
- Auto-advance option?
- Keyboard shortcuts improvement

### 3. Mobile Optimization
- Better iframe scaling on small screens
- Touch-friendly navigation
- Reduce iframe overhead

### 4. Error Handling
- Detect broken/deleted Instagram posts
- Show placeholder for failed embeds
- Cache validation status

### 5. Visual Polish
- Smooth transitions between posts
- Loading animations
- Better "More Posts" button visibility

Given token limit (746K/1M), recommend:
- Quick wins: Loading states, swipe indicators
- Defer: Complex optimizations for next session

Implementing quick improvements...
