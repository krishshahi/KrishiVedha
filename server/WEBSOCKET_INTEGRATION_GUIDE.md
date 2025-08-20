# WebSocket Integration Guide for React Native

## Overview

The agriculture app server provides real-time IoT data through WebSocket connections. This guide explains how to properly connect and authenticate with the WebSocket server from your React Native app.

## WebSocket Server Details

- **URL:** `ws://localhost:3000/iot/ws` (for local development)
- **Network URL:** `ws://10.10.13.110:3000/iot/ws` (for mobile devices on same network)
- **Authentication:** Required using JWT token
- **Data Format:** JSON messages

## Authentication Flow

### 1. Get JWT Token
First, authenticate with the REST API to get a JWT token:

```javascript
// Login to get JWT token
const loginResponse = await fetch('http://10.10.13.110:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'your@email.com',
    password: 'yourpassword'
  })
});

const { token } = await loginResponse.json();
```

### 2. Connect to WebSocket
Create WebSocket connection and authenticate:

```javascript
const ws = new WebSocket('ws://10.10.13.110:3000/iot/ws');

ws.onopen = () => {
  console.log('WebSocket connected');
  
  // IMMEDIATELY send authentication after connection
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: your_jwt_token_here
  }));
};
```

## React Native Implementation

Here's a complete React Native WebSocket service:

```javascript
// services/WebSocketService.js
class WebSocketService {
  constructor() {
    this.ws = null;
    this.authenticated = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
  }

  connect(token) {
    try {
      console.log('📡 Connecting to WebSocket server...');
      
      // Use network IP for mobile device connections
      this.ws = new WebSocket('ws://10.10.13.110:3000/iot/ws');
      
      this.ws.onopen = () => {
        console.log('📡 WebSocket server connected');
        this.reconnectAttempts = 0;
        
        // Authenticate immediately after connection
        this.authenticate(token);
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };
      
      this.ws.onerror = (error) => {
        console.error('🚨 WebSocket server error:', error.message);
      };
      
      this.ws.onclose = (event) => {
        console.log('🔌 IoT WebSocket disconnected');
        this.authenticated = false;
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(token);
        }
      };
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  authenticate(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔐 Authenticating WebSocket connection...');
      this.ws.send(JSON.stringify({
        type: 'authenticate',
        token: token
      }));
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connected':
        console.log('📡 WebSocket server connected:', message.message);
        break;
        
      case 'authenticated':
        console.log('✅ WebSocket authentication successful');
        this.authenticated = true;
        
        // Subscribe to sensor data stream
        this.subscribe('sensor_data');
        break;
        
      case 'sensor_data':
        console.log('📊 Sensor data received:', message.data);
        // Handle sensor data in your app
        this.onSensorData?.(message.data);
        break;
        
      case 'error':
        console.error('🚨 WebSocket server error:', message.message);
        if (message.message.includes('Authentication')) {
          // Authentication failed - need to re-login
          this.onAuthenticationError?.();
        }
        break;
        
      default:
        console.log('📨 Unknown message type:', message.type);
    }
  }

  subscribe(topic) {
    if (this.authenticated && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        topic: topic
      }));
    }
  }

  attemptReconnect(token) {
    this.reconnectAttempts++;
    console.log(`🔄 Attempting IoT reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => {
      this.connect(token);
    }, this.reconnectInterval);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.authenticated = false;
    }
  }

  // Callback functions - set these from your components
  onSensorData = null;
  onAuthenticationError = null;
}

export default new WebSocketService();
```

## Usage in React Native Component

```javascript
// components/IoTDashboard.js
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import WebSocketService from '../services/WebSocketService';
import { getStoredToken } from '../services/AuthService';

const IoTDashboard = () => {
  const [sensorData, setSensorData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    const initWebSocket = async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          // Set up event handlers
          WebSocketService.onSensorData = (data) => {
            setSensorData(data);
            setConnectionStatus('connected');
          };
          
          WebSocketService.onAuthenticationError = () => {
            setConnectionStatus('authentication_failed');
            // Handle authentication error - maybe redirect to login
          };
          
          // Connect to WebSocket
          WebSocketService.connect(token);
        }
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    };

    initWebSocket();

    // Cleanup on unmount
    return () => {
      WebSocketService.disconnect();
    };
  }, []);

  return (
    <View>
      <Text>Connection Status: {connectionStatus}</Text>
      {sensorData && (
        <View>
          <Text>Temperature: {sensorData.temperature}°C</Text>
          <Text>Humidity: {sensorData.humidity}%</Text>
          <Text>Soil Moisture: {sensorData.soil_moisture}%</Text>
          <Text>pH: {sensorData.ph}</Text>
        </View>
      )}
    </View>
  );
};

export default IoTDashboard;
```

## Message Types

### Client → Server Messages

#### Authentication
```json
{
  "type": "authenticate",
  "token": "your_jwt_token_here"
}
```

#### Subscribe to Data Stream
```json
{
  "type": "subscribe",
  "topic": "sensor_data"
}
```

#### Unsubscribe from Data Stream
```json
{
  "type": "unsubscribe",
  "topic": "sensor_data"
}
```

#### Ping (Keep Alive)
```json
{
  "type": "ping"
}
```

### Server → Client Messages

#### Connection Established
```json
{
  "type": "connected",
  "message": "IoT WebSocket server connected",
  "timestamp": 1691234567890
}
```

#### Authentication Success
```json
{
  "type": "authenticated",
  "clientId": "user_123_1691234567890",
  "status": "success",
  "message": "WebSocket connection authenticated"
}
```

#### Sensor Data Stream
```json
{
  "type": "sensor_data",
  "timestamp": 1691234567890,
  "data": {
    "temperature": 28.5,
    "humidity": 65.2,
    "soil_moisture": 45.8,
    "ph": 6.8,
    "light_intensity": 35000,
    "wind_speed": 5.2,
    "rainfall": 0
  }
}
```

#### Error Messages
```json
{
  "type": "error",
  "message": "Authentication required"
}
```

## Common Issues & Solutions

### Issue: "Authentication required" error
**Solution:** Make sure you send the authentication message immediately after WebSocket connection opens.

### Issue: "Authentication failed" error  
**Solution:** 
1. Verify your JWT token is valid (not expired)
2. Make sure you're using the correct token format
3. Check that the user exists and is properly authenticated

### Issue: Connection keeps dropping
**Solution:**
1. Implement ping/pong messages to keep connection alive
2. Add reconnection logic with exponential backoff
3. Handle network changes in React Native

### Issue: Not receiving sensor data
**Solution:**
1. Make sure you're authenticated first
2. Send a subscribe message for 'sensor_data' topic after authentication
3. Check that the WebSocket connection is still active

## Testing WebSocket Connection

Run the test client to verify your server is working:

```bash
node websocket-test-client.js
```

This will test the complete authentication flow and data streaming.

## Network Configuration

- **Development (iOS Simulator):** Use `ws://localhost:3000/iot/ws`
- **Development (Android Emulator):** Use `ws://10.0.2.2:3000/iot/ws`
- **Physical Device:** Use your computer's IP address (e.g., `ws://10.10.13.110:3000/iot/ws`)

## Security Notes

1. Always use HTTPS/WSS in production
2. Validate JWT tokens on both client and server
3. Implement proper error handling for authentication failures
4. Consider implementing token refresh for long-lived connections
5. Use environment variables for WebSocket URLs

---

For more information, see the server documentation and test the connection using the provided test client.
