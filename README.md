# BUMPIN

**Live Video Matchmaking Platform for College Students**

🌐 **Live at**: [bumpin.io](https://bumpin.io)

---

## 🎯 Overview

BUMPIN is a real-time video matchmaking platform designed for college students to make authentic connections through 1-on-1 video chats. Match with fellow students, share socials, and build your network—all through live video interactions.

### Key Features

- 🎥 **Live 1-on-1 Video Calls** - WebRTC-powered instant matching
- 💬 **Text Chat Mode** - Alternative to video for situations where camera isn't available
- 📸 **Profile System** - Photo, intro video, and Instagram carousel
- 🎓 **USC Campus Card Verification** - Instant signup with campus ID barcode
- ✉️ **Email Verification** - Secure account upgrades with SendGrid
- 🔐 **Invite-Only Access** - QR codes from campus events or friend invites
- 📱 **Mobile Optimized** - Responsive design for all devices
- 🎨 **Instagram Integration** - Showcase your Instagram posts in matchmaking

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- SendGrid account (for email verification)

### Installation

```bash
# Clone repository
git clone https://github.com/exexexll/Napalmsky.git
cd Napalmsky

# Install dependencies
npm install
cd server && npm install && cd ..

# Set up environment variables
cp env.production.template .env.local
# Edit .env.local with your configuration

# Run database migrations
psql your_database < migrations/[latest-migration].sql

# Start development servers
npm run dev          # Frontend (port 3000)
cd server && npm run dev  # Backend (port 3001)
```

### Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_BASE=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_key
```

**Backend** (`server/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/bumpin
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@bumpin.io
SESSION_SECRET=your_secret_key
ALLOWED_ORIGINS=http://localhost:3000,https://bumpin.io
```

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Socket.io-client (real-time)

**Backend:**
- Node.js + Express
- Socket.io (WebSocket)
- PostgreSQL (database)
- simple-peer (WebRTC)
- bcrypt (password hashing)
- SendGrid (email)

**Infrastructure:**
- Vercel (Frontend hosting)
- Railway (Backend + Database)
- TURN/STUN servers (WebRTC)

---

## 📁 Project Structure

```
Napalmsky/
├── app/                    # Next.js pages (App Router)
│   ├── page.tsx           # Landing page
│   ├── waitlist/          # Waitlist + USC signup
│   ├── onboarding/        # New user signup flow
│   ├── login/             # User login (email or USC card)
│   ├── main/              # Main matchmaking interface
│   ├── room/              # Video call room
│   ├── text-room/         # Text chat room
│   ├── settings/          # User settings
│   ├── history/           # Call history
│   └── socials/           # Social media management
├── components/            # React components
│   ├── matchmake/         # Matchmaking UI (UserCard, etc.)
│   ├── usc-verification/  # USC card scanner components
│   ├── Header.tsx         # Global header
│   ├── Hero.tsx           # Landing page hero
│   ├── InstagramEmbed.tsx # Instagram carousel
│   └── ...
├── server/                # Backend API
│   └── src/
│       ├── index.ts       # Express server + Socket.io
│       ├── auth.ts        # Authentication routes
│       ├── room.ts        # WebRTC signaling
│       ├── event.ts       # Campus events system
│       ├── usc-verification.ts  # USC card verification
│       ├── store.ts       # In-memory data store
│       ├── db.ts          # PostgreSQL connection
│       └── types.ts       # TypeScript types
├── lib/                   # Shared utilities
│   ├── api.ts            # API client functions
│   ├── session.ts        # Session management
│   └── matchmaking.ts    # Matchmaking logic
├── migrations/           # Database migrations
└── public/              # Static assets
```

---

## 🎓 USC Student Features

### Campus Card Verification

- **Barcode Scanning**: Scan the back of your USC campus card for instant verification
- **16x Faster**: Optimized Quagga2 scanner (improved from 60s to 3-5s)
- **Flashlight Support**: Toggle flashlight for low-light scanning
- **Single-Use Cards**: Each card can only be registered once
- **Duplicate Protection**: 4-layer system prevents multiple accounts

### USC Email Verification

- **@usc.edu Required**: USC card users must link their USC email
- **SendGrid Integration**: 6-digit email verification codes
- **Mandatory Verification**: No bypasses, all routes protected
- **Visual Indicators**: Blue info boxes clearly show USC requirements

### Access Methods

1. **Admin QR Code**: Scan QR codes at USC campus events
2. **Friend Invite**: Get a 4-use invite code from existing users
3. **USC Campus Card**: Scan barcode for instant access

---

## 🔐 Security Features

### Account Protection

- ✅ **Invite-Only System**: Waitlist for general public, QR/card for USC students
- ✅ **Email Verification**: Mandatory for permanent accounts
- ✅ **Password Validation**: Strength requirements (8+ chars, uppercase, lowercase, number, special)
- ✅ **Session Management**: Single active session per user, auto-logout on new login
- ✅ **Rate Limiting**: All endpoints protected (3-10 requests per timeframe)
- ✅ **SQL Injection Prevention**: Parameterized queries throughout
- ✅ **Input Validation**: Comprehensive validation on all user inputs

### Data Privacy

- ✅ **USC ID Redaction**: Always displayed as `12****5678`
- ✅ **SHA-256 Hashing**: USC IDs hashed before storage
- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **Session Tokens**: UUID v4, secure and random
- ✅ **CORS Configuration**: Strict origin validation

---

## 📊 User Flows

### Signup Flow (New Users)

```
Waitlist Page
    ↓
Choose Method:
├─ Scan QR Code (Admin or Friend)
│  └─ Extract invite code → Onboarding
└─ Scan USC Card
   └─ Store USC ID → Onboarding
    ↓
Onboarding Steps:
1. Name & Gender selection
2. Photo capture (with preview/confirm)
3. Video intro (with preview/retake)
4. Optional Permanent Upgrade:
   - Email + Password
   - Email verification (6-digit code)
   - Account becomes permanent
    ↓
Main App (Start matching!)
```

### Login Flow (Existing Users)

```
Login Page
    ↓
Choose Method:
├─ Email + Password
└─ USC Campus Card (scan barcode)
    ↓
Main App
```

---

## 🎨 Brand Identity

### Colors

- **Primary**: `#ffc46a` (Yellow/Orange)
- **Text**: `#0a0a0c` (Near Black)
- **Background**: `#0a0a0c` (Dark)
- **Accent**: `#eaeaf0` (Light Gray)

### Typography

- **Headings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)
- **Code/Mono**: System monospace

---

## 🔄 Real-Time Features

### WebRTC Video Calls

- Direct peer-to-peer connections
- TURN/STUN server fallback
- Automatic reconnection handling
- Call quality indicators
- Mobile-optimized UI

### Socket.io Events

- `queue:join` - Join matchmaking queue
- `match:found` - Match discovered
- `call:offer` / `call:answer` - WebRTC signaling
- `room:chat` - Text chat messages
- `room:giveSocial` - Share social media
- `user:disconnect` - Handle disconnections

---

## 📦 Key Dependencies

### Frontend

```json
{
  "next": "^14.2.18",
  "react": "^18.3.1",
  "framer-motion": "^11.11.11",
  "socket.io-client": "^4.8.1",
  "simple-peer": "^9.11.1",
  "html5-qrcode": "^2.3.8",
  "@ericblade/quagga2": "^1.8.6"
}
```

### Backend

```json
{
  "express": "^4.21.1",
  "socket.io": "^4.8.1",
  "pg": "^8.13.1",
  "bcrypt": "^5.1.1",
  "@sendgrid/mail": "^8.1.4",
  "uuid": "^11.0.3"
}
```

---

## 🗄️ Database Schema

### Core Tables

- **users** - User accounts, profiles, and verification status
- **sessions** - Active user sessions with tokens
- **usc_card_registrations** - USC campus card verifications
- **invite_codes** - Admin and user invite codes
- **session_completions** - Call history and statistics
- **waitlist** - General public waitlist
- **campus_events** - USC campus events (future feature)

### Key Fields

```sql
users:
- user_id (TEXT PRIMARY KEY)
- name, gender, account_type
- selfie_url, video_url
- instagram_posts (TEXT[])
- usc_id, email, email_verified
- paid_status, account_expires_at
- my_invite_code (4 uses per user)

sessions:
- session_token (TEXT PRIMARY KEY)
- user_id, is_active
- created_at, expires_at

usc_card_registrations:
- usc_id (TEXT PRIMARY KEY)
- user_id, raw_barcode_value
- first_scanned_at
```

---

## 🚦 API Endpoints

### Authentication

- `POST /auth/guest` - Create guest account (with invite code)
- `POST /auth/guest-usc` - Create USC guest account
- `POST /auth/login` - Email + password login
- `POST /auth/link` - Link email to existing account

### USC Verification

- `GET /usc/check-card/:uscId` - Check if card already registered
- `POST /usc/finalize-registration` - Link USC card to account
- `POST /usc/login-card` - Login with USC card barcode

### Email Verification

- `POST /verification/send` - Send 6-digit code
- `POST /verification/verify` - Verify code

### Media Upload

- `POST /media/selfie` - Upload profile photo
- `POST /media/video` - Upload intro video

### Social Media

- `GET /instagram/posts` - Get user's Instagram posts
- `POST /instagram/posts` - Save Instagram post URLs

### Matchmaking

- WebSocket events via Socket.io
- Queue management, matching, signaling

---

## 🎮 Usage

### For USC Students

1. **Visit** [bumpin.io/waitlist](https://bumpin.io/waitlist)
2. **Choose signup method**:
   - Scan admin QR code from campus events
   - Scan your USC campus card barcode
   - Get an invite from a friend
3. **Complete onboarding**: Name, photo, video
4. **Start matching!**

### For Non-USC Students

1. **Join waitlist** at [bumpin.io/waitlist](https://bumpin.io/waitlist)
2. **Or get an invite** from a USC student (4-use codes)
3. **Complete onboarding**
4. **Start matching!**

---

## 🔧 Development

### Running Locally

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server && npm run dev

# Terminal 3: Watch logs
tail -f server/logs/*.log
```

### Building for Production

```bash
# Frontend
npm run build
npm start

# Backend
cd server
npm run build
npm start
```

### Database Migrations

```bash
# Run a migration
psql $DATABASE_URL -f migrations/your-migration.sql

# Clean duplicate USC cards (if needed)
psql $DATABASE_URL -f migrations/remove-duplicate-usc-cards.sql
```

---

## 📱 Features in Detail

### Photo/Video Capture

- **Preview Before Upload**: See your photo/video before confirming
- **Retake Option**: Don't like it? Retake as many times as you need
- **Progress Indicators**: Visual feedback during upload
- **Compression**: Automatic image optimization (WebP, 800x800, 85% quality)
- **Camera Only**: No file uploads for authenticity

### Instagram Carousel

- **Multi-Post Display**: Show up to 10 Instagram posts
- **Navigation**: Swipe or click arrows to browse posts
- **Auto-Sizing**: Scales to hide white Instagram UI
- **Interactive**: All Instagram features work (video, multi-photo, etc.)
- **Add Posts**: Manage in /socials page

### Matchmaking

- **Smart Queue**: Gender preferences, availability status
- **Direct Match**: Use intro codes to match with specific people
- **Referral System**: Introduce friends, get notifications when they sign up
- **Call History**: Track all your video/text sessions
- **Social Sharing**: Share Instagram, Snapchat, TikTok, X after calls

---

## 🛡️ Safety & Policies

- [Terms of Service](/terms-of-service)
- [Privacy Policy](/privacy-policy)
- [Content Policy](/content-policy)
- [Community Guidelines](/community-guidelines)
- [Acceptable Use Policy](/acceptable-use)
- [Cookie Policy](/cookie-policy)

---

## 📈 Stats (As of November 2025)

- **Total Commits**: 176
- **Lines of Code**: ~31,000+
- **Source Files**: 130+ TypeScript files
- **Features**: 40+ major systems
- **API Endpoints**: 50+ routes
- **Database Tables**: 15+ tables

---

## 🤝 Contributing

This is a private project for USC students. Contact [everything@napalmsky.com](mailto:everything@napalmsky.com) for more information.

---

## 📞 Support

**Email**: everything@napalmsky.com  
**Location**: 1506 Nolita, Los Angeles, CA 90026  

---

## 📄 License

© 2025 BUMPIN. All rights reserved.

---

## 🎉 Recent Updates (November 2025)

### Version 3.0 - Major Release

**New Features:**
- ✅ Waitlist system with invite-only access
- ✅ USC campus card barcode scanning (16x faster)
- ✅ Email verification system (SendGrid)
- ✅ Photo/video preview before upload
- ✅ Password strength validation
- ✅ Guest account system (7-day auto-delete)
- ✅ Single session enforcement
- ✅ Domain migration to bumpin.io
- ✅ Instagram carousel in matchmaking
- ✅ QR code signup (manual camera permission)

**Bug Fixes:**
- ✅ Reconnection popup ghost issue
- ✅ Social sharing in text mode
- ✅ Photo capture (canvas.toBlob fix)
- ✅ USC email enforcement (3-way validation)
- ✅ Duplicate USC card prevention (4-layer protection)
- ✅ Video preview visibility
- ✅ Mobile header layout
- ✅ And 40+ more fixes...

**UI/UX Improvements:**
- ✅ Consistent brand colors (yellow/orange/black)
- ✅ Mobile-optimized layouts
- ✅ Simplified waitlist text
- ✅ Clear call-to-action buttons
- ✅ Professional appearance throughout

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
# Auto-deploys on push to master
git push origin master

# Manual deploy
vercel --prod
```

### Backend (Railway)

```bash
# Deploy from Railway dashboard
# Or use Railway CLI:
railway up

# Check logs
railway logs
```

### Database Migrations

```bash
# Run on Railway database
railway run psql $DATABASE_URL -f migrations/your-migration.sql
```

---

## 📚 Documentation

- [Complete Project Documentation](COMPLETE-PROJECT-DOCUMENTATION.md)
- [USC Email Verification Setup](USC-EMAIL-VERIFICATION-SETUP.md)
- [SendGrid Setup Guide](SENDGRID-QUICK-SETUP.md)
- [USC Card Scanner Implementation](USC-CARD-SCANNER-IMPLEMENTATION-PLAN.md)
- [Signup Pipeline Map](COMPLETE-SIGNUP-PIPELINE-MAP.md)
- [Backend Flow Verification](WORKFLOW-CODE-VERIFICATION.md)

---

## 🎯 Roadmap

### In Progress
- Analytics integration
- Performance optimizations
- Enhanced reporting features

### Planned
- Multi-campus expansion
- TikTok integration
- Advanced matching algorithms
- Campus event calendar
- Group video calls

---

**Built with ❤️ by Napalmsky Ventures**

*Making authentic connections through live video, one match at a time.*
