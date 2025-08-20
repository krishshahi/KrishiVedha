#!/usr/bin/env node

/**
 * WebSocket Test Client for IoT Server
 * This client tests the WebSocket authentication flow and connection
 */

const WebSocket = require('ws');
const axios = require('axios');

const SERVER_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/iot/ws';

// Test credentials (use the server's test users)
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

async function testWebSocketConnection() {
  try {
    console.log('🚀 Starting WebSocket Test Client...\n');
    
    // Step 1: Authenticate and get JWT token
    console.log('Step 1: Authenticating user...');
    const authResponse = await axios.post(`${SERVER_URL}/api/auth/login`, TEST_USER);
    
    if (!authResponse.data.success) {
      throw new Error('Authentication failed');
    }
    
    const token = authResponse.data.token;
    console.log('✅ Authentication successful');
    console.log(`👤 User: ${authResponse.data.user.email}`);
    console.log(`🎫 Token: ${token.substring(0, 20)}...\n`);
    
    // Step 2: Connect to WebSocket
    console.log('Step 2: Connecting to WebSocket server...');
    const ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      
      // Step 3: Authenticate WebSocket connection
      console.log('Step 3: Authenticating WebSocket connection...');
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: token
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Received message: ${message.type}`);
        
        switch (message.type) {
          case 'connected':
            console.log(`🔌 ${message.message}`);
            break;
            
          case 'authenticated':
            console.log(`✅ ${message.message}`);
            console.log(`🆔 Client ID: ${message.clientId}\n`);
            
            // Step 4: Subscribe to sensor data
            console.log('Step 4: Subscribing to sensor data stream...');
            ws.send(JSON.stringify({
              type: 'subscribe',
              topic: 'sensor_data'
            }));
            break;
            
          case 'subscribed':
            console.log(`✅ Subscribed to ${message.topic}`);
            console.log('🎉 Test successful! Now receiving sensor data...\n');
            break;
            
          case 'sensor_data':
            console.log('📊 Sensor Data Received:');
            console.log(`   🌡️  Temperature: ${message.data.temperature}°C`);
            console.log(`   💧 Humidity: ${message.data.humidity}%`);
            console.log(`   🌱 Soil Moisture: ${message.data.soil_moisture}%`);
            console.log(`   📈 pH: ${message.data.ph}`);
            console.log(`   ⏰ Timestamp: ${new Date(message.timestamp).toLocaleTimeString()}\n`);
            break;
            
          case 'pong':
            console.log('🏓 Pong received');
            break;
            
          case 'error':
            console.error(`❌ Error: ${message.message}`);
            break;
            
          default:
            console.log('📦 Unknown message:', message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('🚨 WebSocket error:', error);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket connection closed: ${code} - ${reason}`);
    });
    
    // Send ping every 30 seconds to test connection
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log('🏓 Sending ping...');
        ws.send(JSON.stringify({ type: 'ping' }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
    
    // Keep the connection open for 60 seconds for testing
    setTimeout(() => {
      console.log('⏰ Test completed. Closing connection...');
      ws.close();
      process.exit(0);
    }, 60000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted by user');
  process.exit(0);
});

// Run the test
console.log('WebSocket IoT Server Test Client');
console.log('================================');
testWebSocketConnection();
