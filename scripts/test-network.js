const http = require('http');
const os = require('os');

// Function to get network interfaces
function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(addr => {
      if (addr.family === 'IPv4' && !addr.internal) {
        addresses.push({
          name: name,
          address: addr.address,
          netmask: addr.netmask
        });
      }
    });
  });
  
  return addresses;
}

// Test function to check if a URL is accessible
function testUrl(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          success: true,
          data: data
        });
      });
    });
    
    request.on('error', (error) => {
      resolve({
        url,
        success: false,
        error: error.message
      });
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      resolve({
        url,
        success: false,
        error: 'Timeout'
      });
    });
  });
}

async function main() {
  console.log('🔍 Network Interface Detection Test');
  console.log('=====================================');
  
  const interfaces = getNetworkInterfaces();
  console.log('📡 Available Network Interfaces:');
  interfaces.forEach(iface => {
    console.log(`  - ${iface.name}: ${iface.address} (Netmask: ${iface.netmask})`);
  });
  
  console.log('\n🌐 Testing Backend Connectivity:');
  console.log('================================');
  
  const testUrls = [
    'http://localhost:3000/api/health',
    'http://127.0.0.1:3000/api/health',
    'http://10.10.13.109:3000/api/health'
  ];
  
  for (const url of testUrls) {
    console.log(`\nTesting: ${url}`);
    const result = await testUrl(url);
    
    if (result.success) {
      console.log(`  ✅ SUCCESS - Status: ${result.status}`);
      console.log(`  📄 Response: ${result.data}`);
    } else {
      console.log(`  ❌ FAILED - Error: ${result.error}`);
    }
  }
  
  console.log('\n🎯 Recommendations:');
  console.log('===================');
  console.log('If localhost works but network IP fails:');
  console.log('  1. Check Windows Firewall settings');
  console.log('  2. Ensure backend is binding to 0.0.0.0 (all interfaces)');
  console.log('  3. Check if antivirus is blocking connections');
}

main().catch(console.error);
