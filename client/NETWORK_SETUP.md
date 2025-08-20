# Dynamic Network Configuration

This React Native app now automatically detects and adapts to network changes, eliminating the need to manually update IP addresses when switching between different networks.

## How it Works

### 1. Automatic IP Detection
- Uses `@react-native-community/netinfo` to detect the current network state
- Automatically extracts the device's IP address from WiFi network details
- Falls back to common development server IPs if detection fails

### 2. Dynamic API Client Initialization
- The API client is initialized asynchronously on first use
- Tests multiple potential server URLs to find the working one
- Caches the working configuration for performance

### 3. Network Change Monitoring
- Monitors network state changes in real-time
- Automatically reinitializes the API client when the network changes
- Handles switching between WiFi networks, mobile data, and other connection types

## Features

### ✅ **Automatic Network Detection**
- Detects device IP address automatically
- No need to manually update IP addresses in code
- Works across different network environments

### ✅ **Smart API URL Discovery**
- Tests multiple potential API endpoints
- Chooses the first working endpoint automatically
- Includes fallback mechanisms for reliability

### ✅ **Real-time Network Monitoring**
- Monitors network changes in the background
- Automatically reconfigures API client on network changes
- Handles connection loss and recovery gracefully

### ✅ **Developer-Friendly**
- Comprehensive logging for debugging
- Easy to extend and customize
- Minimal performance impact

## Configuration Files

### `src/config/network.ts`
- Core network configuration and detection logic
- IP detection and API URL generation
- Network connectivity testing

### `src/services/apiService.ts`
- Dynamic API client initialization
- All API methods now use dynamic configuration
- Automatic client reinitialization support

### `src/utils/networkChangeDetector.ts`
- Network change monitoring utility
- Automatic API client reinitialization
- Network status reporting

## Usage

The network detection is automatically initialized when the app starts. No manual configuration is required.

### Manual Network Refresh (Optional)
```javascript
import { refreshNetworkConfiguration } from './src/utils/networkChangeDetector';

// Manually refresh network configuration
await refreshNetworkConfiguration();
```

### Check Network Status (Optional)
```javascript
import { getCurrentNetworkInfo, getNetworkMonitoringStatus } from './src/utils/networkChangeDetector';

// Get current network information
const networkInfo = await getCurrentNetworkInfo();
console.log('Network Info:', networkInfo);

// Get monitoring status
const status = getNetworkMonitoringStatus();
console.log('Monitoring Status:', status);
```

## Troubleshooting

### If the app can't connect to your backend:

1. **Check if your backend server is running**
   ```bash
   curl http://YOUR_IP:3000/api/health
   ```

2. **Verify your IP address**
   ```bash
   ipconfig  # Windows
   ifconfig  # macOS/Linux
   ```

3. **Check firewall settings**
   - Ensure ports 3000 and 8081 are not blocked
   - Add firewall exceptions if needed

4. **Check the console logs**
   - The app logs detailed network detection information
   - Look for "🔧 API Configuration" messages to see detected URLs

### Common Network Scenarios

- **Home WiFi**: Automatically detects your router's network range
- **Office WiFi**: Works with corporate networks (if not restricted)
- **Mobile Hotspot**: Detects hotspot IP ranges
- **Ethernet**: Falls back to localhost for wired connections

## Technical Details

### IP Detection Logic
1. First tries to get WiFi IP address from NetInfo
2. Falls back to common development server IPs:
   - `192.168.1.1` (common home router)
   - `192.168.0.1` (another common router)
   - `10.0.0.1` (corporate networks)
   - `localhost` (local development)

### API URL Testing
The app tests URLs in this order:
1. Detected network IP + `:3000/api`
2. Android emulator IP (`10.0.2.2:3000/api`)
3. Localhost (`localhost:3000/api`)

### Caching
- IP addresses are cached for 30 seconds to improve performance
- API client is reused until network changes
- Configuration is updated only when necessary

## Dependencies

- `@react-native-community/netinfo`: Network state detection
- `react-native-network-info`: Additional network information (fallback)
- `axios`: HTTP client with dynamic configuration

## Performance

- Minimal impact on app startup time
- Network monitoring uses efficient event listeners
- Caching reduces redundant network calls
- Automatic cleanup prevents memory leaks
