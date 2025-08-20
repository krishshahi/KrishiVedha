const fs = require('fs');
const os = require('os');
const path = require('path');

function getCurrentIP() {
  const interfaces = os.networkInterfaces();
  
  // Get all IPv4 addresses
  for (const interfaceName in interfaces) {
    const interfaceList = interfaces[interfaceName];
    for (const iface of interfaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prefer WiFi or Ethernet interfaces
        if (interfaceName.toLowerCase().includes('wi-fi') || 
            interfaceName.toLowerCase().includes('ethernet') ||
            interfaceName.toLowerCase().includes('wlan') ||
            interfaceName.toLowerCase().includes('eth')) {
          return iface.address;
        }
      }
    }
  }
  
  // Fallback to first non-internal IPv4
  for (const interfaceName in interfaces) {
    const interfaceList = interfaces[interfaceName];
    for (const iface of interfaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

function updateAppJson() {
  const currentIP = getCurrentIP();
  const apiUrl = `http://${currentIP}:3000/api`;
  
  console.log(`🔍 Detected IP: ${currentIP}`);
  console.log(`🔧 API URL: ${apiUrl}`);
  
  // Update client app.json
  const appJsonPath = path.join(__dirname, '..', 'client', 'app.json');
  
  try {
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(appJsonContent);
    
    // Update the API URL
    if (!appJson.expo.extra) {
      appJson.expo.extra = {};
    }
    appJson.expo.extra.REACT_NATIVE_API_URL = apiUrl;
    
    // Write back to file
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    
    console.log(`✅ Updated app.json with API URL: ${apiUrl}`);
    
    return { success: true, ip: currentIP, apiUrl };
  } catch (error) {
    console.error('❌ Error updating app.json:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the update
if (require.main === module) {
  console.log('🚀 Updating API configuration...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = updateAppJson();
  
  if (result.success) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Configuration updated successfully!');
    console.log('');
    console.log('📱 Next steps:');
    console.log('1. Restart your Expo development server');
    console.log('2. Reload your mobile app');
    console.log('3. The app should now connect successfully');
    console.log('');
    console.log('🌐 Network URLs:');
    console.log(`   API: ${result.apiUrl}`);
    console.log(`   Health Check: ${result.apiUrl}/health`);
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ Configuration update failed!');
    console.log('Error:', result.error);
  }
}

module.exports = { getCurrentIP, updateAppJson };
