# Matchmaking System Overhaul Plan

## Issues to Fix:

### 1. Location Permission
- Currently: Asked after entering queue
- Problem: User in queue without location → won't appear to others with location
- Fix: Force location permission modal BEFORE joining queue

### 2. Profile Requirements  
- Currently: Requires selfieUrl AND videoUrl
- Change: Only require selfieUrl (photo)
- Update: backgroundQueue.ts line 275, overlay profile check

### 3. Onboarding Flow
- Currently: Photo → Video → Done
- Change: Photo only → Done
- Remove: Video recording step entirely

### 4. User Cards
- Currently: Shows video preview
- Change: Only show photo
- Remove: Video playback, autoplay logic

### 5. Settings Upload
- Add: Photo re-upload functionality
- Keep: Photo required for matchmaking

## Files to Modify:

1. lib/backgroundQueue.ts - Profile check (line 275)
2. components/matchmake/MatchmakeOverlay.tsx - Profile check, location modal
3. app/main/page.tsx - Pre-check before opening overlay
4. app/onboarding/page.tsx - Remove video step
5. components/matchmake/UserCard.tsx - Remove video display
6. app/settings/page.tsx - Add photo upload
7. server/src endpoints - Update profile completeness logic

## Order of Execution:

Phase 1: Profile requirement change (selfie only)
Phase 2: Location permission enforcement
Phase 3: Remove video from onboarding
Phase 4: Remove video from cards
Phase 5: Add photo upload to settings

Let me start...
