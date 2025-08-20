@echo off
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              KrishiVeda Network Configuration                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔄 Updating network configuration...
node update-ip.js

echo.
echo 🔥 Restarting backend server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo 🚀 Starting backend server...
start "Backend Server" cmd /k "cd backend && node server.js"

echo.
echo 📱 To restart frontend (run in another terminal):
echo    cd frontend
echo    npx expo start --clear
echo.

echo ✅ Network configuration update complete!
pause
