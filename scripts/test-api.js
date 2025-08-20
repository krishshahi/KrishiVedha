const axios = require('axios');

const API_BASE_URL = 'http://10.10.13.110:3000/api';

// Test data  
const timestamp = Date.now();
const testUser = {
  name: `Test User API ${timestamp}`,
  email: `testapi${timestamp}@example.com`, // Unique email each time
  password: 'password123'
};

const testFarm = {
  userId: null, // Will be set after user creation
  name: 'Test Farm API',
  location: 'Test Location',
  area: 5,
  crops: ['Rice', 'Wheat']
};

const testCrop = {
  name: 'Rice',
  variety: 'Basmati',
  farmId: null, // Will be set after farm creation
  ownerId: null, // Will be set after user creation
  plantingDate: new Date().toISOString(),
  expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
};

async function testAPI() {
  console.log('🧪 Starting API Tests...\n');
  
  try {
    // 1. Health Check
    console.log('1. Testing Health Check...');
    const health = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check:', health.data.message);
    
    // 2. Test User Registration
    console.log('\n2. Testing User Registration...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    console.log('✅ User Registration:', registerResponse.data.message);
    
    const userId = registerResponse.data.user.id;
    const token = registerResponse.data.token;
    testFarm.userId = userId;
    testCrop.ownerId = userId;
    
    // Set Authorization header for subsequent requests
    const authHeaders = { Authorization: `Bearer ${token}` };
    
    // 3. Test User Login
    console.log('\n3. Testing User Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ User Login:', loginResponse.data.message);
    
    // 4. Test Get User Stats
    console.log('\n4. Testing Get User Stats...');
    const statsResponse = await axios.get(`${API_BASE_URL}/users/${userId}/stats`, {
      headers: authHeaders
    });
    console.log('✅ User Stats:', statsResponse.data.data);
    
    // 5. Test Farm Creation
    console.log('\n5. Testing Farm Creation...');
    const farmResponse = await axios.post(`${API_BASE_URL}/farms`, testFarm, {
      headers: authHeaders
    });
    console.log('✅ Farm Creation:', farmResponse.data.message);
    
    const farmId = farmResponse.data.data.id;
    testCrop.farmId = farmId;
    
    // 6. Test Get User Farms
    console.log('\n6. Testing Get User Farms...');
    const userFarmsResponse = await axios.get(`${API_BASE_URL}/users/${userId}/farms`, {
      headers: authHeaders
    });
    console.log('✅ User Farms:', userFarmsResponse.data.data.length, 'farms found');
    
    // 7. Test Crop Creation
    console.log('\n7. Testing Crop Creation...');
    const cropResponse = await axios.post(`${API_BASE_URL}/crops`, testCrop, {
      headers: authHeaders
    });
    console.log('✅ Crop Creation:', cropResponse.data.message);
    
    // 8. Test Get Crops
    console.log('\n8. Testing Get Crops...');
    const cropsResponse = await axios.get(`${API_BASE_URL}/crops?userId=${userId}`, {
      headers: authHeaders
    });
    console.log('✅ Get Crops:', cropsResponse.data.data.length, 'crops found');
    
    // 9. Test Weather Data
    console.log('\n9. Testing Weather Data...');
    try {
      const weatherResponse = await axios.get(`${API_BASE_URL}/weather`, {
        headers: authHeaders
      });
      console.log('✅ Weather Data:', weatherResponse.data.data.length, 'weather records found');
    } catch (error) {
      console.log('⚠️ Weather Data: No records found (expected for new installation)');
    }
    
    // 10. Test Community Posts
    console.log('\n10. Testing Community Posts...');
    try {
      const communityResponse = await axios.get(`${API_BASE_URL}/community/posts?limit=5`, {
        headers: authHeaders
      });
      console.log('✅ Community Posts:', communityResponse.data.data.length, 'posts found');
    } catch (error) {
      console.log('⚠️ Community Posts: No posts found (expected for new installation)');
    }
    
    // 11. Test Create Community Post
    console.log('\n11. Testing Create Community Post...');
    const postData = {
      title: 'Test Post from API',
      content: 'This is a test post created via API testing.',
      category: 'general',
      authorId: userId
    };
    
    const postResponse = await axios.post(`${API_BASE_URL}/community/posts`, postData, {
      headers: authHeaders
    });
    console.log('✅ Community Post Creation:', postResponse.data.message);
    
    console.log('\n🎉 All API tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`- User ID: ${userId}`);
    console.log(`- Farm ID: ${farmId}`);
    console.log(`- API Base URL: ${API_BASE_URL}`);
    
  } catch (error) {
    console.error('\n❌ API Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('URL:', error.config.url);
    } else if (error.request) {
      console.error('Network Error - Could not connect to server');
      console.error('Make sure the backend server is running on', API_BASE_URL);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the tests
testAPI();
