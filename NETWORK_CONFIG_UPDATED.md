# KrishiVedha Network Configuration Update

## 📡 **Current Network Configuration**

**Updated on**: August 21, 2025  
**Current IP Address**: `10.10.13.97`  
**Previous IP Address**: `192.168.43.180`

---

## 🔧 **Updated Configuration Files**

### 1. **Main Environment Configuration**
- **File**: `.env`
- **Updated**: `REACT_NATIVE_API_URL=http://10.10.13.97:3000/api`

### 2. **Expo Configuration**
- **File**: `client/app.json`
- **Updated**: `extra.REACT_NATIVE_API_URL = "http://10.10.13.97:3000/api"`

### 3. **API Configuration**
- **File**: `client/src/config/apiConfig.js`
- **Updated**: `baseURL: 'http://10.10.13.97:3000/api'`

### 4. **Network Configuration**
- **File**: `client/src/config/network.ts`
- **Updated**: Primary IP and fallback IPs updated

### 5. **IoT Integration Service**
- **File**: `client/src/services/iotIntegrationService.js`
- **Updated**: 
  - `baseUrl: 'http://10.10.13.97:3000/api'`
  - `wsUrl: 'ws://10.10.13.97:3001'`

### 6. **Android Network Security**
- **File**: `client/android/app/src/main/res/xml/network_security_config.xml`
- **Updated**: Added `10.10.13.97` as trusted domain

---

## 🚀 **Server Status**

### Main Server (Port 3000)
- ✅ **Status**: Running successfully
- ✅ **Health Check**: `http://localhost:3000/api/health`
- ✅ **Database**: MongoDB connected
- ✅ **Authentication**: Working with test users

### IoT Server (Port 3001)
- ✅ **Status**: Running successfully
- ✅ **Mock Data**: IoT endpoints working
- ✅ **WebSocket**: Available for real-time data

---

## 📱 **Connection URLs**

### For Local Development:
- **Main API**: `http://localhost:3000/api`
- **IoT API**: `http://localhost:3001/api/iot`

### For Mobile Devices (Same Network):
- **Main API**: `http://10.10.13.97:3000/api`
- **IoT API**: `http://10.10.13.97:3001/api/iot`
- **WebSocket**: `ws://10.10.13.97:3001`

### For Android Emulator:
- **Main API**: `http://10.0.2.2:3000/api`
- **IoT API**: `http://10.0.2.2:3001/api/iot`

---

## 🔐 **Test Credentials**

The server automatically creates test users:
- **Email**: `test@example.com` / **Password**: `password123`
- **Email**: `demo@krishiveda.com` / **Password**: `demo123`

---

## 🛠️ **How to Start the Application**

### Option 1: Start Individual Services
```bash
# Terminal 1: Main server
cd server && npm run dev

# Terminal 2: IoT server
node iot-server.js

# Terminal 3: React Native app
cd client && expo start
```

### Option 2: Start All Services Together
```bash
# From root directory
npm run dev
```

---

## ✅ **Configuration Verified**

All configuration files have been updated with the current IP address `10.10.13.97`. The application is now ready to work with the new network configuration.

**Next Steps**:
1. Restart the mobile app if it was running
2. Clear any cached network settings in the app
3. Test connectivity from mobile devices on the same network

---

## 🔍 **Troubleshooting**

If you encounter connection issues:

1. **Check if servers are running**:
   ```bash
   lsof -i :3000  # Main server
   lsof -i :3001  # IoT server
   ```

2. **Test API connectivity**:
   ```bash
   curl http://10.10.13.97:3000/api/health
   curl http://10.10.13.97:3001/api/iot/devices
   ```

3. **Verify network connectivity**:
   ```bash
   ping 10.10.13.97
   ```
