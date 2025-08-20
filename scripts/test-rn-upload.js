// Test script to verify React Native FormData upload fix
const axios = require('axios');

// Mock React Native FormData request
const testReactNativeUpload = async () => {
  try {
    console.log('🧪 Testing React Native FormData upload...');
    
    // This mimics what React Native sends
    const reactNativeFormData = {
      image: {
        uri: 'file:///data/user/0/host.exp.exponent/cache/ImageManipulator/test-image.jpg',
        type: 'image/jpeg',
        name: 'test-crop-image.jpg'
      },
      caption: 'Test image upload from React Native',
      stage: 'growing'
    };

    const response = await axios.post('http://localhost:3000/api/crops/688b6c2309ba1fe761e80a48/images', reactNativeFormData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('✅ React Native upload test successful!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ React Native upload test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
};

// Run the test
if (require.main === module) {
  testReactNativeUpload().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testReactNativeUpload };
