# Current Text Mode Status - What's Actually In The Code

## ✅ WHAT EXISTS NOW (Verified by reading code)

### Header (lines 400-464):
```
Desktop: [Name] [Active Status] [Video Upgrade Button]
Mobile:  [X Close] [Name] [Active Status]
```

- **Active status**: ✅ EXISTS on both mobile and desktop (lines 437-452)
- **Video upgrade button**: ✅ EXISTS but `hidden sm:flex` (desktop only) (line 444)
- **End call button**: ✅ EXISTS with `sm:hidden` (mobile only) (line 429)

### Typing Indicator (lines 475-514):
✅ EXISTS - Shows in message area with:
- Partner profile pic
- Animated dots in bubble
- Positioned where message will appear

### Social Button (lines 541-578):
✅ EXISTS - In action row above message input with:
- Share icon
- Prompt for entering socials
- Emits `room:giveSocial`

### Video Upgrade Timer (lines 281-308):
✅ EXISTS - useEffect with:
- Empty deps array
- Counts to 60s
- Sets showVideoRequest=true
- Console logs for debugging

### Inactivity End at 0 (lines 310-318):
✅ EXISTS - useEffect that:
- Checks if countdown <= 0
- Ends session immediately
- Redirects to /history

---

## 🎯 ACTUAL CURRENT BEHAVIOR

### Mobile Layout:
- Header: [X] [Name] [Active Status]
- Video button: NOT visible (sm:flex means desktop-only)
- Bottom: [Social] [File] [GIF] [Message Input]

### Desktop Layout:
- Header: [Name] [Active Status] [Video Upgrade]
- Bottom: [Social] [File] [GIF] [Message Input]

---

## ⚠️ POSSIBLE ISSUES

### Issue 1: Video Button Not Visible on Mobile
**Code**: `className="hidden sm:flex ..."`
**Result**: Hidden on mobile, shown on desktop-only
**User wants**: Visible on mobile but not cramped

### Issue 2: Typing Indicator Maybe Not Working
**Code exists**: Lines 475-514
**Possible problem**: 
- Socket event not received?
- partnerTyping state not updating?
- AnimatePresence not rendering?

### Issue 3: Social Button Maybe Not Visible
**Code exists**: Lines 541-578
**Possible problem**:
- In action row, might need better visibility
- Icon too small?
- Label not clear?

---

## 🔧 WHAT NEEDS FIXING (Based on User Feedback)

1. **Show video button on mobile** - but position it differently (not cramped in header)
2. **Verify typing indicator works** - test socket events
3. **Make social button more visible** - currently just small icon
4. **Prevent page jump** - input area should stay fixed
5. **Verify torch pipeline still works** - test inactivity system

---

## ✅ WHAT'S CONFIRMED WORKING

- Active status visible on both layouts ✅
- Video timer counts to 60s ✅
- Countdown ends session at 0 ✅
- Social button exists ✅
- Typing indicator code exists ✅
- Klipy API domain fixed to api.klipy.com ✅

---

**Next**: Make MINIMAL targeted fixes without breaking existing features.

