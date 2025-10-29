# USC Card System - Remaining Features Implementation Plan

## 📋 Status

**Session**: 41 commits, 6,000+ lines  
**Completed**: 90% of USC card system  
**Remaining**: 2 features to implement

---

## 🔲 Feature 1: USC Card Login Page

### **Current Login Page**:
- Email + password only
- No USC card option

### **Need to Add**:
```typescript
// app/login/page.tsx

1. Add tab selector:
   - "Email & Password" tab
   - "🎓 USC Card" tab

2. USC Card tab content:
   - Reuse USCCardScanner component
   - Call /usc/login-card endpoint
   - Handle success/error states
   - Check account expiry
   - Redirect to main if valid

3. Backend endpoint exists:
   - POST /usc/login-card (already implemented ✓)
   - Validates USC ID
   - Checks expiry
   - Creates session
   - Returns session data
```

**Implementation**: ~100 lines

---

## 🔲 Feature 2: Settings Guest Account Upgrade

### **Current Settings Page**:
- No guest account section
- No upgrade option

### **Need to Add**:
```typescript
// app/settings/page.tsx

1. Check if user is guest account:
   - Fetch user data
   - Check accountType === 'guest'
   - Show expiry countdown

2. Display guest account card:
   - "Guest Account" header
   - Days remaining (calculate from accountExpiresAt)
   - Warning if < 2 days
   - "Upgrade to Permanent" button

3. Upgrade modal:
   - Input: USC Email (@usc.edu)
   - Input: Password
   - Send verification code (SendGrid)
   - Verify code
   - Call /auth/link endpoint
   - Success: accountType → 'permanent'

4. After upgrade:
   - accountType changes to 'permanent'
   - accountExpiresAt set to null
   - No more expiry warnings
   - Can login with email OR card
```

**Implementation**: ~150 lines

---

## 🎯 Total Work Remaining

**Estimated Lines**: ~250  
**Estimated Time**: 1-2 hours  
**Complexity**: Medium  
**Dependencies**: All exist (endpoints, components ready)

---

## ✅ What's Already Built (Ready to Use)

**Backend Endpoints**:
- ✅ POST /usc/login-card (card login)
- ✅ POST /auth/link (upgrade to permanent)
- ✅ POST /verification/send (send email code)
- ✅ POST /verification/verify (verify code)

**Components**:
- ✅ USCCardScanner (can reuse for login)
- ✅ EmailVerification (can reuse for upgrade)
- ✅ PasswordInput (can reuse)

**Everything needed already exists** - just need to wire it up in UI!

---

## 📊 Session Summary So Far

**Total Commits**: 41  
**Total Lines**: 6,000+  
**Features Built**: 4 major systems  
**Security**: 21+ vulnerabilities fixed  
**Status**: 90% complete  

**Remaining**: 2 UI features (login tab + settings upgrade)

---

## 🚀 Next Session Plan

1. Implement USC card login tab (30 min)
2. Implement settings upgrade flow (45 min)
3. Test end-to-end (15 min)
4. Final commit and deploy

**Then**: 100% COMPLETE USC card system! 🎓

