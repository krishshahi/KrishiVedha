@echo off
echo ========================================
echo   React Native App - Firewall Fix
echo   (Run as Administrator)
echo ========================================
echo.

echo 🔧 Adding Windows Firewall rules for React Native development...
echo.

echo Adding rule for Backend Server (Port 3000)...
netsh advfirewall firewall add rule name="React Native Backend - Port 3000" dir=in action=allow protocol=TCP localport=3000
if %errorlevel% equ 0 (
    echo ✅ Port 3000 rule added successfully
) else (
    echo ❌ Failed to add port 3000 rule
)

echo.
echo Adding rule for Expo Dev Server (Port 8081)...
netsh advfirewall firewall add rule name="React Native Expo - Port 8081" dir=in action=allow protocol=TCP localport=8081
if %errorlevel% equ 0 (
    echo ✅ Port 8081 rule added successfully
) else (
    echo ❌ Failed to add port 8081 rule
)

echo.
echo Adding rule for Metro Bundler (Port 19000-19001)...
netsh advfirewall firewall add rule name="React Native Metro - Port 19000" dir=in action=allow protocol=TCP localport=19000
netsh advfirewall firewall add rule name="React Native Metro - Port 19001" dir=in action=allow protocol=TCP localport=19001
if %errorlevel% equ 0 (
    echo ✅ Metro bundler rules added successfully
) else (
    echo ❌ Failed to add Metro bundler rules
)

echo.
echo ========================================
echo ✅ Firewall configuration complete!
echo.
echo Now your React Native app should be able to connect to:
echo   - Backend: http://10.10.13.109:3000
echo   - Expo: http://10.10.13.109:19000
echo.
echo Please restart your app to test the connection.
echo ========================================
echo.
pause
