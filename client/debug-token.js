#!/usr/bin/env node

// Debug script to test JWT token and server communication

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGE2OWE2YjBkY2NlMGM3OTFkYjBiZWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NTU3Nzg1ODAsImV4cCI6MTc1NTg2NDk4MH0.PjzoOLklBpNYLMGbTj8fO8vAO5kzgXDr-L8eAnyBLGo';
const serverUrl = 'http://10.10.13.97:3000';

// Decode JWT payload
console.log('=== JWT TOKEN ANALYSIS ===');
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
console.log('User ID:', payload.userId);
console.log('Email:', payload.email);
console.log('Issued at:', new Date(payload.iat * 1000).toISOString());
console.log('Expires at:', new Date(payload.exp * 1000).toISOString());
console.log('Token expired?', Date.now() > payload.exp * 1000);
console.log('');

// Test different endpoints
async function testEndpoint(path, method = 'GET', data = null) {
  try {
    console.log(`Testing ${method} ${path}...`);
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${serverUrl}/api${path}`, options);
    const responseData = await response.text();
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Response: ${responseData.substring(0, 200)}${responseData.length > 200 ? '...' : ''}`);
    console.log('');
    
    return { status: response.status, data: responseData };
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    console.log('');
    return { error: error.message };
  }
}

async function runTests() {
  console.log('=== SERVER ENDPOINT TESTS ===');
  
  // Test health endpoint (no auth required)
  await testEndpoint('/health');
  
  // Test farms endpoint (requires auth)
  await testEndpoint('/farms');
  
  // Test farms with explicit userId
  await testEndpoint(`/farms?userId=${payload.userId}`);
  
  // Test crops endpoint
  await testEndpoint('/crops');
  
  // Test crops for specific farm
  await testEndpoint('/crops?farmId=68a69a680dcce0c791db0bed');
  
  // Test login endpoint to see if it works
  await testEndpoint('/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'password123'
  });
}

runTests().catch(console.error);
