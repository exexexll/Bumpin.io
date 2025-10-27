#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "🚀 RAILWAY BACKEND DEPLOYMENT HELPER"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "This script helps you deploy the backend to Railway"
echo ""

# Check if railway CLI is installed
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI detected"
    echo ""
    echo "Deploying to Railway..."
    cd server
    railway up
    echo ""
    echo "✅ Deployment triggered!"
else
    echo "⚠️ Railway CLI not installed"
    echo ""
    echo "Option 1: Install Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo "  railway login"
    echo "  cd server"
    echo "  railway up"
    echo ""
    echo "Option 2: Deploy via Dashboard:"
    echo "  1. Go to: https://railway.app"
    echo "  2. Login"
    echo "  3. Find: napalmsky project"
    echo "  4. Select: backend service"
    echo "  5. Click: 'Deploy' button"
    echo "  6. Wait 3-5 minutes"
    echo ""
    echo "Option 3: Force GitHub Trigger:"
    echo "  Railway should auto-deploy from GitHub"
    echo "  Check: Settings → Deploy triggers"
    echo "  Verify: Branch = master"
    echo ""
fi

echo "════════════════════════════════════════════════════════════"
echo "After deployment completes:"
echo "  1. Wait 3-5 minutes"
echo "  2. Check Railway logs for 'Deployed'"
echo "  3. Test: Add Instagram post on /socials"
echo "  4. Refresh page - post should persist"
echo "  5. Go to /matchmake - carousel should work"
echo "════════════════════════════════════════════════════════════"

