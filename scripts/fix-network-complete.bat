@echo off
echo.
echo 🔧 Complete Network Fix for React Native App
echo =============================================
echo.

echo 📋 Step 1: Checking Current Network Configuration
echo ------------------------------------------------
echo Current IP Addresses:
ipconfig | findstr "IPv4"
echo.

echo 🛑 Step 2: Stopping Existing Services
echo -------------------------------------
echo Stopping all Node.js processes...
taskkill /im "node.exe" /f 2>nul
taskkill /im "expo.exe" /f 2>nul
echo.

echo 🔥 Step 3: Configuring Windows Firewall
echo --------------------------------------
echo Adding firewall rule for Node.js (port 3000)...
netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000
echo Adding firewall rule for Expo Dev Server (port 8081)...
netsh advfirewall firewall add rule name="Expo Dev Server Port 8081" dir=in action=allow protocol=TCP localport=8081
echo.

echo 🧹 Step 4: Clearing All Caches
echo ------------------------------
if exist node_modules\.cache (
    echo Clearing node_modules cache...
    rmdir /s /q node_modules\.cache
)
if exist .expo (
    echo Clearing expo cache...
    rmdir /s /q .expo
)
if exist .metro (
    echo Clearing metro cache...
    rmdir /s /q .metro
)
echo Clearing npm cache...
npm cache clean --force
echo.

echo 🗂️ Step 5: Updating Configuration Files
echo ---------------------------------------
echo Configuration files have been updated to use IP: 10.0.0.99
echo - app.json: Updated API URL
echo - .env: Updated API URLs
echo - apiService.ts: Updated fallback URL
echo.

echo 🚀 Step 6: Starting Backend Server
echo ---------------------------------
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
)
echo Starting backend server on port 3000...
start "Backend Server" cmd /c "node server.js"
cd ..
echo.

echo ⏳ Step 7: Waiting for Backend to Initialize
echo ------------------------------------------
timeout /t 5 /nobreak > nul
echo.

echo 🌐 Step 8: Testing Backend Connection
echo -----------------------------------
echo Testing health endpoint...
curl -s http://10.0.0.99:3000/api/health
echo.
echo.

echo 🔄 Step 9: Installing Frontend Dependencies
echo -----------------------------------------
echo Checking for missing dependencies...
npm install
echo.

echo 📱 Step 10: Starting React Native Development Server
echo --------------------------------------------------
echo Starting Expo development server...
echo.
echo 💡 IMPORTANT: After the server starts, you can connect using:
echo    - Android Device: Use IP 10.0.0.99:8081
echo    - iOS Device: Use IP 10.0.0.99:8081
echo    - Android Emulator: Use IP 10.0.2.2:3000 for API calls
echo.
echo Starting server now...
npx expo start --clear --host lan --port 8081
