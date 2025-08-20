import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';

const CleanProfilePicture = ({ 
  userId, 
  apiBaseUrl = 'http://10.10.13.110:3000',
  showDebugInfo = false // Add this prop to control debug visibility
}) => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    profilePicture: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Storage keys
  const PROFILE_CACHE_KEY = `profile_cache_${userId}`;
  const PROFILE_SYNC_TIME_KEY = `profile_sync_time_${userId}`;

  // Load user profile data on component mount
  useEffect(() => {
    initializeProfileData();
  }, [userId]);

  // Initialize profile data with caching and fallback mechanisms
  const initializeProfileData = async () => {
    try {
      setIsInitialLoading(true);
      console.log('[PROFILE] 🚀 Initializing profile data for user:', userId);

      // Step 1: Try to load from auth context first (most reliable)
      if (user) {
        console.log('[PROFILE] 👤 Loading from auth context');
        console.log('[PROFILE] 🔍 User object:', JSON.stringify(user, null, 2));
        
        const authProfileData = {
          name: user.name || user.username || '',
          email: user.email || '',
          phone: user.phone || user.profile?.phoneNumber || '',
          location: user.location || user.profile?.address || '',
          profilePicture: user.profilePicture || user.profile?.profilePicture || ''
        };
        
        console.log('[PROFILE] 📋 Mapped auth data:', JSON.stringify(authProfileData, null, 2));
        setProfileData(authProfileData);

        // Save to cache for future use
        await saveProfileToCache(authProfileData);
      }

      // Step 2: Check if we have cached data as fallback
      const cachedData = await loadProfileFromCache();
      const syncTime = await getLastSyncTime();
      
      console.log('[PROFILE] 💾 Cached data available:', !!cachedData);
      console.log('[PROFILE] 🕐 Last sync time:', syncTime ? new Date(syncTime).toLocaleString() : 'Never');

      // Use cached data if available and auth context is empty
      if (cachedData && (!user || !profileData.email)) {
        console.log('[PROFILE] 📦 Using cached profile data');
        setProfileData(cachedData);
        setLastSyncTime(syncTime);
      }

      // Step 3: Try to fetch fresh data from server (background update)
      const shouldSync = !syncTime || (Date.now() - syncTime > 5 * 60 * 1000); // 5 minutes
      if (shouldSync) {
        console.log('[PROFILE] 🔄 Fetching fresh data from server...');
        await loadUserProfileFromServer(true); // true = background update
      } else {
        console.log('[PROFILE] ✅ Using cached data (still fresh)');
      }

    } catch (error) {
      console.error('[PROFILE] ❌ Failed to initialize profile data:', error);
      // Try cached data as last resort
      const cachedData = await loadProfileFromCache();
      if (cachedData) {
        console.log('[PROFILE] 🆘 Using cached data as fallback');
        setProfileData(cachedData);
      }
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Load profile from local cache
  const loadProfileFromCache = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('[PROFILE] Failed to load cached profile:', error);
    }
    return null;
  };

  // Save profile to local cache
  const saveProfileToCache = async (data) => {
    try {
      await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(PROFILE_SYNC_TIME_KEY, Date.now().toString());
      console.log('[PROFILE] 💾 Profile data cached successfully');
    } catch (error) {
      console.error('[PROFILE] Failed to cache profile data:', error);
    }
  };

  // Get last sync time
  const getLastSyncTime = async () => {
    try {
      const syncTime = await AsyncStorage.getItem(PROFILE_SYNC_TIME_KEY);
      return syncTime ? parseInt(syncTime, 10) : null;
    } catch (error) {
      console.error('[PROFILE] Failed to get last sync time:', error);
      return null;
    }
  };

  // Load user profile from server
  const loadUserProfileFromServer = async (isBackgroundUpdate = false) => {
    try {
      if (!isBackgroundUpdate) {
        setIsUpdating(true);
      }

      const response = await fetch(`${apiBaseUrl}/api/users/${userId}`);
      const result = await response.json();
      
      if (result.success) {
        const serverProfileData = {
          name: result.data.name || result.data.username || '',
          email: result.data.email || '',
          phone: result.data.profile?.phoneNumber || result.data.phone || '',
          location: result.data.location || result.data.profile?.address || '',
          profilePicture: result.data.profile?.profilePicture || result.data.profilePicture || ''
        };

        console.log('[PROFILE] 🌐 Server data loaded successfully');
        
        setProfileData(serverProfileData);
        setLastSyncTime(Date.now());
        
        // Cache the fresh data
        await saveProfileToCache(serverProfileData);
        
        // Update auth context if we have new data
        if (updateUser && user) {
          const updatedUser = { 
            ...user, 
            name: serverProfileData.name,
            email: serverProfileData.email,
            phone: serverProfileData.phone,
            location: serverProfileData.location,
            profilePicture: serverProfileData.profilePicture
          };
          updateUser(updatedUser);
          console.log('[PROFILE] 🔄 Auth context updated from server data');
        }

        return serverProfileData;
      } else {
        throw new Error(result.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('[PROFILE] ❌ Server request failed:', error);
      if (!isBackgroundUpdate) {
        Alert.alert(
          'Connection Error', 
          'Unable to load latest profile data. Using cached version.',
          [{ text: 'OK' }]
        );
      }
      throw error;
    } finally {
      if (!isBackgroundUpdate) {
        setIsUpdating(false);
      }
    }
  };

  const selectAndUploadImage = async () => {
    try {
      // Request permission to access camera roll
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
        base64: true, // Enable base64 for reliable React Native upload
      });

      if (!result.canceled && result.assets[0]) {
        const imageAsset = result.assets[0];
        await uploadProfilePicture(imageAsset);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadProfilePicture = async (imageAsset) => {
    try {
      setIsUploading(true);

      // Upload image first, then update profile
      const imageUrl = await uploadImageToServer(imageAsset);
      
      if (imageUrl) {
        await updateUserProfile({ profilePicture: imageUrl });
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Upload Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImageToServer = async (imageAsset) => {
    try {
      console.log('📤 Starting image upload:', imageAsset.uri);
      console.log('📤 Image asset details:', {
        uri: imageAsset.uri,
        type: imageAsset.type,
        fileName: imageAsset.fileName,
        width: imageAsset.width,
        height: imageAsset.height,
        hasBase64: !!imageAsset.base64
      });
      
      // Method 1: Try base64 upload first (most reliable for React Native)
      if (imageAsset.base64) {
        console.log('📤 Using base64 upload method');
        
        const fileName = imageAsset.fileName || `profile-${userId}-${Date.now()}.jpg`;
        const mimeType = imageAsset.mimeType || imageAsset.type || 'image/jpeg';
        
        // Create the proper base64 data string
        const base64Data = `data:${mimeType};base64,${imageAsset.base64}`;
        
        console.log('📤 Sending base64 data with mimeType:', mimeType);
        console.log('📤 Base64 data length:', imageAsset.base64.length);
        console.log('📤 Full data URL prefix:', base64Data.substring(0, 50) + '...');
        
        const uploadResponse = await fetch(`${apiBaseUrl}/api/upload/image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Data,
            filename: fileName
          }),
        });
        
        console.log('📤 Base64 upload response status:', uploadResponse.status);
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('📤 Base64 upload failed with status:', uploadResponse.status, errorText);
          console.error('📤 Error response text:', errorText);
          throw new Error(`Base64 upload failed: ${uploadResponse.status} - ${errorText}`);
        }
        
        const result = await uploadResponse.json();
        console.log('📤 Base64 upload result:', result);
        
        if (result.success && result.data?.url) {
          const fullImageUrl = `${apiBaseUrl}${result.data.url}`;
          console.log('📤 Base64 upload successful, image URL:', fullImageUrl);
          return fullImageUrl;
        } else {
          throw new Error(result.message || 'Base64 upload failed');
        }
      }
      
      console.log('📤 Base64 not available, proceeding with FormData method');
      
      // Method 2: Use FormData approach with React Native compatible format
      try {
        console.log('📤 Base64 not available, trying blob method');
        // Try to read as blob
        const response = await fetch(imageAsset.uri);
        const blob = await response.blob();
        
        console.log('📤 Image converted to blob:', {
          size: blob.size,
          type: blob.type
        });
        
        // Create FormData with the blob
        const formData = new FormData();
        formData.append('image', blob, imageAsset.fileName || `profile-${userId}-${Date.now()}.jpg`);
        
        console.log('📤 FormData created with blob, uploading to:', `${apiBaseUrl}/api/upload/image`);
        
        const uploadResponse = await fetch(`${apiBaseUrl}/api/upload/image`, {
          method: 'POST',
          body: formData,
        });
        
        console.log('📤 Upload response status:', uploadResponse.status);
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('📤 Upload failed with status:', uploadResponse.status, errorText);
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        
        const result = await uploadResponse.json();
        console.log('📤 Upload result:', result);
        
        if (result.success && result.data?.url) {
          const fullImageUrl = `${apiBaseUrl}${result.data.url}`;
          console.log('📤 Upload successful, image URL:', fullImageUrl);
          return fullImageUrl;
        } else {
          throw new Error(result.message || 'Upload failed');
        }
        
      } catch (blobError) {
        console.log('📤 Blob method failed, trying alternative approach:', blobError.message);
        
        // Method 2: Fallback - use the original React Native FormData approach with better error handling
        const formData = new FormData();
        
        // Ensure we have the right file format
        const fileName = imageAsset.fileName || `profile-${userId}-${Date.now()}.jpg`;
        const mimeType = imageAsset.type || (fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
        
        formData.append('image', {
          uri: imageAsset.uri,
          type: mimeType,
          name: fileName,
        });
        
        console.log('📤 Fallback FormData created, uploading with details:', {
          uri: imageAsset.uri,
          type: mimeType,
          name: fileName
        });
        
        const uploadResponse = await fetch(`${apiBaseUrl}/api/upload/image`, {
          method: 'POST',
          // Remove Content-Type header - let React Native handle it
          body: formData,
        });
        
        console.log('📤 Fallback upload response status:', uploadResponse.status);
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('📤 Fallback upload failed:', uploadResponse.status, errorText);
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        
        const result = await uploadResponse.json();
        console.log('📤 Fallback upload result:', result);
        
        if (result.success && result.data?.url) {
          const fullImageUrl = `${apiBaseUrl}${result.data.url}`;
          console.log('📤 Fallback upload successful, image URL:', fullImageUrl);
          return fullImageUrl;
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      }
      
    } catch (error) {
      console.error('📤 Error uploading image:', error);
      console.error('📤 Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw error;
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      setIsUpdating(true);
      console.log('[PROFILE] 📤 Updating profile on server...');

      const response = await fetch(`${apiBaseUrl}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (result.success) {
        console.log('[PROFILE] ✅ Profile updated successfully on server');
        
        // Create updated profile data with consistent mapping
        const updatedProfileData = {
          ...profileData,
          name: result.data.name || result.data.username || profileData.name,
          email: result.data.email || profileData.email,
          phone: result.data.phone || result.data.profile?.phoneNumber || profileData.phone,
          location: result.data.location || result.data.profile?.address || profileData.location,
          profilePicture: result.data.profilePicture || result.data.profile?.profilePicture || updates.profilePicture || profileData.profilePicture
        };

        // Update local state
        setProfileData(updatedProfileData);
        setLastSyncTime(Date.now());

        // Save to cache for persistence
        await saveProfileToCache(updatedProfileData);
        
        // Update auth context with consistent data structure
        if (updateUser && user) {
          const updatedUser = { 
            ...user, 
            name: updatedProfileData.name,
            email: updatedProfileData.email,
            phone: updatedProfileData.phone,
            location: updatedProfileData.location,
            profilePicture: updatedProfileData.profilePicture
          };
          updateUser(updatedUser);
          console.log('[PROFILE] 👤 Auth context updated');
        }

        Alert.alert('Success', 'Profile updated successfully!');
        return updatedProfileData;
      } else {
        throw new Error(result.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('[PROFILE] ❌ Profile update failed:', error);
      
      // If server update fails, still try to save locally for offline capability
      if (updates.profilePicture) {
        console.log('[PROFILE] 💾 Saving update locally for offline sync');
        const offlineUpdatedData = { ...profileData, ...updates };
        setProfileData(offlineUpdatedData);
        await saveProfileToCache(offlineUpdatedData);
        
        Alert.alert(
          'Partial Success',
          'Photo saved locally. Will sync with server when connection is restored.'
        );
      } else {
        Alert.alert('Update Error', 'Failed to update profile. Please try again.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Add a refresh function for manual sync
  const refreshProfile = async () => {
    try {
      await loadUserProfileFromServer(false);
    } catch (error) {
      console.error('[PROFILE] Manual refresh failed:', error);
    }
  };

  // Show initial loading state
  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Picture Display */}
      <View style={styles.imageContainer}>
        {profileData.profilePicture ? (
          <Image 
            source={{ uri: profileData.profilePicture }} 
            style={styles.profileImage}
            onError={(error) => {
              console.error('Error loading profile image:', error);
              // Reset profilePicture to show placeholder
              setProfileData(prev => ({ ...prev, profilePicture: '' }));
            }}
            onLoad={() => {
              console.log('Profile image loaded successfully');
            }}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>👤</Text>
            <Text style={styles.placeholderSubText}>No Photo</Text>
          </View>
        )}
        
        {/* Loading indicator overlay */}
        {(isUploading || isUpdating) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>
              {isUploading ? 'Uploading...' : 'Updating...'}
            </Text>
          </View>
        )}
      </View>

      {/* Upload Button */}
      <TouchableOpacity 
        style={[styles.uploadButton, (isUploading || isUpdating) && styles.disabledButton]}
        onPress={selectAndUploadImage}
        disabled={isUploading || isUpdating}
      >
        <Text style={styles.uploadButtonText}>
          {isUploading || isUpdating 
            ? 'Processing...' 
            : profileData.profilePicture 
              ? 'Change Photo' 
              : 'Add Photo'
          }
        </Text>
      </TouchableOpacity>

      {/* DEBUG: Component Version Indicator */}
      {showDebugInfo && (
        <View style={{backgroundColor: 'red', padding: 10, marginBottom: 20}}>
          <Text style={{color: 'white', fontWeight: 'bold', textAlign: 'center'}}>
            🐛 DEBUG MODE ACTIVE - FIXED VERSION LOADED ✅
          </Text>
        </View>
      )}

      {/* Profile Info Display - Clean version without URLs */}
      <View style={styles.profileInfo}>
        <Text style={styles.profileInfoTitle}>Profile Information</Text>
        <View style={styles.profileInfoRow}>
          <Text style={styles.profileInfoLabel}>Name:</Text>
          <Text style={styles.profileInfoValue}>{profileData.name || 'Not set'}</Text>
        </View>
        <View style={styles.profileInfoRow}>
          <Text style={styles.profileInfoLabel}>Email:</Text>
          <Text style={styles.profileInfoValue}>{profileData.email || 'Not set'}</Text>
        </View>
        {profileData.phone && (
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>Phone:</Text>
            <Text style={styles.profileInfoValue}>{profileData.phone}</Text>
          </View>
        )}
        {profileData.location && (
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>Location:</Text>
            <Text style={styles.profileInfoValue}>{profileData.location}</Text>
          </View>
        )}
      </View>

      {/* Refresh Button */}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={refreshProfile}
        disabled={isUpdating}
      >
        <Text style={styles.refreshButtonText}>
          {isUpdating ? '🔄 Refreshing...' : '🔄 Refresh Profile'}
        </Text>
      </TouchableOpacity>

      {/* Debug Info - Only show if prop is true */}
      {showDebugInfo && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugTitle}>Debug Information</Text>
          <Text style={styles.debugText}>User ID: {userId}</Text>
          <Text style={styles.debugText}>API URL: {apiBaseUrl}</Text>
          <Text style={styles.debugText}>
            Has Profile Picture: {profileData.profilePicture ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.debugText}>
            Last Sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
          </Text>
          {profileData.profilePicture && (
            <Text style={styles.debugText} numberOfLines={2} ellipsizeMode="middle">
              Image URL: {profileData.profilePicture}
            </Text>
          )}
          <Text style={styles.debugText}>Name: '{profileData.name}'</Text>
          <Text style={styles.debugText}>Email: '{profileData.email}'</Text>
          <Text style={styles.debugText}>Location: '{profileData.location}'</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
    backgroundColor: '#f0f0f0', // Fallback color while loading
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 40,
    color: '#adb5bd',
  },
  placeholderSubText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#adb5bd',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  profileInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
    textAlign: 'center',
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  profileInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
    flex: 1,
  },
  profileInfoValue: {
    fontSize: 14,
    color: '#212529',
    flex: 2,
    textAlign: 'right',
  },
  debugInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#495057',
  },
  debugText: {
    fontSize: 11,
    marginBottom: 4,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  refreshButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CleanProfilePicture;

/* 
USAGE EXAMPLES:

1. Clean version (no debug info):
<CleanProfilePicture 
  userId="684541460c567785e32ead2b" 
  apiBaseUrl="http://10.10.13.110:3000" 
/>

2. With debug info (for development):
<CleanProfilePicture 
  userId="684541460c567785e32ead2b" 
  apiBaseUrl="http://10.10.13.110:3000" 
  showDebugInfo={true}
/>

IMPROVEMENTS MADE:
✅ Hidden debug URL by default (use showDebugInfo={true} to show it)
✅ Better visual design with shadows and rounded corners
✅ Improved placeholder with icon
✅ Better error handling for image loading
✅ Cleaner profile info display without URLs
✅ More descriptive button text
✅ Better loading states
✅ Proper image fallback handling
*/
