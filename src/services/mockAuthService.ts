// Mock Authentication Service
// This provides authentication functionality without requiring a backend server

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, User } from '../types/user.types';

// Mock user database
const MOCK_USERS: { [email: string]: { password: string; user: User } } = {
  'demo@example.com': {
    password: 'password123',
    user: {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      location: 'California, USA',
      phone: '+1-555-0123',
      farmCount: 2,
      totalArea: 150
    }
  },
  'farmer@test.com': {
    password: 'farmer123',
    user: {
      id: '2',
      name: 'John Farmer',
      email: 'farmer@test.com',
      location: 'Texas, USA',
      phone: '+1-555-0456',
      farmCount: 1,
      totalArea: 75
    }
  }
};

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockAuthService {
  async login(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
    await delay(1000); // Simulate network delay
    
    const { email, password } = credentials;
    const userRecord = MOCK_USERS[email.toLowerCase()];
    
    if (!userRecord) {
      throw new Error('User not found');
    }
    
    if (userRecord.password !== password) {
      throw new Error('Invalid password');
    }
    
    // Generate a mock JWT token
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      token,
      user: userRecord.user
    };
  }
  
  async register(data: RegisterData): Promise<{ token: string; user: User }> {
    await delay(1500); // Simulate network delay
    
    const { email, password, name, location, phone } = data;
    
    // Check if user already exists
    if (MOCK_USERS[email.toLowerCase()]) {
      throw new Error('User already exists with this email');
    }
    
    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      location: location || 'Unknown Location',
      phone,
      farmCount: 0,
      totalArea: 0
    };
    
    // Add to mock database
    MOCK_USERS[email.toLowerCase()] = {
      password,
      user: newUser
    };
    
    // Generate a mock JWT token
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      token,
      user: newUser
    };
  }
  
  async validateToken(token: string): Promise<boolean> {
    await delay(500);
    // Simple token validation - in a real app this would verify JWT
    return token.startsWith('mock_token_');
  }
  
  async refreshToken(token: string): Promise<string> {
    await delay(500);
    const isValid = await this.validateToken(token);
    if (!isValid) {
      throw new Error('Invalid token');
    }
    
    // Generate a new token
    return `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async getCurrentUser(token: string): Promise<User> {
    await delay(500);
    
    const isValid = await this.validateToken(token);
    if (!isValid) {
      throw new Error('Invalid token');
    }
    
    // In a real app, you'd decode the token to get user info
    // For now, return the demo user
    return MOCK_USERS['demo@example.com'].user;
  }
  
  async logout(): Promise<void> {
    await delay(300);
    // In a real app, you might invalidate the token on the server
    // For mock service, we just simulate the delay
  }
  
  // Helper method to get all users for testing
  getAllUsers(): User[] {
    return Object.values(MOCK_USERS).map(record => record.user);
  }
  
  // Helper method to reset users for testing
  resetUsers(): void {
    // Reset to initial state if needed
  }
}

export default new MockAuthService();

