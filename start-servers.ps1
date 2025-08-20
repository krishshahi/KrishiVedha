# PowerShell script to start both development servers for the Agriculture App

Write-Host "🌾 Starting Agriculture App Development Servers..." -ForegroundColor Green

# Function to start a server in a new window
function Start-ServerInNewWindow {
    param(
        [string]$ServerName,
        [string]$ScriptPath,
        [string]$WindowTitle
    )
    
    Write-Host "🚀 Starting $ServerName..." -ForegroundColor Yellow
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { node '$ScriptPath'; Read-Host 'Press Enter to close' }" -WindowStyle Normal
    
    Write-Host "✅ $ServerName started in new window" -ForegroundColor Green
}

try {
    # Start Mock Backend Server (Port 3000)
    Start-ServerInNewWindow -ServerName "Mock Backend API Server" -ScriptPath "mock-backend.js" -WindowTitle "Agriculture API Server"
    
    Start-Sleep -Seconds 2
    
    # Start IoT WebSocket Server (Port 3001) 
    Start-ServerInNewWindow -ServerName "IoT WebSocket Server" -ScriptPath "iot-server.js" -WindowTitle "Agriculture IoT Server"
    
    Write-Host ""
    Write-Host "🎉 Both servers are now starting!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Server Information:" -ForegroundColor Cyan
    Write-Host "   📡 Backend API Server: http://192.168.1.89:3000" -ForegroundColor White
    Write-Host "   🔌 IoT WebSocket Server: ws://192.168.1.89:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Available API Endpoints:" -ForegroundColor Cyan
    Write-Host "   - GET  /api/health" -ForegroundColor White
    Write-Host "   - GET  /api/users/{id}/farms" -ForegroundColor White
    Write-Host "   - GET  /api/users/{id}/stats" -ForegroundColor White
    Write-Host "   - GET  /api/weather" -ForegroundColor White
    Write-Host "   - GET  /api/community/posts" -ForegroundColor White
    Write-Host "   - POST /api/auth/login" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Your React Native app should now connect successfully!" -ForegroundColor Green
    Write-Host "💡 Check the server windows for connection logs and messages." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🛑 To stop servers: Close the server windows or press Ctrl+C in each" -ForegroundColor Red
    
} catch {
    Write-Host "❌ Error starting servers: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
