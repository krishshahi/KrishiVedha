import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, launchCamera, MediaType } from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Picker } from '@react-native-picker/picker';
import aiApiService from '../services/aiApiService';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const DiseaseDetectionScreen = ({ navigation, route }) => {
  const { farmId } = route.params;
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [detection, setDetection] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cropType, setCropType] = useState('corn');
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Get current farm from Redux
  const { currentFarm } = useSelector((state) => state.farm);

  useEffect(() => {
    aiApiService.initialize();
  }, []);

  const requestCameraPermission = async () => {
    const result = await request(PERMISSIONS.ANDROID.CAMERA);
    return result === RESULTS.GRANTED;
  };

  const handleImageSelection = () => {
    setShowImagePicker(true);
  };

  const pickImageFromGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response) => {
      setShowImagePicker(false);
      if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const takePicture = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to take pictures.');
      setShowImagePicker(false);
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchCamera(options, (response) => {
      setShowImagePicker(false);
      if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const analyzeDisease = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select or take a photo first.');
      return;
    }

    setLoading(true);
    try {
      // Convert image to base64
      const imageData = {
        farmId: farmId,
        cropType: cropType,
        imageBuffer: `data:${selectedImage.type};base64,${selectedImage.base64 || ''}`,
        location: {
          latitude: currentFarm?.location?.latitude || 0,
          longitude: currentFarm?.location?.longitude || 0,
          field: 'main_field',
        },
        captureDate: new Date().toISOString(),
        metadata: {
          device: 'smartphone',
          lighting: 'natural',
          distance: 'close',
        },
      };

      const response = await aiApiService.detectPlantDisease(imageData);
      setDetection(response.detection);
      setShowModal(true);
      
      Alert.alert(
        'Analysis Complete!',
        `Found ${response.detection.diseases.length} potential issues`,
        [{ text: 'View Details', onPress: () => setShowModal(true) }]
      );
    } catch (error) {
      console.error('Disease detection failed:', error);
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ImagePickerModal = () => (
    <Modal
      visible={showImagePicker}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowImagePicker(false)}
    >
      <View style={styles.imagePickerOverlay}>
        <View style={styles.imagePickerContainer}>
          <Text style={styles.imagePickerTitle}>Select Image Source</Text>
          
          <TouchableOpacity style={styles.imagePickerOption} onPress={takePicture}>
            <Icon name="camera-alt" size={24} color="#4CAF50" />
            <Text style={styles.imagePickerOptionText}>Take Photo</Text>
            <Icon name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.imagePickerOption} onPress={pickImageFromGallery}>
            <Icon name="photo-library" size={24} color="#4CAF50" />
            <Text style={styles.imagePickerOptionText}>Choose from Gallery</Text>
            <Icon name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.imagePickerCancel}
            onPress={() => setShowImagePicker(false)}
          >
            <Text style={styles.imagePickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const DetectionModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🔬 Disease Analysis Results</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowModal(false)}
          >
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {detection && (
          <ScrollView style={styles.modalContent}>
            {/* Original Image */}
            {selectedImage && (
              <View style={styles.imageSection}>
                <Text style={styles.sectionTitle}>📸 Analyzed Image</Text>
                <Image source={{ uri: selectedImage.uri }} style={styles.analyzedImage} />
              </View>
            )}

            {/* Detection Summary */}
            <LinearGradient
              colors={detection.diseases.length > 0 ? ['#FF9800', '#FF8A65'] : ['#4CAF50', '#66BB6A']}
              style={styles.summaryCard}
            >
              <Icon
                name={detection.diseases.length > 0 ? 'warning' : 'check-circle'}
                size={48}
                color="#fff"
              />
              <Text style={styles.summaryTitle}>
                {detection.diseases.length > 0
                  ? `${detection.diseases.length} Issue(s) Detected`
                  : 'Plant Looks Healthy'}
              </Text>
              <Text style={styles.summarySubtitle}>
                Confidence: {Math.round(detection.confidence * 100)}%
              </Text>
            </LinearGradient>

            {/* Detected Diseases */}
            {detection.diseases.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🦠 Detected Issues</Text>
                {detection.diseases.map((disease, index) => (
                  <View key={index} style={styles.diseaseCard}>
                    <View style={styles.diseaseHeader}>
                      <View style={styles.diseaseInfo}>
                        <Text style={styles.diseaseName}>{disease.name}</Text>
                        <Text style={styles.diseaseType}>{disease.type}</Text>
                      </View>
                      <View style={styles.diseaseConfidence}>
                        <Text style={[
                          styles.diseaseConfidenceText,
                          { color: getSeverityColor(disease.severity) }
                        ]}>
                          {Math.round(disease.confidence * 100)}%
                        </Text>
                        <View style={[
                          styles.severityBadge,
                          { backgroundColor: getSeverityColor(disease.severity) }
                        ]}>
                          <Text style={styles.severityBadgeText}>
                            {disease.severity.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.diseaseDescription}>
                      {disease.description}
                    </Text>

                    {disease.symptoms && (
                      <View style={styles.symptomsContainer}>
                        <Text style={styles.symptomsTitle}>Symptoms:</Text>
                        {disease.symptoms.map((symptom, symIndex) => (
                          <Text key={symIndex} style={styles.symptomItem}>
                            • {symptom}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Treatment Recommendations */}
            {detection.treatments && detection.treatments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💊 Treatment Recommendations</Text>
                {detection.treatments.map((treatment, index) => (
                  <View key={index} style={styles.treatmentCard}>
                    <View style={styles.treatmentHeader}>
                      <Icon name="local-pharmacy" size={20} color="#4CAF50" />
                      <Text style={styles.treatmentTitle}>{treatment.title}</Text>
                      <View style={[
                        styles.treatmentUrgency,
                        { backgroundColor: getUrgencyColor(treatment.urgency) }
                      ]}>
                        <Text style={styles.treatmentUrgencyText}>
                          {treatment.urgency}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.treatmentDescription}>
                      {treatment.description}
                    </Text>
                    {treatment.steps && (
                      <View style={styles.treatmentSteps}>
                        {treatment.steps.map((step, stepIndex) => (
                          <Text key={stepIndex} style={styles.treatmentStep}>
                            {stepIndex + 1}. {step}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Prevention Tips */}
            {detection.prevention && detection.prevention.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🛡️ Prevention Tips</Text>
                <View style={styles.preventionContainer}>
                  {detection.prevention.map((tip, index) => (
                    <View key={index} style={styles.preventionTip}>
                      <Icon name="tips-and-updates" size={16} color="#FFC107" />
                      <Text style={styles.preventionText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={() => {
                  Alert.alert('Success', 'Analysis saved successfully!');
                  setShowModal(false);
                }}
              >
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Save Analysis</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.shareButton]}
                onPress={() => {
                  Alert.alert('Info', 'Share functionality coming soon!');
                }}
              >
                <Icon name="share" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔬 Disease Detection</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Farm Info */}
        <View style={styles.farmInfo}>
          <Icon name="agriculture" size={24} color="#4CAF50" />
          <Text style={styles.farmName}>{currentFarm?.name || 'Current Farm'}</Text>
        </View>

        {/* Crop Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌱 Select Crop Type</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={cropType}
              onValueChange={setCropType}
              style={styles.picker}
            >
              <Picker.Item label="Corn" value="corn" />
              <Picker.Item label="Wheat" value="wheat" />
              <Picker.Item label="Soybeans" value="soybeans" />
              <Picker.Item label="Rice" value="rice" />
              <Picker.Item label="Tomatoes" value="tomatoes" />
              <Picker.Item label="Potatoes" value="potatoes" />
              <Picker.Item label="Cotton" value="cotton" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>

        {/* Image Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 Plant Image</Text>
          <Text style={styles.sectionDescription}>
            Take a clear photo of the affected plant parts or leaves
          </Text>
          
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={handleImageSelection}
              >
                <Icon name="edit" size={16} color="#4CAF50" />
                <Text style={styles.changeImageText}>Change Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePlaceholder}
              onPress={handleImageSelection}
            >
              <Icon name="add-a-photo" size={48} color="#ccc" />
              <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
              <Text style={styles.imagePlaceholderSubtext}>
                Camera or Gallery
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Photo Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tip}>
              <Icon name="wb-sunny" size={16} color="#FFC107" />
              <Text style={styles.tipText}>Use natural lighting when possible</Text>
            </View>
            <View style={styles.tip}>
              <Icon name="center-focus-strong" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>Focus on affected areas clearly</Text>
            </View>
            <View style={styles.tip}>
              <Icon name="crop-free" size={16} color="#2196F3" />
              <Text style={styles.tipText}>Include surrounding healthy areas</Text>
            </View>
            <View style={styles.tip}>
              <Icon name="straighten" size={16} color="#FF9800" />
              <Text style={styles.tipText}>Keep the camera steady</Text>
            </View>
          </View>
        </View>

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.analyzeButton, (!selectedImage || loading) && styles.analyzeButtonDisabled]}
          onPress={analyzeDisease}
          disabled={!selectedImage || loading}
        >
          <LinearGradient
            colors={(!selectedImage || loading) ? ['#ccc', '#aaa'] : ['#FF9800', '#FF8A65']}
            style={styles.analyzeButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="biotech" size={24} color="#fff" />
            )}
            <Text style={styles.analyzeButtonText}>
              {loading ? 'Analyzing...' : 'Analyze Plant Disease'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <ImagePickerModal />
      <DetectionModal />
    </SafeAreaView>
  );
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'high':
    case 'severe':
      return '#F44336';
    case 'medium':
    case 'moderate':
      return '#FF9800';
    case 'low':
    case 'mild':
      return '#FFC107';
    default:
      return '#4CAF50';
  }
};

const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case 'urgent':
    case 'immediate':
      return '#F44336';
    case 'soon':
    case 'high':
      return '#FF9800';
    case 'moderate':
      return '#FFC107';
    case 'low':
      return '#4CAF50';
    default:
      return '#2196F3';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  farmInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  farmName: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  imageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: width - 80,
    height: width - 80,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8f0',
  },
  changeImageText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontWeight: '600',
  },
  imagePlaceholder: {
    height: 200,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  tipsList: {
    marginTop: 8,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  analyzeButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  imagePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: width - 80,
    maxWidth: 300,
  },
  imagePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  imagePickerOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  imagePickerCancel: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  imagePickerCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  imageSection: {
    marginBottom: 20,
  },
  analyzedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  summaryCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  diseaseCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  diseaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  diseaseInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  diseaseType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  diseaseConfidence: {
    alignItems: 'flex-end',
  },
  diseaseConfidenceText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  severityBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  diseaseDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  symptomsContainer: {
    marginTop: 8,
  },
  symptomsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  symptomItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  treatmentCard: {
    backgroundColor: '#f0f8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  treatmentTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  treatmentUrgency: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  treatmentUrgencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  treatmentDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  treatmentSteps: {
    marginTop: 8,
  },
  treatmentStep: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    paddingLeft: 8,
  },
  preventionContainer: {
    marginTop: 8,
  },
  preventionTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
  },
  preventionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  shareButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default DiseaseDetectionScreen;
