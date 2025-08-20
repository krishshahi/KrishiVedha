@echo off
title KrishiVeda Development Environment
color 0A

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    KrishiVeda Dev Startup                   ║
echo ║                  Complete Development Setup                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Step 1: Updating network configuration...
echo ────────────────────────────────────────────────────────────────
node update-ip.js

echo.
echo 🛑 Step 2: Stopping existing servers...
echo ────────────────────────────────────────────────────────────────
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo.
echo 🚀 Step 3: Starting backend server...
echo ────────────────────────────────────────────────────────────────
start "KrishiVeda Backend" cmd /k "echo Starting Backend Server... && cd backend && node server.js"

echo.
echo ⏳ Step 4: Waiting for backend to initialize...
echo ────────────────────────────────────────────────────────────────
timeout /t 5 >nul

echo.
echo 📱 Step 5: Starting frontend development server...
echo ────────────────────────────────────────────────────────────────
start "KrishiVeda Frontend" cmd /k "echo Starting Frontend... && cd frontend && npx expo start --clear"

echo.
echo 🎉 Step 6: Setup Complete!
echo ────────────────────────────────────────────────────────────────
echo.
echo ✅ Backend server started
echo ✅ Frontend development server started
echo ✅ Network configuration updated
echo.
echo 🌐 Your app should now connect successfully!
echo.
echo 📖 Quick Reference:
echo    • Backend logs: Check the "KrishiVeda Backend" window
echo    • Frontend logs: Check the "KrishiVeda Frontend" window
echo    • Mobile app: Scan QR code or use Expo Go
echo    • Web app: Open the localhost URL shown in frontend terminal
echo.
echo 🛠️  Troubleshooting:
echo    • If connection fails, run this script again
echo    • Check that both terminal windows are running
echo    • Ensure your mobile device is on the same network
echo.
pause
