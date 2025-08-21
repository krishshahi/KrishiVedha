const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = 'AgriTech_2024_SecureKey';

async function debugAuth() {
  console.log('=== AUTH DEBUG UTILITY ===');
  
  try {
    // Check userToken
    const userToken = await AsyncStorage.getItem('userToken');
    console.log('1. userToken:', userToken ? userToken.substring(0, 50) + '...' : 'not found');
    
    // Check auth_tokens
    const authTokens = await AsyncStorage.getItem('auth_tokens');
    console.log('2. auth_tokens (encrypted):', authTokens ? 'found' : 'not found');
    
    if (authTokens) {
      try {
        const bytes = CryptoJS.AES.decrypt(authTokens, ENCRYPTION_KEY);
        const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        console.log('   Decrypted auth_tokens:', {
          hasAuthToken: !!decrypted.authToken,
          hasRefreshToken: !!decrypted.refreshToken,
          timestamp: new Date(decrypted.timestamp).toISOString(),
          ageHours: ((Date.now() - decrypted.timestamp) / (1000 * 60 * 60)).toFixed(2)
        });
        
        if (decrypted.authToken) {
          console.log('   Auth token preview:', decrypted.authToken.substring(0, 50) + '...');
        }
      } catch (err) {
        console.log('   Failed to decrypt auth_tokens:', err.message);
      }
    }
    
    // Check userData
    const userData = await AsyncStorage.getItem('userData');
    console.log('3. userData:', userData ? 'found' : 'not found');
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('   User info:', {
          id: user.id,
          name: user.name,
          email: user.email,
          hasPreferences: !!user.preferences
        });
      } catch (err) {
        console.log('   Failed to parse userData:', err.message);
      }
    }
    
    // Check user_data (encrypted)
    const encryptedUserData = await AsyncStorage.getItem('user_data');
    console.log('4. user_data (encrypted):', encryptedUserData ? 'found' : 'not found');
    
    // Token comparison
    if (userToken && authTokens) {
      try {
        const bytes = CryptoJS.AES.decrypt(authTokens, ENCRYPTION_KEY);
        const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        console.log('5. Token match:', userToken === decrypted.authToken ? 'YES' : 'NO');
        if (userToken !== decrypted.authToken) {
          console.log('   userToken length:', userToken.length);
          console.log('   authToken length:', decrypted.authToken.length);
        }
      } catch (err) {
        console.log('5. Cannot compare tokens due to decryption error');
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

// Test token validation
async function testTokenValidation() {
  console.log('\n=== TOKEN VALIDATION TEST ===');
  
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      console.log('No userToken found for validation');
      return;
    }
    
    console.log('Testing token:', userToken.substring(0, 50) + '...');
    
    const response = await fetch('http://localhost:3000/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });
    
    console.log('Validation response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Token is valid');
    } else {
      const errorData = await response.text();
      console.log('❌ Token validation failed:', errorData);
    }
    
  } catch (error) {
    console.error('Token validation test failed:', error);
  }
}

module.exports = { debugAuth, testTokenValidation };

if (require.main === module) {
  debugAuth().then(() => testTokenValidation());
}
