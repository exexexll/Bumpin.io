# Recording System - How It Actually Works

## ❌ WRONG (What I Said Before):
"Captures last 60 seconds buffer"

**This is technically impossible** - MediaRecorder can't retroactively capture what happened before it started.

---

## ✅ CORRECT (How It Really Works):

### When Recording Happens:

```
User is in chat (text or video)
  ↓
User clicks "Report & Block" button
  ↓
RECORDING STARTS NOW (not before!)
  ↓
Captures remaining chat session
  ↓
Chat ends
  ↓
Recording stops and uploads
  ↓
Linked to report for admin review
```

### What Gets Recorded:

**Video Mode:**
- Remote user's video stream (what you see)
- From moment of report click → end of session
- Duration: However long chat continues after report

**Text Mode:**
- Screen capture of chat window
- Shows all messages on screen
- From moment of report click → end of session

---

## 🔒 Privacy & Consent:

### Clear Warning System:

```
User clicks "Report & Block"
  ↓
Modal shows:
  ⚠️ "Recording for Safety"
  
  "By reporting, you consent to recording the remaining 
   chat session for moderation review. The recording will 
   only be viewed by administrators and will be deleted 
   after review."
  
  [Cancel] [Continue & Record]
  ↓
User must explicitly click "Continue & Record"
  ↓
Recording starts with visible indicator
  ↓
Red "RECORDING" badge shows in chat
```

### What User Sees:

```
┌────────────────────────────┐
│ 🔴 RECORDING - Report Filed│ ← Visible indicator
│                            │
│   [Chat continues...]      │
│                            │
└────────────────────────────┘
```

---

## 📋 Implementation:

### In Video Room:
```typescript
// When user clicks "Report"
const handleReport = async () => {
  // Show consent modal
  const confirmed = await showRecordingConsent();
  if (!confirmed) return;
  
  // Start recording (from THIS moment)
  recorder.startRecording('video', remoteVideoRef.current);
  
  // Show recording indicator
  setIsRecording(true);
  
  // Continue chat normally
  // Recording captures everything from now until end
};
```

### In Text Room:
```typescript
// When user clicks "Report"
const handleReport = async () => {
  // Show consent modal
  const confirmed = await showRecordingConsent();
  if (!confirmed) return;
  
  // Request screen capture permission
  recorder.startRecording('text'); // getDisplayMedia
  
  // Show recording indicator
  setIsRecording(true);
};
```

---

## ✅ Benefits:

1. **Privacy-First:** Only records when user explicitly reports
2. **Transparent:** Clear warning and consent
3. **Limited Duration:** Only captures post-report conversation
4. **Purpose-Limited:** Used ONLY for moderation
5. **Auto-Delete:** Removed after admin review (7 days max)

---

**Much more ethical and privacy-respecting than continuous recording!**

