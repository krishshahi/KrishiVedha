@echo off
echo ========================================
echo   React Native Agriculture App
echo   Starting Backend and Frontend
echo ========================================
echo.

echo 🔧 Checking if Node.js is available...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found!
echo.

echo 🗂️ Checking project directories...
if not exist "backend\server.js" (
    echo ❌ Backend server.js not found!
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ❌ Frontend package.json not found!
    pause
    exit /b 1
)

echo ✅ Project directories found!
echo.

echo 🚀 Starting Backend Server (Port 3000)...
start "🔧 Backend Server" cmd /k "cd /d "%~dp0backend" && echo Starting Backend Server on http://10.10.13.109:3000 && npm run dev"

echo ⏳ Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul

echo 📱 Starting Frontend (Expo)...
start "📱 Frontend App" cmd /k "cd /d "%~dp0frontend" && echo Starting React Native Frontend && npx expo start"

echo.
echo ========================================
echo ✅ Both servers are starting!
echo.
echo 🔧 Backend: http://10.10.13.109:3000
echo 📱 Frontend: Check the Expo terminal for QR code
echo.
echo 💡 Tips:
echo   - Backend runs on port 3000
echo   - Frontend will show QR code for mobile app
echo   - Press Ctrl+C in each window to stop servers
echo   - Close this window after servers are running
echo ========================================
echo.

echo Press any key to close this launcher...
pause >nul
