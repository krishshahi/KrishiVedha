import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import aiApiService from '../services/aiApiService';
import { useSelector } from 'react-redux';

const YieldPredictionScreen = ({ navigation, route }) => {
  const { farmId } = route.params;
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    farmId: farmId,
    cropType: 'corn',
    soilConditions: {
      ph: 6.5,
      nitrogen: 45,
      phosphorus: 30,
      potassium: 25,
      organicMatter: 3.2,
      moisture: 22,
    },
    weatherData: {
      avgTemperature: 24,
      rainfall: 850,
      humidity: 65,
      sunlight: 8.5,
    },
    farmingPractices: {
      irrigationType: 'drip',
      fertilizerType: 'organic',
      pestControl: 'integrated',
      soilPreparation: 'minimal_till',
    },
    currentGrowthStage: 'flowering',
    plantingDate: '2024-03-15',
    expectedHarvestDate: '2024-08-30',
  });

  // Get current farm from Redux
  const { currentFarm } = useSelector((state) => state.farm);

  useEffect(() => {
    aiApiService.initialize();
  }, []);

  const handleInputChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object' && prev[category] !== null
        ? { ...prev[category], [field]: value }
        : value
    }));
  };

  const generatePrediction = async () => {
    setLoading(true);
    try {
      const response = await aiApiService.predictYield(formData);
      setPrediction(response.prediction);
      setShowModal(true);
      
      Alert.alert(
        'Prediction Complete!',
        `Predicted yield: ${response.prediction.predictedYield} tons/hectare`,
        [{ text: 'View Details', onPress: () => setShowModal(true) }]
      );
    } catch (error) {
      console.error('Yield prediction failed:', error);
      Alert.alert('Error', 'Failed to generate yield prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSliderInput = (label, value, min, max, step, unit, onValueChange) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}{unit}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#4CAF50"
        maximumTrackTintColor="#E0E0E0"
        thumbStyle={styles.sliderThumb}
      />
    </View>
  );

  const renderPickerInput = (label, selectedValue, items, onValueChange) => (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
        >
          {items.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
    </View>
  );

  const PredictionModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🌾 Yield Prediction Results</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowModal(false)}
          >
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {prediction && (
          <ScrollView style={styles.modalContent}>
            {/* Main Prediction */}
            <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.predictionCard}>
              <Icon name="trending-up" size={48} color="#fff" />
              <Text style={styles.predictionValue}>
                {prediction.predictedYield} tons/hectare
              </Text>
              <Text style={styles.predictionLabel}>Predicted Yield</Text>
              <View style={styles.confidenceContainer}>
                <Icon name="verified" size={16} color="#fff" />
                <Text style={styles.confidenceText}>
                  {Math.round(prediction.confidence * 100)}% confidence
                </Text>
              </View>
            </LinearGradient>

            {/* Key Factors */}
            {prediction.factors && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Key Influencing Factors</Text>
                {prediction.factors.map((factor, index) => (
                  <View key={index} style={styles.factorItem}>
                    <View style={styles.factorInfo}>
                      <Text style={styles.factorName}>{factor.name}</Text>
                      <Text style={styles.factorDescription}>{factor.description}</Text>
                    </View>
                    <View style={styles.factorImpact}>
                      <Text style={[
                        styles.factorImpactValue,
                        { color: factor.impact > 0 ? '#4CAF50' : '#F44336' }
                      ]}>
                        {factor.impact > 0 ? '+' : ''}{factor.impact}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {prediction.recommendations && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 AI Recommendations</Text>
                {prediction.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={[
                      styles.recommendationPriority,
                      { backgroundColor: getPriorityColor(rec.priority) }
                    ]}>
                      <Text style={styles.recommendationPriorityText}>
                        {rec.priority.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.recommendationContent}>
                      <Text style={styles.recommendationTitle}>{rec.title}</Text>
                      <Text style={styles.recommendationDescription}>{rec.description}</Text>
                      {rec.expectedImprovement && (
                        <Text style={styles.recommendationImprovement}>
                          Expected improvement: +{rec.expectedImprovement}%
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Weather Impact */}
            {prediction.weatherImpact && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🌤️ Weather Analysis</Text>
                <View style={styles.weatherAnalysis}>
                  <Text style={styles.weatherText}>{prediction.weatherImpact.summary}</Text>
                  <View style={styles.weatherFactors}>
                    {Object.entries(prediction.weatherImpact.factors).map(([key, value]) => (
                      <View key={key} style={styles.weatherFactor}>
                        <Text style={styles.weatherFactorLabel}>{key}</Text>
                        <Text style={[
                          styles.weatherFactorValue,
                          { color: value > 0 ? '#4CAF50' : '#F44336' }
                        ]}>
                          {value > 0 ? '+' : ''}{value}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={() => {
                  // Save prediction logic
                  Alert.alert('Success', 'Prediction saved successfully!');
                  setShowModal(false);
                }}
              >
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Save Prediction</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.shareButton]}
                onPress={() => {
                  // Share prediction logic
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
        <Text style={styles.headerTitle}>🌾 Yield Prediction</Text>
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
          <Text style={styles.sectionTitle}>🌱 Crop Information</Text>
          {renderPickerInput(
            'Crop Type',
            formData.cropType,
            [
              { label: 'Corn', value: 'corn' },
              { label: 'Wheat', value: 'wheat' },
              { label: 'Soybeans', value: 'soybeans' },
              { label: 'Rice', value: 'rice' },
              { label: 'Tomatoes', value: 'tomatoes' },
            ],
            (value) => handleInputChange('cropType', null, value)
          )}

          {renderPickerInput(
            'Current Growth Stage',
            formData.currentGrowthStage,
            [
              { label: 'Seedling', value: 'seedling' },
              { label: 'Vegetative', value: 'vegetative' },
              { label: 'Flowering', value: 'flowering' },
              { label: 'Fruit Development', value: 'fruit_development' },
              { label: 'Maturation', value: 'maturation' },
            ],
            (value) => handleInputChange('currentGrowthStage', null, value)
          )}
        </View>

        {/* Soil Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Soil Conditions</Text>
          {renderSliderInput(
            'pH Level',
            formData.soilConditions.ph,
            4.0,
            9.0,
            0.1,
            '',
            (value) => handleInputChange('soilConditions', 'ph', value)
          )}
          {renderSliderInput(
            'Nitrogen (N)',
            formData.soilConditions.nitrogen,
            0,
            100,
            1,
            ' ppm',
            (value) => handleInputChange('soilConditions', 'nitrogen', value)
          )}
          {renderSliderInput(
            'Phosphorus (P)',
            formData.soilConditions.phosphorus,
            0,
            80,
            1,
            ' ppm',
            (value) => handleInputChange('soilConditions', 'phosphorus', value)
          )}
          {renderSliderInput(
            'Potassium (K)',
            formData.soilConditions.potassium,
            0,
            100,
            1,
            ' ppm',
            (value) => handleInputChange('soilConditions', 'potassium', value)
          )}
          {renderSliderInput(
            'Soil Moisture',
            formData.soilConditions.moisture,
            0,
            50,
            1,
            '%',
            (value) => handleInputChange('soilConditions', 'moisture', value)
          )}
        </View>

        {/* Weather Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌤️ Weather Conditions</Text>
          {renderSliderInput(
            'Average Temperature',
            formData.weatherData.avgTemperature,
            -10,
            50,
            1,
            '°C',
            (value) => handleInputChange('weatherData', 'avgTemperature', value)
          )}
          {renderSliderInput(
            'Annual Rainfall',
            formData.weatherData.rainfall,
            200,
            2000,
            10,
            ' mm',
            (value) => handleInputChange('weatherData', 'rainfall', value)
          )}
          {renderSliderInput(
            'Humidity',
            formData.weatherData.humidity,
            20,
            95,
            1,
            '%',
            (value) => handleInputChange('weatherData', 'humidity', value)
          )}
          {renderSliderInput(
            'Daily Sunlight',
            formData.weatherData.sunlight,
            4,
            16,
            0.5,
            ' hours',
            (value) => handleInputChange('weatherData', 'sunlight', value)
          )}
        </View>

        {/* Farming Practices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚜 Farming Practices</Text>
          {renderPickerInput(
            'Irrigation Type',
            formData.farmingPractices.irrigationType,
            [
              { label: 'Drip Irrigation', value: 'drip' },
              { label: 'Sprinkler', value: 'sprinkler' },
              { label: 'Flood Irrigation', value: 'flood' },
              { label: 'Rain-fed', value: 'rainfed' },
            ],
            (value) => handleInputChange('farmingPractices', 'irrigationType', value)
          )}

          {renderPickerInput(
            'Fertilizer Type',
            formData.farmingPractices.fertilizerType,
            [
              { label: 'Organic', value: 'organic' },
              { label: 'Synthetic', value: 'synthetic' },
              { label: 'Mixed', value: 'mixed' },
              { label: 'None', value: 'none' },
            ],
            (value) => handleInputChange('farmingPractices', 'fertilizerType', value)
          )}

          {renderPickerInput(
            'Pest Control',
            formData.farmingPractices.pestControl,
            [
              { label: 'Integrated Pest Management', value: 'integrated' },
              { label: 'Organic', value: 'organic' },
              { label: 'Chemical', value: 'chemical' },
              { label: 'Biological', value: 'biological' },
            ],
            (value) => handleInputChange('farmingPractices', 'pestControl', value)
          )}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={generatePrediction}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#ccc', '#aaa'] : ['#4CAF50', '#45a049']}
            style={styles.generateButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="psychology" size={24} color="#fff" />
            )}
            <Text style={styles.generateButtonText}>
              {loading ? 'Generating...' : 'Generate AI Prediction'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <PredictionModal />
    </SafeAreaView>
  );
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return '#F44336';
    case 'medium': return '#FF9800';
    case 'low': return '#4CAF50';
    default: return '#2196F3';
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
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  slider: {
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#4CAF50',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  generateButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
  predictionCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  predictionValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  predictionLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  confidenceText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  factorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  factorInfo: {
    flex: 1,
  },
  factorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  factorDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  factorImpact: {
    alignItems: 'flex-end',
  },
  factorImpactValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  recommendationPriority: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  recommendationPriorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 12,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recommendationDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recommendationImprovement: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  weatherAnalysis: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  weatherText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  weatherFactors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weatherFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  weatherFactorLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  weatherFactorValue: {
    fontSize: 12,
    fontWeight: 'bold',
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

export default YieldPredictionScreen;
