/**
 * User related type definitions for KrishiVeda app
 */

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  role: UserRole;
  location?: UserLocation;
  farms?: Farm[];
  preferences: UserPreferences;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export type UserRole = 'farmer' | 'expert' | 'admin';

export interface UserLocation {
  district: string;
  province?: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserPreferences {
  language: 'en' | 'ne' | 'hi'; // English, Nepali, Hindi
  measurementUnit: 'metric' | 'imperial';
  notificationsEnabled: boolean;
  weatherAlerts: boolean;
  cropReminders: boolean;
  communityUpdates: boolean;
  theme?: 'light' | 'dark' | 'system';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  phone?: string;
  location?: string; // Backend expects location as a string
  role?: UserRole;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPicture?: string;
  title: string;
  content: string;
  images?: string[];
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPicture?: string;
  content: string;
  likes: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Farm {
  id: string;
  name: string;
  location: {
    address: string;
    coordinates: {
      type: string;
      coordinates: number[];
    };
    country: string;
    state: string;
    city: string;
  };
  size: {
    value: number;
    unit: string;
  };
  farmType: string;
  crops: {
    name: string;
    status: string;
  }[];
  soilData: {
    ph: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    organicMatter: number;
    lastTested: string;
  };
  irrigation: {
    system: string;
    waterSource: string;
  };
}

export interface ExpertAdvice {
  id: string;
  expertId: string;
  expertName: string;
  expertSpecialty: string;
  expertPicture?: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt?: string;
}

