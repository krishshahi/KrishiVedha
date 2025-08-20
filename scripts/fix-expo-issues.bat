@echo off
echo === Expo Issue Troubleshooting Script ===
echo.

echo 1. Clearing Expo cache...
npx expo install --fix

echo.
echo 2. Clearing Metro cache...
npx expo start --clear --no-dev --minify

echo.
echo 3. If still having issues, try:
echo   - Restart your computer
echo   - Check your internet connection
echo   - Make sure no antivirus is blocking Expo
echo   - Try running: npx expo start --offline
echo   - Try running: npx expo start --localhost

echo.
echo 4. For the "Failed to download remote update" error specifically:
echo   - Check if updates are disabled in app.json
echo   - Try starting with: npx expo start --offline
echo   - Clear Expo Go app cache on your device

echo.
echo === Script completed ===
pause
