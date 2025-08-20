/**
 * Network connectivity testing utilities
 */

export const testNetworkConnectivity = async (baseUrl: string): Promise<boolean> => {
  try {
    console.log(`🔍 Testing connectivity to: ${baseUrl}`);
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    
    const success = response.ok;
    console.log(`${success ? '✅' : '❌'} Connectivity test result: ${response.status}`);
    
    return success;
  } catch (error) {
    console.error(`❌ Connectivity test failed: ${error.message}`);
    return false;
  }
};

export const testMultipleUrls = async (): Promise<void> => {
  const urls = [
    'http://localhost:3000/api',
    'http://10.0.2.2:3000/api',
    'http://10.10.13.110:3000/api'
  ];
  
  console.log('🔍 Testing multiple network URLs...');
  
  for (const url of urls) {
    await testNetworkConnectivity(url);
  }
};

export const debugNetworkInfo = async (): Promise<void> => {
  console.log('📱 Network Debug Info:');
  console.log('- Platform:', Platform.OS);
  console.log('- Development mode:', __DEV__);
  
  try {
    const netInfo = await NetInfo.fetch();
    console.log('- Network state:', netInfo);
  } catch (error) {
    console.error('- Could not fetch network info:', error);
  }
};
