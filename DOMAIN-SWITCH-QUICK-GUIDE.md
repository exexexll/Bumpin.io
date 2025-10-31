HOW TO SWITCH TO ANOTHER DOMAIN (napalmsky.com → bumpin.com)
=============================================================

## QUICK STEPS (30 minutes)

### 1. Configure New Domain in Vercel (5 min)
```
1. Go to vercel.com/dashboard
2. Select your project
3. Settings → Domains
4. Click "Add Domain"
5. Enter: bumpin.com
6. Add www redirect: www.bumpin.com → bumpin.com
7. Wait for DNS propagation (5-15 min)
```

### 2. Update Environment Variable in Railway (2 min)
```
1. Go to Railway dashboard
2. Select napalmsky-production
3. Variables tab
4. Add: FRONTEND_URL=https://bumpin.com
5. Save (auto-redeploys in 2 min)
```

### 3. Update CORS (Already Done!)
```
The code already uses process.env.FRONTEND_URL:
✅ server/src/payment.ts line 576
✅ QR codes will automatically use bumpin.com
```

### 4. Test New Domain (5 min)
```bash
# Wait for Vercel deployment, then:
1. Visit https://bumpin.com
2. Test login
3. Test USC card scanning
4. Test video calls
5. Verify QR codes use new domain
```

### 5. Gradual Migration (Optional)
```
Week 1: Both domains work
Week 2: Add redirect banner on napalmsky.com
Week 3: 301 redirect napalmsky.com → bumpin.com
```

---

## NO CODE CHANGES NEEDED!

The app is already configured to use environment variables:
✅ QR codes: Uses FRONTEND_URL or bumpin.com default
✅ CORS: Already includes bumpin.com
✅ API calls: Use relative paths (work on any domain)

---

## INSTANT SWITCH (Zero Downtime)

Just add domain in Vercel → Works immediately!
No code deploy needed.
Both domains can work simultaneously.

---

Total Time: ~30 minutes
Downtime: 0 seconds
Code Changes: 0 (already prepared!)

🚀 Ready to switch anytime!
