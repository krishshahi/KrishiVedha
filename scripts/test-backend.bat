@echo off
echo ========================================
echo   Testing Backend Server Connection
echo ========================================
echo.

echo 🔧 Starting Backend Server (Test Mode)...
cd /d "C:\Users\User\MyReactNativeApp\backend"

echo Starting server on http://10.10.13.109:3000...
echo Press Ctrl+C to stop the server
echo.

node server.js
