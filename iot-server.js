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
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('IoT Development Server Running');
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
