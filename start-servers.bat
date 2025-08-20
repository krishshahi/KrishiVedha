@echo off
echo Starting Agriculture App Servers...
echo.

echo [1/2] Starting Main Backend Server (Port 3000)...
start "Main Backend" cmd /k "cd server && npm start"
timeout /t 3

echo [2/2] Starting Mock IoT Server (Port 3001)...  
start "Mock IoT Backend" cmd /k "node mock-backend.js"
timeout /t 2

echo.
echo ========================================
echo   🚀 Both Servers Started Successfully!
echo ========================================
echo.
echo 📍 Main Backend Server:
echo    URL: http://192.168.1.89:3000/api
echo    Features: Full API, MongoDB, AI/ML
echo.
echo 📍 Mock IoT Backend Server: 
echo    URL: http://192.168.1.89:3001/api
echo    Features: IoT Devices, Sensors, Automation
echo.
echo 💡 Your React Native app should now work with both servers!
echo.
echo Press any key to close this window...
pause >nul
