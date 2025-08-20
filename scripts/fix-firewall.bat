@echo off
echo Adding Windows Firewall rule for Agriculture App Backend...
echo This will allow port 3000 for incoming connections.
echo.

REM Add firewall rule for port 3000
netsh advfirewall firewall add rule name="Agriculture App Backend" dir=in action=allow protocol=TCP localport=3000

echo.
echo Firewall rule added successfully!
echo Your mobile device should now be able to connect to the backend server.
echo.
pause
