import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Platform } from 'react-native';
import apiService from './apiService';

export interface ImageUploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export interface CropImage {
  id: string;
  url: string;
  caption: string;
  stage: string;
  uploadDate: string;
  filename?: string;
  uploadedAt?: string;
}

export class ImageService {
  
  /**
   * Request camera and media library permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to upload images.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Request camera permissions
   */
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your camera to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Pick image from gallery
   */
  static async pickImageFromGallery(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
      return null;
    }
  }

  /**
   * Take photo with camera
   */
  static async takePhotoWithCamera(): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Error taking photo with camera:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    }
  }

  /**
   * Show image picker options (camera or gallery)
   */
  static async showImagePicker(): Promise<string | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Image',
        'Choose how you want to add an image',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const uri = await this.takePhotoWithCamera();
              resolve(uri);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const uri = await this.pickImageFromGallery();
              resolve(uri);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true }
      );
    });
  }

  /**
   * Compress and resize image
   */
  static async compressImage(uri: string, quality: number = 0.7): Promise<string> {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], // Resize to max width of 1024px
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri; // Return original URI if compression fails
    }
  }

  /**
   * Upload single image to server
   */
  static async uploadImage(imageUri: string): Promise<ImageUploadResult | null> {
    try {
      // Compress image before uploading
      const compressedUri = await this.compressImage(imageUri);

      // Create FormData
      const formData = new FormData();
      
      // Get file extension
      const uriParts = compressedUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      
      formData.append('image', {
        uri: compressedUri,
        type: `image/${fileExtension}`,
        name: `image_${Date.now()}.${fileExtension}`,
      } as any);

      const response = await apiService.uploadImage(formData);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
      return null;
    }
  }

  /**
   * Upload multiple images to server
   */
  static async uploadMultipleImages(imageUris: string[]): Promise<ImageUploadResult[]> {
    try {
      const uploadPromises = imageUris.map(uri => this.uploadImage(uri));
      const results = await Promise.allSettled(uploadPromises);
      
      return results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<ImageUploadResult>).value);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      return [];
    }
  }

  /**
   * Add image to crop
   */
  static async addImageToCrop(
    cropId: string,
    imageUri: string,
    caption: string = '',
    stage: string = ''
  ): Promise<CropImage | null> {
    try {
      // Compress image before uploading
      const compressedUri = await this.compressImage(imageUri);

      // Create FormData
      const formData = new FormData();
      
      // Get file extension from URI
      const uriParts = compressedUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
      
      // Create file object in the format React Native expects
      const imageFile = {
        uri: compressedUri,
        type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
        name: `crop_${cropId}_${Date.now()}.${fileExtension}`,
      };
      
      console.log('📤 ImageService: Creating FormData with file:', imageFile);
      
      // For React Native, we need to append the file object directly
      formData.append('image', imageFile as any);
      
      if (caption) formData.append('caption', caption);
      if (stage) formData.append('stage', stage);

      const response = await apiService.addImageToCrop(cropId, formData);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to add image to crop');
      }
    } catch (error) {
      console.error('Error adding image to crop:', error);
      Alert.alert('Upload Error', 'Failed to add image to crop. Please try again.');
      return null;
    }
  }

  /**
   * Get crop images
   */
  static async getCropImages(cropId: string): Promise<CropImage[]> {
    try {
      const response = await apiService.getCropImages(cropId);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch crop images');
      }
    } catch (error) {
      console.error('Error fetching crop images:', error);
      return [];
    }
  }

  /**
   * Delete crop image
   */
  static async deleteCropImage(cropId: string, imageId: string): Promise<boolean> {
    try {
      const response = await apiService.deleteCropImage(cropId, imageId);
      return response.success;
    } catch (error) {
      console.error('Error deleting crop image:', error);
      Alert.alert('Delete Error', 'Failed to delete image. Please try again.');
      return false;
    }
  }

  /**
   * Get full image URL from relative path
   */
  static getFullImageUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) {
      return relativePath; // Already a full URL
    }
    
    // Remove leading slash if present
    const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    
    return `${apiService.baseURL}/${cleanPath}`;
  }

  /**
   * Create thumbnail from image URI
   */
  static async createThumbnail(uri: string, size: number = 200): Promise<string> {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: size, height: size } }],
        {
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      return uri; // Return original URI if thumbnail creation fails
    }
  }

  /**
   * Validate image file
   */
  static validateImage(uri: string): boolean {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const lowercaseUri = uri.toLowerCase();
    
    return validExtensions.some(ext => lowercaseUri.includes(ext));
  }

  /**
   * Calculate image file size (estimate)
   */
  static estimateImageSize(uri: string): Promise<number> {
    return new Promise((resolve) => {
      // This is an estimation - actual implementation would require native modules
      // For now, return a reasonable estimate
      resolve(1024 * 1024); // 1MB estimate
    });
  }
}

export default ImageService;
