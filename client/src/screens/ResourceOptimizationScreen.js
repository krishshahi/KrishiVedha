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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import { PieChart, BarChart } from 'react-native-chart-kit';
import aiApiService from '../services/aiApiService';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#4CAF50',
  },
};

const ResourceOptimizationScreen = ({ navigation, route }) => {
  const { farmId } = route.params;
  const [loading, setLoading] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('water');

  // Resource input state
  const [resources, setResources] = useState({
    water: {
      available: 5000,
      dailyUsage: 200,
      cost: 0.15,
      efficiency: 85,
    },
    fertilizer: {
      nitrogen: 100,
      phosphorus: 50,
      potassium: 75,
      cost: 2.5,
    },
    labor: {
      hours: 40,
      hourlyRate: 15,
      efficiency: 88,
    },
    fuel: {
      liters: 500,
      costPerLiter: 1.2,
      consumption: 15,
    },
    energy: {
      kwh: 1000,
      costPerKwh: 0.12,
      renewable: 35,
    },
  });

  const [constraints, setConstraints] = useState({
    budget: 2000,
    timeframe: 30,
    environmental: ['minimize_runoff', 'organic_preferred'],
    priority: 'cost_efficiency',
  });

  // Get current farm from Redux
  const { currentFarm } = useSelector((state) => state.farm);

  useEffect(() => {
    aiApiService.initialize();
  }, []);

  const handleResourceChange = (category, field, value) => {
    setResources(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const generateOptimization = async () => {
    setLoading(true);
    try {
      const optimizationData = {
        farmId: farmId,
        currentResources: resources,
        cropRequirements: {
          corn: {
            waterNeed: 600,
            fertilizerNeed: { N: 150, P: 60, K: 90 },
            laborHours: 25,
          },
        },
        constraints: constraints,
      };

      const response = await aiApiService.optimizeResources(optimizationData);
      setOptimization(response.optimization);
      setShowModal(true);
      
      Alert.alert(
        'Optimization Complete!',
        `Potential savings: $${response.optimization.costSavings}`,
        [{ text: 'View Details', onPress: () => setShowModal(true) }]
      );
    } catch (error) {
      console.error('Resource optimization failed:', error);
      Alert.alert('Error', 'Failed to generate optimization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderResourceCard = (resourceType, data) => {
    const icons = {
      water: 'water-drop',
      fertilizer: 'eco',
      labor: 'people',
      fuel: 'local-gas-station',
      energy: 'flash-on',
    };

    const colors = {
      water: '#2196F3',
      fertilizer: '#4CAF50',
      labor: '#FF9800',
      fuel: '#F44336',
      energy: '#9C27B0',
    };

    return (
      <TouchableOpacity
        key={resourceType}
        style={[
          styles.resourceCard,
          currentTab === resourceType && styles.resourceCardActive,
        ]}
        onPress={() => setCurrentTab(resourceType)}
      >
        <LinearGradient
          colors={[colors[resourceType], `${colors[resourceType]}CC`]}
          style={styles.resourceCardGradient}
        >
          <Icon name={icons[resourceType]} size={32} color="#fff" />
          <Text style={styles.resourceCardTitle}>
            {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
          </Text>
          <Text style={styles.resourceCardValue}>
            {resourceType === 'water' && `${data.available}L`}
            {resourceType === 'fertilizer' && `${data.nitrogen + data.phosphorus + data.potassium}kg`}
            {resourceType === 'labor' && `${data.hours}h`}
            {resourceType === 'fuel' && `${data.liters}L`}
            {resourceType === 'energy' && `${data.kwh}kWh`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderResourceDetails = () => {
    const currentResource = resources[currentTab];
    
    switch (currentTab) {
      case 'water':
        return (
          <View style={styles.resourceDetails}>
            <Text style={styles.resourceDetailsTitle}>💧 Water Management</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Available Water: {currentResource.available}L</Text>
              <Slider
                style={styles.slider}
                minimumValue={1000}
                maximumValue={10000}
                step={100}
                value={currentResource.available}
                onValueChange={(value) => handleResourceChange('water', 'available', value)}
                minimumTrackTintColor="#2196F3"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Daily Usage: {currentResource.dailyUsage}L</Text>
              <Slider
                style={styles.slider}
                minimumValue={50}
                maximumValue={500}
                step={10}
                value={currentResource.dailyUsage}
                onValueChange={(value) => handleResourceChange('water', 'dailyUsage', value)}
                minimumTrackTintColor="#2196F3"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Efficiency: {currentResource.efficiency}%</Text>
              <Slider
                style={styles.slider}
                minimumValue={50}
                maximumValue={100}
                step={1}
                value={currentResource.efficiency}
                onValueChange={(value) => handleResourceChange('water', 'efficiency', value)}
                minimumTrackTintColor="#2196F3"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Cost per Liter</Text>
              <Text style={styles.metricValue}>${currentResource.cost}</Text>
            </View>
          </View>
        );

      case 'fertilizer':
        return (
          <View style={styles.resourceDetails}>
            <Text style={styles.resourceDetailsTitle}>🌱 Fertilizer Allocation</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Nitrogen (N): {currentResource.nitrogen}kg</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={200}
                step={5}
                value={currentResource.nitrogen}
                onValueChange={(value) => handleResourceChange('fertilizer', 'nitrogen', value)}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Phosphorus (P): {currentResource.phosphorus}kg</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={2}
                value={currentResource.phosphorus}
                onValueChange={(value) => handleResourceChange('fertilizer', 'phosphorus', value)}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Potassium (K): {currentResource.potassium}kg</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={120}
                step={2}
                value={currentResource.potassium}
                onValueChange={(value) => handleResourceChange('fertilizer', 'potassium', value)}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Cost per kg</Text>
              <Text style={styles.metricValue}>${currentResource.cost}</Text>
            </View>
          </View>
        );

      case 'labor':
        return (
          <View style={styles.resourceDetails}>
            <Text style={styles.resourceDetailsTitle}>👥 Labor Management</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Available Hours: {currentResource.hours}h</Text>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={80}
                step={2}
                value={currentResource.hours}
                onValueChange={(value) => handleResourceChange('labor', 'hours', value)}
                minimumTrackTintColor="#FF9800"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Efficiency: {currentResource.efficiency}%</Text>
              <Slider
                style={styles.slider}
                minimumValue={60}
                maximumValue={100}
                step={1}
                value={currentResource.efficiency}
                onValueChange={(value) => handleResourceChange('labor', 'efficiency', value)}
                minimumTrackTintColor="#FF9800"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Hourly Rate</Text>
              <Text style={styles.metricValue}>${currentResource.hourlyRate}</Text>
            </View>
          </View>
        );

      case 'fuel':
        return (
          <View style={styles.resourceDetails}>
            <Text style={styles.resourceDetailsTitle}>⛽ Fuel Management</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Available Fuel: {currentResource.liters}L</Text>
              <Slider
                style={styles.slider}
                minimumValue={200}
                maximumValue={1000}
                step={20}
                value={currentResource.liters}
                onValueChange={(value) => handleResourceChange('fuel', 'liters', value)}
                minimumTrackTintColor="#F44336"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Consumption: {currentResource.consumption}L/h</Text>
              <Slider
                style={styles.slider}
                minimumValue={8}
                maximumValue={25}
                step={0.5}
                value={currentResource.consumption}
                onValueChange={(value) => handleResourceChange('fuel', 'consumption', value)}
                minimumTrackTintColor="#F44336"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Cost per Liter</Text>
              <Text style={styles.metricValue}>${currentResource.costPerLiter}</Text>
            </View>
          </View>
        );

      case 'energy':
        return (
          <View style={styles.resourceDetails}>
            <Text style={styles.resourceDetailsTitle}>⚡ Energy Management</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Available Energy: {currentResource.kwh}kWh</Text>
              <Slider
                style={styles.slider}
                minimumValue={500}
                maximumValue={2000}
                step={50}
                value={currentResource.kwh}
                onValueChange={(value) => handleResourceChange('energy', 'kwh', value)}
                minimumTrackTintColor="#9C27B0"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Renewable: {currentResource.renewable}%</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={5}
                value={currentResource.renewable}
                onValueChange={(value) => handleResourceChange('energy', 'renewable', value)}
                minimumTrackTintColor="#9C27B0"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Cost per kWh</Text>
              <Text style={styles.metricValue}>${currentResource.costPerKwh}</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const OptimizationModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>⚡ Resource Optimization Results</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowModal(false)}
          >
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {optimization && (
          <ScrollView style={styles.modalContent}>
            {/* Savings Summary */}
            <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.savingsCard}>
              <Icon name="savings" size={48} color="#fff" />
              <Text style={styles.savingsValue}>
                ${optimization.costSavings}
              </Text>
              <Text style={styles.savingsLabel}>Potential Monthly Savings</Text>
              <View style={styles.efficiencyContainer}>
                <Icon name="trending-up" size={16} color="#fff" />
                <Text style={styles.efficiencyText}>
                  {optimization.efficiencyImprovement}% efficiency improvement
                </Text>
              </View>
            </LinearGradient>

            {/* Resource Recommendations */}
            {optimization.recommendations && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 Optimization Recommendations</Text>
                {optimization.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                      <Icon name={getRecommendationIcon(rec.category)} size={24} color="#4CAF50" />
                      <View style={styles.recommendationInfo}>
                        <Text style={styles.recommendationTitle}>{rec.title}</Text>
                        <Text style={styles.recommendationCategory}>{rec.category}</Text>
                      </View>
                      <View style={styles.recommendationImpact}>
                        <Text style={styles.impactValue}>+{rec.impact}%</Text>
                        <Text style={styles.impactLabel}>efficiency</Text>
                      </View>
                    </View>
                    <Text style={styles.recommendationDescription}>{rec.description}</Text>
                    
                    {rec.implementation && (
                      <View style={styles.implementationSteps}>
                        <Text style={styles.implementationTitle}>Implementation:</Text>
                        {rec.implementation.map((step, stepIndex) => (
                          <Text key={stepIndex} style={styles.implementationStep}>
                            {stepIndex + 1}. {step}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Resource Allocation Chart */}
            {optimization.allocation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Optimal Resource Allocation</Text>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={[
                      { name: 'Water', population: optimization.allocation.water, color: '#2196F3', legendFontColor: '#333' },
                      { name: 'Fertilizer', population: optimization.allocation.fertilizer, color: '#4CAF50', legendFontColor: '#333' },
                      { name: 'Labor', population: optimization.allocation.labor, color: '#FF9800', legendFontColor: '#333' },
                      { name: 'Fuel', population: optimization.allocation.fuel, color: '#F44336', legendFontColor: '#333' },
                      { name: 'Energy', population: optimization.allocation.energy, color: '#9C27B0', legendFontColor: '#333' },
                    ]}
                    width={width - 64}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              </View>
            )}

            {/* Environmental Impact */}
            {optimization.environmental && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🌱 Environmental Impact</Text>
                <View style={styles.environmentalGrid}>
                  <View style={styles.environmentalCard}>
                    <Icon name="co2" size={32} color="#4CAF50" />
                    <Text style={styles.environmentalValue}>
                      -{optimization.environmental.co2Reduction}%
                    </Text>
                    <Text style={styles.environmentalLabel}>CO₂ Reduction</Text>
                  </View>
                  
                  <View style={styles.environmentalCard}>
                    <Icon name="water-drop" size={32} color="#2196F3" />
                    <Text style={styles.environmentalValue}>
                      -{optimization.environmental.waterSavings}%
                    </Text>
                    <Text style={styles.environmentalLabel}>Water Savings</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Timeline */}
            {optimization.timeline && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📅 Implementation Timeline</Text>
                {optimization.timeline.map((phase, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineIndicator}>
                      <Text style={styles.timelineNumber}>{index + 1}</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>{phase.title}</Text>
                      <Text style={styles.timelineDescription}>{phase.description}</Text>
                      <Text style={styles.timelineDuration}>Duration: {phase.duration}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.implementButton]}
                onPress={() => {
                  Alert.alert('Success', 'Optimization plan saved successfully!');
                  setShowModal(false);
                }}
              >
                <Icon name="check-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Implement Plan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.shareButton]}
                onPress={() => {
                  Alert.alert('Info', 'Share functionality coming soon!');
                }}
              >
                <Icon name="share" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Share Report</Text>
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
        <Text style={styles.headerTitle}>⚡ Resource Optimization</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Farm Info */}
        <View style={styles.farmInfo}>
          <Icon name="agriculture" size={24} color="#4CAF50" />
          <Text style={styles.farmName}>{currentFarm?.name || 'Current Farm'}</Text>
        </View>

        {/* Resource Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Resource Overview</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.resourceCardsContainer}>
              {Object.entries(resources).map(([type, data]) => 
                renderResourceCard(type, data)
              )}
            </View>
          </ScrollView>
        </View>

        {/* Resource Details */}
        <View style={styles.section}>
          {renderResourceDetails()}
        </View>

        {/* Constraints */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Optimization Constraints</Text>
          
          <View style={styles.constraintItem}>
            <Text style={styles.constraintLabel}>Budget: ${constraints.budget}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1000}
              maximumValue={5000}
              step={100}
              value={constraints.budget}
              onValueChange={(value) => setConstraints(prev => ({...prev, budget: value}))}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#E0E0E0"
            />
          </View>

          <View style={styles.constraintItem}>
            <Text style={styles.constraintLabel}>Timeframe: {constraints.timeframe} days</Text>
            <Slider
              style={styles.slider}
              minimumValue={7}
              maximumValue={90}
              step={1}
              value={constraints.timeframe}
              onValueChange={(value) => setConstraints(prev => ({...prev, timeframe: value}))}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#E0E0E0"
            />
          </View>
        </View>

        {/* Optimize Button */}
        <TouchableOpacity
          style={[styles.optimizeButton, loading && styles.optimizeButtonDisabled]}
          onPress={generateOptimization}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#ccc', '#aaa'] : ['#4CAF50', '#45a049']}
            style={styles.optimizeButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="auto-fix-high" size={24} color="#fff" />
            )}
            <Text style={styles.optimizeButtonText}>
              {loading ? 'Optimizing...' : 'Generate AI Optimization'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <OptimizationModal />
    </SafeAreaView>
  );
};

const getRecommendationIcon = (category) => {
  const icons = {
    water: 'water-drop',
    fertilizer: 'eco',
    labor: 'people',
    fuel: 'local-gas-station',
    energy: 'flash-on',
    efficiency: 'trending-up',
    cost: 'attach-money',
  };
  return icons[category] || 'lightbulb';
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
  resourceCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  resourceCard: {
    width: 120,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resourceCardActive: {
    transform: [{ scale: 1.05 }],
    elevation: 4,
  },
  resourceCardGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  resourceCardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  resourceCardValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  resourceDetails: {
    marginTop: 8,
  },
  resourceDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  metricCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  constraintItem: {
    marginBottom: 20,
  },
  constraintLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  optimizeButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optimizeButtonDisabled: {
    opacity: 0.6,
  },
  optimizeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  optimizeButtonText: {
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
  savingsCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  savingsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  savingsLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  efficiencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  efficiencyText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  recommendationCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recommendationCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  recommendationImpact: {
    alignItems: 'center',
  },
  impactValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  impactLabel: {
    fontSize: 10,
    color: '#666',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  implementationSteps: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
  },
  implementationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  implementationStep: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  environmentalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  environmentalCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    minWidth: 120,
  },
  environmentalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
  },
  environmentalLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  timelineIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  timelineNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timelineDuration: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
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
  implementButton: {
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

export default ResourceOptimizationScreen;
