@echo off
echo 🤖 Starting IoT WebSocket Server for Agriculture App...
echo.
echo 🔌 Server will be available at:
echo    - ws://localhost:3001 (local)
echo    - ws://192.168.1.89:3001 (network)
echo.
echo 🔄 Starting server...
node iot-server.js
pause
