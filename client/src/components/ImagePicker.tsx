import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePickerExpo from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { COLORS } from '../constants/colors';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 3; // 3 images per row with margins

interface ImagePickerProps {
  cropId?: string;
  onImagesUpdated?: (images: CropImage[]) => void;
  maxImages?: number;
  style?: any;
}

interface CropImage {
  id: string;
  url: string;
  filename: string;
  uploadedAt: string;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ 
  cropId, 
  onImagesUpdated, 
  maxImages = 10,
  style 
}) => {
  const [images, setImages] = useState<CropImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (cropId) {
      loadCropImages();
    }
  }, [cropId]);

  const loadCropImages = async () => {
    if (!cropId) return;
    
    try {
      setLoading(true);
      console.log('📷 Loading images for crop ID:', cropId);
      const response = await apiService.getCropImages(cropId);
      if (response.success) {
        console.log('📷 Loaded crop images response:', response.data);
        console.log('📷 Image IDs:', response.data.map(img => ({ id: img.id, url: img.url })));
        setImages(response.data);
        onImagesUpdated?.(response.data);
      }
    } catch (error) {
      console.error('Failed to load crop images:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePickerExpo.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'We need camera and photo library permissions to add crop images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Crop Photo',
      'Choose how you want to add a photo',
      [
        {
          text: 'Camera',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Photo Library',
          onPress: () => pickImage('library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    if (images.length >= maxImages) {
      Alert.alert(
        'Maximum Images Reached',
        `You can only add up to ${maxImages} images per crop.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      let result;
      
      if (source === 'camera') {
        result = await ImagePickerExpo.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePickerExpo.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          allowsMultipleSelection: false,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await processAndUploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const processAndUploadImage = async (asset: any) => {
    try {
      setUploading(true);

      // Resize and compress image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 800, height: 600 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Create FormData
      const formData = new FormData();
      const filename = `crop_${Date.now()}.jpg`;
      
      formData.append('image', {
        uri: manipulatedImage.uri,
        type: 'image/jpeg',
        name: filename,
      } as any);

      let response;
      if (cropId) {
        // Upload directly to crop
        response = await apiService.addImageToCrop(cropId, formData);
      } else {
        // General upload
        response = await apiService.uploadImage(formData);
      }

      if (response.success) {
        const newImage = response.data;
        console.log('✅ New image uploaded:', newImage);
        console.log('✅ New image ID:', newImage.id);
        const updatedImages = [...images, newImage];
        setImages(updatedImages);
        onImagesUpdated?.(updatedImages);
        
        Alert.alert('Success', 'Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!cropId) return;

    console.log('🗑️ Delete image called with ID:', imageId);
    console.log('🗑️ Available images:', images.map(img => ({ id: img.id, url: img.url })));

    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Calling deleteCropImage with cropId:', cropId, 'imageId:', imageId);
              await apiService.deleteCropImage(cropId, imageId);
              const updatedImages = images.filter(img => img.id !== imageId);
              setImages(updatedImages);
              onImagesUpdated?.(updatedImages);
              Alert.alert('Success', 'Image deleted successfully!');
            } catch (error) {
              console.error('Error deleting image:', error);
              Alert.alert('Error', 'Failed to delete image. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getImageUrl = (imagePath: string) => {
    return apiService.getImageUrl(imagePath);
  };

  return (
    <View style={[styles.container, style]}>
      {loading ? (
        // Loading State
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading images...</Text>
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Crop Photos</Text>
            <Text style={styles.subtitle}>
              {images.length} of {maxImages} images
            </Text>
          </View>

          {/* Images Grid */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.imagesContainer}
            contentContainerStyle={styles.imagesContent}
          >
            {/* Add Image Button */}
            {images.length < maxImages && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={showImagePickerOptions}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons name="camera" size={32} color={COLORS.primary} />
                    <Text style={styles.addImageText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

        {/* Existing Images */}
        {images.map((image, index) => (
          <View key={image.id || image.url || `image-${index}`} style={styles.imageContainer}>
            <Image
              source={{ uri: getImageUrl(image.url) }}
              style={styles.image}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.deleteImageButton}
              onPress={() => deleteImage(image.id)}
            >
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
          </ScrollView>

          {/* Upload Status */}
          {uploading && (
            <View style={styles.uploadStatus}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.uploadText}>Uploading image...</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = {
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  imagesContainer: {
    marginBottom: 8,
  },
  imagesContent: {
    paddingHorizontal: 4,
  },
  addImageButton: {
    width: imageSize,
    height: imageSize,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed' as const,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  addImageText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500' as const,
  },
  imageContainer: {
    position: 'relative' as const,
    marginRight: 12,
  },
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  deleteImageButton: {
    position: 'absolute' as const,
    top: -8,
    right: -8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  uploadStatus: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 8,
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
};

export default ImagePicker;
