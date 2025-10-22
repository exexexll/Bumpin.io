# 📱 Text + Video Chat Mode System - Complete Specification

**Feature:** Dual-mode matchmaking (Text-only OR Video chat)  
**Complexity:** High - Multi-week implementation  
**Status:** Specification Phase

---

## 🎯 OVERVIEW:

### Two Chat Modes:

**Text-Only Mode:**
- Text messages (1.5s cooldown between sends)
- File sharing (images, documents)
- GIF support (via free API)
- Instagram DM-style UI
- 500 second time limit
- After 60s: Either user can request video upgrade
- Recording enabled if user reports

**Video Mode:**
- Current WebRTC video chat
- Live video + audio
- In-call text chat (existing feature)
- 500 second time limit (negotiable)
- Recording enabled if user reports

---

## 🏗️ ARCHITECTURE DESIGN:

### A. Database Schema Changes

```sql
-- Add chat_mode to sessions table
ALTER TABLE sessions ADD COLUMN chat_mode VARCHAR(10) DEFAULT 'video';
-- Values: 'text', 'video'

-- Chat messages table (for text mode)
CREATE TABLE chat_messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  sender_user_id UUID NOT NULL,
  message_type VARCHAR(20) NOT NULL, -- 'text', 'image', 'file', 'gif'
  content TEXT, -- Message text or URL
  file_url TEXT, -- For images/files
  gif_url TEXT, -- For GIFs
  sent_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (sender_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Index for fast retrieval
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id, sent_at);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

-- Video recordings table (for reports)
CREATE TABLE chat_recordings (
  recording_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  recording_url TEXT NOT NULL, -- Cloudinary video URL
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NOT NULL,
  duration_seconds INT NOT NULL,
  chat_mode VARCHAR(10) NOT NULL, -- 'text' or 'video'
  retained_for_report BOOLEAN DEFAULT FALSE,
  report_id UUID, -- Links to reports table
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'), -- Auto-delete after 7 days
  
  FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE SET NULL
);

-- Auto-cleanup for recordings
CREATE OR REPLACE FUNCTION delete_expired_recordings()
RETURNS void AS $$
BEGIN
  -- Only delete recordings NOT linked to active reports
  DELETE FROM chat_recordings 
  WHERE expires_at < NOW() 
  AND (retained_for_report = FALSE OR report_id IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Run cleanup daily
SELECT cron.schedule('delete-expired-recordings', '0 2 * * *', 
  'SELECT delete_expired_recordings();'
);
```

---

## 📊 WORKFLOW DIAGRAMS:

### 1. Mode Selection Flow

```
User opens matchmaking
  ↓
Toggle switch in header: [Video 📹] [Text 💬]
  ↓
User selects "Text Mode"
  ↓
Sends invite with mode: 'text'
  ↓
Recipient sees: "User A wants to TEXT chat for 300s"
  ↓
Accepts → Text chat room opens
  OR
Declines → 24h cooldown
```

### 2. Text Mode Flow

```
Text chat starts (500s timer)
  ↓
Instagram DM-style UI:
  - Left: Messages (scrollable)
  - Bottom: Input bar + Send + File + GIF buttons
  - Top: Timer countdown + "Request Video" button (appears after 60s)
  ↓
User sends message
  ↓
Check: Last message < 1.5s ago?
  YES → Show error "Please wait Xs to send next message"
  NO → Send message via Socket.IO
  ↓
Other user receives → Displays in chat
  ↓
Either user clicks "Request Video" (after 60s)
  ↓
Modal: "User A wants to switch to video. Accept?"
  ↓
Both accept → Upgrade to video mode
  OR
One declines → Stay in text mode
  ↓
Timer reaches 0 → Chat ends
  ↓
Show ending screen (same as video chat)
```

### 3. Video Upgrade Flow

```
Text chat active (>60s elapsed)
  ↓
User A clicks "Request Video Call"
  ↓
User B sees modal: "Upgrade to video?"
  ↓
User B accepts:
  - Initialize WebRTC
  - Request camera/mic permissions
  - Establish peer connection
  - Seamless transition (timer continues)
  ↓
User B declines:
  - Stay in text mode
  - Show message: "Video request declined"
  - Continue text chat
```

### 4. Report + Recording Flow

```
During chat (text or video):
  ↓
IF VIDEO MODE: Already recording (WebRTC stream)
IF TEXT MODE: No recording by default
  ↓
User clicks "Report & Block"
  ↓
IF VIDEO MODE:
  - Save last 60s of video stream
  - Upload to Cloudinary
  - Link to report
  ↓
IF TEXT MODE:
  - Export all chat messages
  - Save to report
  - No video (text evidence only)
  ↓
Admin reviews:
  - Reads chat history OR watches video
  - Decides: Ban OR Vindicate
  - If vindicate: Delete recording
  - If ban: Keep recording for 30 days, then delete
```

---

## 🔧 TECHNICAL IMPLEMENTATION:

### Phase 1: Backend Socket Events (1 week)

**New Socket Events:**
```typescript
// server/src/index.ts

socket.on('chat:send-message', async ({ roomId, messageType, content, fileUrl, gifUrl }) => {
  // Validate rate limit (1.5s between messages)
  const userId = currentUserId;
  const now = Date.now();
  const lastMessageTime = userLastMessage.get(userId) || 0;
  
  if (now - lastMessageTime < 1500) {
    return socket.emit('chat:rate-limited', {
      retryAfter: Math.ceil((1500 - (now - lastMessageTime)) / 1000)
    });
  }
  
  userLastMessage.set(userId, now);
  
  // Save to database
  const message = {
    messageId: uuidv4(),
    roomId,
    senderUserId: userId,
    messageType,
    content,
    fileUrl,
    gifUrl,
    sentAt: Date.now(),
  };
  
  await store.saveChatMessage(message);
  
  // Broadcast to room
  io.to(roomId).emit('chat:new-message', message);
});

socket.on('chat:request-video', async ({ roomId }) => {
  // Emit to other user
  socket.to(roomId).emit('chat:video-requested', {
    fromUserId: currentUserId,
  });
});

socket.on('chat:accept-video', async ({ roomId }) => {
  // Both users agreed - upgrade to video mode
  io.to(roomId).emit('chat:upgrade-to-video');
});
```

### Phase 2: Frontend UI Components (2 weeks)

**New Components:**

```
components/chat/
  - TextChatRoom.tsx (main container)
  - MessageList.tsx (Instagram-style scrollable list)
  - MessageBubble.tsx (individual message)
  - ChatInput.tsx (input bar with file/GIF buttons)
  - VideoUpgradeModal.tsx (request to switch to video)
  - ModeToggle.tsx (switch between text/video on invite)
```

**Instagram DM Layout:**
```tsx
// components/chat/TextChatRoom.tsx

<div className="flex h-screen flex-col">
  {/* Header */}
  <div className="flex items-center justify-between p-4 border-b">
    <div className="flex items-center gap-3">
      <Image src={partnerSelfie} className="w-10 h-10 rounded-full" />
      <div>
        <p className="font-medium">{partnerName}</p>
        <p className="text-xs text-gray-500">Active now</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="font-mono">{formatTime(timeLeft)}</span>
      {timeLeft <= 440 && ( // Show after 60s
        <button onClick={requestVideo}>📹 Request Video</button>
      )}
    </div>
  </div>

  {/* Messages */}
  <div className="flex-1 overflow-y-auto p-4">
    <MessageList messages={messages} currentUserId={userId} />
  </div>

  {/* Input Bar */}
  <div className="border-t p-4">
    <ChatInput 
      onSendMessage={handleSendMessage}
      onSendFile={handleFileUpload}
      onSendGIF={handleGIFSelect}
      disabled={rateLimited}
      cooldownRemaining={cooldownTime}
    />
  </div>
</div>
```

### Phase 3: GIF Integration (1 day)

**Free GIF API:** Tenor API (Google)
- Free tier: 1M requests/month
- No credit card required
- Rate limit: 50 requests/second

```typescript
// lib/gifAPI.ts

const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY;
const TENOR_CLIENT_KEY = 'napalmsky';

export async function searchGIFs(query: string, limit: number = 20) {
  const response = await fetch(
    `https://tenor.googleapis.com/v2/search?q=${query}&key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&limit=${limit}`
  );
  
  if (!response.ok) throw new Error('GIF search failed');
  
  const data = await response.json();
  return data.results.map((gif: any) => ({
    id: gif.id,
    url: gif.media_formats.tinygif.url, // Small size for preview
    previewUrl: gif.media_formats.nanogif.url,
  }));
}
```

### Phase 4: Recording System (1 week)

**MediaRecorder Integration:**
```typescript
// lib/chatRecorder.ts

class ChatRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  async startRecording(roomId: string) {
    // For video mode: Capture video stream
    if (videoMode) {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } else {
      // For text mode: Capture screen + audio
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    }
    
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
    });
    
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    
    this.mediaRecorder.start(1000); // 1s chunks
  }
  
  async stopAndSave() {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        
        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', 'chat_recordings');
        
        const response = await fetch(
          'https://api.cloudinary.com/v1_1/YOUR_CLOUD/video/upload',
          { method: 'POST', body: formData }
        );
        
        const data = await response.json();
        resolve(data.secure_url);
      };
      
      this.mediaRecorder.stop();
      this.stream?.getTracks().forEach(t => t.stop());
    });
  }
}
```

---

## 🔄 EXISTING CODE REUSE:

### Can Reuse:
✅ `server/src/room.ts` - Room management logic  
✅ `app/room/[roomId]/page.tsx` - Timer, ending screen  
✅ `components/matchmake/UserCard.tsx` - Invite system  
✅ Socket.IO infrastructure - Already set up  
✅ Report system - Just add recording evidence  
✅ History system - Extend to include text messages  

### Need New:
❌ Text message UI components  
❌ File upload handler  
❌ GIF search/picker  
❌ Message rate limiting  
❌ Video upgrade modal  
❌ Recording system  
❌ Mode toggle UI  

---

## 📋 IMPLEMENTATION PHASES:

### **Phase 1: Foundation (Week 1)**
- [ ] Database schema updates
- [ ] Socket events for text messages
- [ ] Message rate limiting (1.5s)
- [ ] Basic text message storage

### **Phase 2: Text UI (Week 2)**
- [ ] TextChatRoom component
- [ ] MessageList component (Instagram DM layout)
- [ ] ChatInput with cooldown indicator
- [ ] File upload integration
- [ ] GIF API integration (Tenor)

### **Phase 3: Mode Toggle (Week 3)**
- [ ] Mode selector in MatchmakeOverlay
- [ ] Pass mode with invite
- [ ] CalleeNotification shows mode
- [ ] Route to correct room type

### **Phase 4: Video Upgrade (Week 4)**
- [ ] "Request Video" button (appears after 60s)
- [ ] Upgrade request modal
- [ ] WebRTC initialization on acceptance
- [ ] Seamless transition logic

### **Phase 5: Recording System (Week 5)**
- [ ] MediaRecorder implementation
- [ ] Auto-record on report trigger
- [ ] Cloudinary upload for recordings
- [ ] Link recordings to reports
- [ ] Admin review UI

### **Phase 6: Testing & Polish (Week 6)**
- [ ] End-to-end testing
- [ ] UI polish
- [ ] Performance optimization
- [ ] Security audit

---

## 🎨 UI LAYOUT (Instagram DM Style):

```
┌─────────────────────────────────────┐
│ [Photo] Partner Name      ⏱️ 4:23   │ ← Header
│ Active now              📹 Video?  │
├─────────────────────────────────────┤
│                                     │
│          Hey! How are you?          │ ← Their message (left)
│          2:15 PM                    │
│                                     │
│                      Great! You? ✓  │ ← Your message (right)
│                      2:16 PM        │
│                                     │
│    [GIF of cat waving]              │ ← GIF message
│    2:16 PM                          │
│                                     │
│                  [Photo.jpg] ✓      │ ← Image message
│                  2:17 PM            │
│                                     │
│  ⋮                                  │
│  ⋮ (scrollable)                    │
│                                     │
├─────────────────────────────────────┤
│ [😊] Type a message...    [📎] [🎁] │ ← Input bar
│                            ↑    ↑   │
│                          File  GIF  │
└─────────────────────────────────────┘

Cooldown indicator (when active):
└─ Wait 1.2s to send next message ─┘
```

---

## 🔒 SECURITY CONSIDERATIONS:

### Message Validation:
```typescript
// Sanitize input
- Strip HTML tags (prevent XSS)
- Limit length: 500 characters
- Check for spam patterns
- Rate limit: 1.5s between messages
```

### File Upload:
```typescript
// Restrictions
- Max size: 5MB
- Allowed types: image/*, application/pdf
- Scan for malware (ClamAV or similar)
- Store in Cloudinary (not local)
```

### Recording Privacy:
```typescript
// Only record when:
- User clicks "Report & Block"
- Last 60 seconds captured
- Encrypted in transit
- Auto-delete after admin review
- GDPR compliant (user initiated)
```

---

## 🎯 CODE STRUCTURE:

### New Routes:

```
app/
  text-room/
    [roomId]/
      page.tsx (Text chat UI)
  
lib/
  gifAPI.ts (Tenor integration)
  chatRecorder.ts (Recording system)
  messageValidation.ts (Sanitization)
  
server/src/
  text-chat.ts (Message handlers)
  recording.ts (Recording storage)
  
components/chat/
  TextChatRoom.tsx
  MessageList.tsx
  MessageBubble.tsx
  ChatInput.tsx
  GIFPicker.tsx
  VideoUpgradeModal.tsx
  ModeToggle.tsx
```

---

## 🚀 MINIMAL VIABLE IMPLEMENTATION:

If you want this ASAP, here's the absolute minimum:

### Week 1 MVP:
1. Text mode toggle (just UI, routes to same video room)
2. Simple text chat (no GIFs, no files)
3. 1.5s rate limit
4. Timer countdown
5. Same ending screen

### Week 2 Add:
1. GIF support (Tenor API)
2. Image upload
3. Better UI styling

### Week 3 Add:
1. Video upgrade request
2. Recording on report
3. Admin review

---

## 📦 DEPENDENCIES NEEDED:

```json
{
  "tenor-api": "^1.0.0", // GIF search
  "he": "^1.2.0", // HTML entity encoding (XSS prevention)
  "dompurify": "^3.0.0", // Sanitize user input
  "react-window": "^1.8.0" // Virtualized message list (performance)
}
```

### Backend:
```json
{
  "multer": "already installed", // File uploads
  "sharp": "already installed", // Image processing
  "clamav.js": "^0.11.0" // Virus scanning (optional)
}
```

---

## ⚠️ COMPLEXITY ASSESSMENT:

**Lines of Code:** ~2,500 new lines  
**Components:** 10+ new components  
**Database Tables:** 2 new tables  
**API Integrations:** 1 (Tenor)  
**Testing Effort:** High (multiple flows)  
**Timeline:** 4-6 weeks for full implementation  

---

## 💡 RECOMMENDATIONS:

### Option A: Full Implementation (6 weeks)
- All features as specified
- Complete recording system
- Instagram-quality UI
- Thorough testing

### Option B: MVP First (2 weeks)
- Text mode toggle
- Basic messaging
- Simple UI
- Add features iteratively

### Option C: Start Simple (1 week)
- Keep video-only for now
- Improve existing chat feature
- Add GIF support to video chat
- Test market demand first

---

## 🎯 MY RECOMMENDATION:

**Start with Option C:**
1. Enhance existing in-call chat
2. Add GIF support to current video chat
3. Better UI for current chat
4. Gauge user interest
5. Build text-only mode if users request it

**Why:**
- Current system already works
- Video chat is your core value prop
- Text-only is 6 weeks of development
- Can always add later if needed

---

**This is a specification document. Let me know which option you want and I'll begin implementation with zero redundancy and full functionality.**

Ready to proceed when you are!

