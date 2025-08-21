/**
 * Simple HTTP server for IoT development
 * This prevents WebSocket connection errors during app development
 */

const http = require('http');
const crypto = require('crypto');

// WebSocket magic string for handshake
const WEBSOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const server = http.createServer((req, res) => {
  // Handle regular HTTP requests
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Mock IoT API endpoints
  if (url.pathname === '/api/iot/sensors/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        temperature: 25.8 + Math.random() * 8 - 4,
        humidity: 62 + Math.random() * 20 - 10,
        soilMoisture: 48 + Math.random() * 20 - 10,
        lightIntensity: 850 + Math.random() * 300 - 150,
        ph: 6.7 + Math.random() * 1.0 - 0.5,
        timestamp: new Date()
      }
    }));
  } else if (url.pathname === '/api/iot/devices') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      devices: [
        {
          id: 'temp-sensor-01',
          name: 'Temperature Sensor 1',
          type: 'Environmental Sensor',
          status: 'online',
          batteryLevel: 87,
          lastSeen: new Date()
        },
        {
          id: 'soil-sensor-01',
          name: 'Soil Moisture Sensor 1', 
          type: 'Soil Monitor',
          status: 'online',
          batteryLevel: 72,
          lastSeen: new Date(Date.now() - 2 * 60 * 1000)
        },
        {
          id: 'irrigation-01',
          name: 'Smart Irrigation Controller',
          type: 'Irrigation System',
          status: 'offline',
          batteryLevel: 0,
          lastSeen: new Date(Date.now() - 45 * 60 * 1000)
        }
      ]
    }));
  } else if (url.pathname === '/api/iot/automation/rules') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: [
        {
          id: 'auto-irrigation-01',
          name: 'Smart Irrigation Control',
          condition: 'Soil moisture < 35%',
          action: 'Start irrigation for 20 minutes',
          enabled: true,
          lastTriggered: new Date(Date.now() - 3 * 60 * 60 * 1000)
        },
        {
          id: 'temp-alert-01',
          name: 'High Temperature Warning',
          condition: 'Temperature > 35°C',
          action: 'Send alert notification',
          enabled: true
        },
        {
          id: 'battery-warning-01',
          name: 'Low Battery Alert',
          condition: 'Device battery < 15%',
          action: 'Send maintenance notification',
          enabled: false
        }
      ]
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🤖 IoT Development Server Running\n\nAvailable endpoints:\n- /api/iot/sensors/data\n- /api/iot/devices\n- /api/iot/automation/rules');
  }
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  console.log('🔌 WebSocket upgrade requested');
  
  // WebSocket handshake
  const key = request.headers['sec-websocket-key'];
  const acceptKey = crypto.createHash('sha1')
    .update(key + WEBSOCKET_MAGIC_STRING)
    .digest('base64');

  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '\r\n'
  ].join('\r\n');

  socket.write(responseHeaders);
  console.log('✅ WebSocket handshake completed');

  // Handle WebSocket messages
  socket.on('data', (buffer) => {
    try {
      // Simple frame parsing (this is a minimal implementation)
      const firstByte = buffer[0];
      const secondByte = buffer[1];
      const isMasked = Boolean(secondByte & 0x80);
      let payloadLength = secondByte & 0x7F;
      
      if (payloadLength > 0) {
        console.log('📨 Received WebSocket data');
        
        // Send a simple response frame (unmasked)
        const response = JSON.stringify({
          type: 'ack',
          message: 'IoT server received your message',
          timestamp: Date.now()
        });
        
        const responseBuffer = Buffer.from(response, 'utf8');
        const frame = Buffer.allocUnsafe(2 + responseBuffer.length);
        
        frame[0] = 0x81; // FIN bit set, text frame
        frame[1] = responseBuffer.length; // payload length
        responseBuffer.copy(frame, 2);
        
        socket.write(frame);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  socket.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });

  socket.on('error', (error) => {
    console.error('WebSocket socket error:', error);
  });

  // Send initial connection message
  setTimeout(() => {
    const welcome = JSON.stringify({
      type: 'connected',
      message: 'IoT development server ready',
      timestamp: Date.now()
    });
    
    const welcomeBuffer = Buffer.from(welcome, 'utf8');
    const frame = Buffer.allocUnsafe(2 + welcomeBuffer.length);
    
    frame[0] = 0x81; // FIN bit set, text frame
    frame[1] = welcomeBuffer.length; // payload length
    welcomeBuffer.copy(frame, 2);
    
    socket.write(frame);
  }, 100);
});

server.listen(3001, '0.0.0.0', () => {
  console.log('🤖 IoT Development Server started on http://0.0.0.0:3001');
  console.log('🔌 WebSocket upgrade available on ws://0.0.0.0:3001');
  console.log('🌐 Server accessible from:');
  console.log('   - ws://localhost:3001 (local)');
  console.log('   - ws://192.168.1.129:3001 (network)');
  console.log('✅ Server ready - waiting for connections...');
});
