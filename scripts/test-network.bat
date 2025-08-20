@echo off
echo 🌐 Network Configuration Test
echo =============================
echo.

echo 📋 Current IP Address:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do echo %%a
echo.

echo 🎯 Testing Backend Connection:
echo GET http://10.0.0.99:3000/api/health
curl -s http://10.0.0.99:3000/api/health
echo.
echo.

echo 🔒 Testing Auth Endpoint:
echo POST http://10.0.0.99:3000/api/auth/login
curl -s -X POST http://10.0.0.99:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
echo.
echo.

echo 📊 Testing Users Endpoint:
echo GET http://10.0.0.99:3000/api/users
curl -s http://10.0.0.99:3000/api/users
echo.
echo.

echo 🚀 Network Test Complete!
echo.
echo If you see JSON responses above, the network is working correctly.
echo If you see errors, check your firewall settings or try a different IP.
echo.
pause
