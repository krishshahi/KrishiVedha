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
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import aiApiService from '../services/aiApiService';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 2,
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

const MarketInsightsScreen = ({ navigation, route }) => {
  const { farmId } = route.params;
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('corn');
  const [timeframe, setTimeframe] = useState('3m');
  const [marketData, setMarketData] = useState(null);

  // Market analysis state
  const [marketAnalysis, setMarketAnalysis] = useState({
    currentPrices: {
      corn: 4.35,
      wheat: 6.20,
      soybeans: 12.85,
      rice: 14.50,
      cotton: 0.72,
    },
    trends: {
      corn: { change: 2.5, direction: 'up' },
      wheat: { change: -1.2, direction: 'down' },
      soybeans: { change: 4.8, direction: 'up' },
      rice: { change: 0.5, direction: 'up' },
      cotton: { change: -2.1, direction: 'down' },
    },
    forecast: {
      corn: [4.35, 4.42, 4.38, 4.55, 4.62, 4.58],
      wheat: [6.20, 6.15, 6.25, 6.18, 6.30, 6.35],
      soybeans: [12.85, 13.10, 12.95, 13.25, 13.40, 13.30],
      rice: [14.50, 14.60, 14.55, 14.70, 14.75, 14.80],
      cotton: [0.72, 0.71, 0.73, 0.74, 0.72, 0.75],
    },
  });

  // Get current farm from Redux
  const { currentFarm } = useSelector((state) => state.farm);

  useEffect(() => {
    aiApiService.initialize();
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    // Simulate loading market data
    setTimeout(() => {
      setMarketData({
        lastUpdated: new Date().toISOString(),
        volatility: 'moderate',
        marketSentiment: 'bullish',
        keyFactors: [
          'Weather conditions favorable',
          'Export demand increasing',
          'Supply chain stabilizing',
          'Currency fluctuations',
        ],
      });
    }, 1000);
  };

  const generateMarketPrediction = async () => {
    setLoading(true);
    try {
      const predictionData = {
        cropType: selectedCrop,
        location: {
          state: 'Iowa',
          county: 'Polk',
          latitude: currentFarm?.location?.latitude || 41.5868,
          longitude: currentFarm?.location?.longitude || -93.6250,
        },
        harvestDate: '2024-09-15',
        quantity: 5000,
        quality: 'grade_1',
        historicalContext: {
          lastYearPrice: marketAnalysis.currentPrices[selectedCrop] * 0.95,
          fiveYearAvg: marketAnalysis.currentPrices[selectedCrop] * 0.92,
        },
      };

      const response = await aiApiService.predictMarketPrices(
        predictionData.cropType,
        predictionData.location,
        predictionData.harvestDate,
        predictionData
      );
      
      setPrediction(response.prediction);
      setShowModal(true);
      
      Alert.alert(
        'Market Prediction Complete!',
        `Predicted price: $${response.prediction.predictedPrice}/bushel`,
        [{ text: 'View Details', onPress: () => setShowModal(true) }]
      );
    } catch (error) {
      console.error('Market prediction failed:', error);
      Alert.alert('Error', 'Failed to generate market prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPriceCard = (crop, price, trend) => {
    const cropIcons = {
      corn: 'grass',
      wheat: 'grain',
      soybeans: 'spa',
      rice: 'rice-bowl',
      cotton: 'filter-drama',
    };

    const trendColor = trend.direction === 'up' ? '#4CAF50' : '#F44336';
    const trendIcon = trend.direction === 'up' ? 'trending-up' : 'trending-down';

    return (
      <TouchableOpacity
        key={crop}
        style={[
          styles.priceCard,
          selectedCrop === crop && styles.priceCardSelected,
        ]}
        onPress={() => setSelectedCrop(crop)}
      >
        <View style={styles.priceCardHeader}>
          <Icon name={cropIcons[crop] || 'eco'} size={24} color="#4CAF50" />
          <Text style={styles.priceCardTitle}>
            {crop.charAt(0).toUpperCase() + crop.slice(1)}
          </Text>
        </View>
        
        <Text style={styles.priceCardValue}>${price.toFixed(2)}</Text>
        <Text style={styles.priceCardUnit}>per bushel</Text>
        
        <View style={styles.trendContainer}>
          <Icon name={trendIcon} size={16} color={trendColor} />
          <Text style={[styles.trendText, { color: trendColor }]}>
            {trend.change > 0 ? '+' : ''}{trend.change}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderChart = () => {
    if (!marketAnalysis.forecast[selectedCrop]) return null;

    const data = {
      labels: ['Current', '+1M', '+2M', '+3M', '+4M', '+5M'],
      datasets: [{
        data: marketAnalysis.forecast[selectedCrop],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 3,
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          {selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)} Price Forecast
        </Text>
        <LineChart
          data={data}
          width={width - 64}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const PredictionModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>💰 Market Price Prediction</Text>
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
            <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={styles.predictionCard}>
              <Icon name="attach-money" size={48} color="#fff" />
              <Text style={styles.predictionValue}>
                ${prediction.predictedPrice}
              </Text>
              <Text style={styles.predictionLabel}>Predicted Price per Bushel</Text>
              <View style={styles.confidenceContainer}>
                <Icon name="verified" size={16} color="#fff" />
                <Text style={styles.confidenceText}>
                  {Math.round(prediction.confidence * 100)}% confidence
                </Text>
              </View>
            </LinearGradient>

            {/* Price Range */}
            {prediction.priceRange && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Price Range Forecast</Text>
                <View style={styles.rangeContainer}>
                  <View style={styles.rangeItem}>
                    <Icon name="trending-down" size={20} color="#F44336" />
                    <Text style={styles.rangeLabel}>Low Estimate</Text>
                    <Text style={[styles.rangeValue, { color: '#F44336' }]}>
                      ${prediction.priceRange.low}
                    </Text>
                  </View>
                  
                  <View style={styles.rangeItem}>
                    <Icon name="remove" size={20} color="#FF9800" />
                    <Text style={styles.rangeLabel}>Most Likely</Text>
                    <Text style={[styles.rangeValue, { color: '#FF9800' }]}>
                      ${prediction.priceRange.expected}
                    </Text>
                  </View>
                  
                  <View style={styles.rangeItem}>
                    <Icon name="trending-up" size={20} color="#4CAF50" />
                    <Text style={styles.rangeLabel}>High Estimate</Text>
                    <Text style={[styles.rangeValue, { color: '#4CAF50' }]}>
                      ${prediction.priceRange.high}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Market Factors */}
            {prediction.factors && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📈 Key Market Factors</Text>
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

            {/* Timing Recommendations */}
            {prediction.timing && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏰ Optimal Timing</Text>
                <View style={styles.timingContainer}>
                  <View style={styles.timingCard}>
                    <Icon name="schedule" size={32} color="#4CAF50" />
                    <Text style={styles.timingTitle}>Best Selling Window</Text>
                    <Text style={styles.timingPeriod}>{prediction.timing.optimal}</Text>
                    <Text style={styles.timingReason}>{prediction.timing.reason}</Text>
                  </View>
                  
                  {prediction.timing.alternative && (
                    <View style={styles.timingCard}>
                      <Icon name="access-time" size={32} color="#FF9800" />
                      <Text style={styles.timingTitle}>Alternative Period</Text>
                      <Text style={styles.timingPeriod}>{prediction.timing.alternative.period}</Text>
                      <Text style={styles.timingReason}>{prediction.timing.alternative.reason}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Risk Assessment */}
            {prediction.riskAssessment && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚠️ Risk Assessment</Text>
                <View style={styles.riskContainer}>
                  <View style={[
                    styles.riskLevel,
                    { backgroundColor: getRiskColor(prediction.riskAssessment.level) }
                  ]}>
                    <Text style={styles.riskLevelText}>
                      {prediction.riskAssessment.level.toUpperCase()} RISK
                    </Text>
                  </View>
                  
                  <View style={styles.riskFactors}>
                    <Text style={styles.riskFactorsTitle}>Risk Factors:</Text>
                    {prediction.riskAssessment.factors.map((risk, index) => (
                      <Text key={index} style={styles.riskFactor}>
                        • {risk}
                      </Text>
                    ))}
                  </View>
                  
                  <View style={styles.mitigation}>
                    <Text style={styles.mitigationTitle}>Mitigation Strategies:</Text>
                    {prediction.riskAssessment.mitigation.map((strategy, index) => (
                      <Text key={index} style={styles.mitigationStrategy}>
                        {index + 1}. {strategy}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Comparative Analysis */}
            {prediction.comparison && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔄 Price Comparison</Text>
                <View style={styles.comparisonGrid}>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Last Year</Text>
                    <Text style={styles.comparisonValue}>${prediction.comparison.lastYear}</Text>
                    <Text style={[
                      styles.comparisonChange,
                      { color: prediction.comparison.yearOverYear > 0 ? '#4CAF50' : '#F44336' }
                    ]}>
                      {prediction.comparison.yearOverYear > 0 ? '+' : ''}
                      {prediction.comparison.yearOverYear}%
                    </Text>
                  </View>
                  
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>5-Year Avg</Text>
                    <Text style={styles.comparisonValue}>${prediction.comparison.fiveYearAvg}</Text>
                    <Text style={[
                      styles.comparisonChange,
                      { color: prediction.comparison.vsFiveYear > 0 ? '#4CAF50' : '#F44336' }
                    ]}>
                      {prediction.comparison.vsFiveYear > 0 ? '+' : ''}
                      {prediction.comparison.vsFiveYear}%
                    </Text>
                  </View>
                  
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Regional Avg</Text>
                    <Text style={styles.comparisonValue}>${prediction.comparison.regional}</Text>
                    <Text style={[
                      styles.comparisonChange,
                      { color: prediction.comparison.vsRegional > 0 ? '#4CAF50' : '#F44336' }
                    ]}>
                      {prediction.comparison.vsRegional > 0 ? '+' : ''}
                      {prediction.comparison.vsRegional}%
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={() => {
                  Alert.alert('Success', 'Market analysis saved successfully!');
                  setShowModal(false);
                }}
              >
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Save Analysis</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.alertButton]}
                onPress={() => {
                  Alert.alert('Price Alert', 'Price alert set for optimal selling window!');
                }}
              >
                <Icon name="notifications-active" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Set Alert</Text>
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
        <Text style={styles.headerTitle}>💰 Market Insights</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadMarketData}
        >
          <Icon name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Farm Info */}
        <View style={styles.farmInfo}>
          <Icon name="agriculture" size={24} color="#4CAF50" />
          <Text style={styles.farmName}>{currentFarm?.name || 'Current Farm'}</Text>
          {marketData && (
            <View style={styles.updateInfo}>
              <Icon name="update" size={16} color="#666" />
              <Text style={styles.updateText}>
                Last updated: {marketData.lastUpdated ? new Date(marketData.lastUpdated).toLocaleTimeString() : 'N/A'}
              </Text>
            </View>
          )}
        </View>

        {/* Current Prices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Current Market Prices</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.priceCardsContainer}>
              {Object.entries(marketAnalysis.currentPrices).map(([crop, price]) =>
                renderPriceCard(crop, price, marketAnalysis.trends[crop])
              )}
            </View>
          </ScrollView>
        </View>

        {/* Market Overview */}
        {marketData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌐 Market Overview</Text>
            <View style={styles.marketOverview}>
              <View style={styles.overviewItem}>
                <Icon name="trending-up" size={24} color="#4CAF50" />
                <Text style={styles.overviewLabel}>Market Sentiment</Text>
                <Text style={[
                  styles.overviewValue,
                  { color: marketData.marketSentiment === 'bullish' ? '#4CAF50' : '#F44336' }
                ]}>
                  {marketData.marketSentiment.toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.overviewItem}>
                <Icon name="show-chart" size={24} color="#FF9800" />
                <Text style={styles.overviewLabel}>Volatility</Text>
                <Text style={styles.overviewValue}>
                  {marketData.volatility.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.keyFactors}>
              <Text style={styles.keyFactorsTitle}>Key Market Factors:</Text>
              {marketData.keyFactors.map((factor, index) => (
                <Text key={index} style={styles.keyFactor}>
                  • {factor}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Price Forecast Chart */}
        <View style={styles.section}>
          {renderChart()}
        </View>

        {/* Analysis Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Price Prediction Setup</Text>
          
          <View style={styles.controlsContainer}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Select Crop:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedCrop}
                  onValueChange={setSelectedCrop}
                  style={styles.picker}
                >
                  <Picker.Item label="Corn" value="corn" />
                  <Picker.Item label="Wheat" value="wheat" />
                  <Picker.Item label="Soybeans" value="soybeans" />
                  <Picker.Item label="Rice" value="rice" />
                  <Picker.Item label="Cotton" value="cotton" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Timeframe:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={timeframe}
                  onValueChange={setTimeframe}
                  style={styles.picker}
                >
                  <Picker.Item label="1 Month" value="1m" />
                  <Picker.Item label="3 Months" value="3m" />
                  <Picker.Item label="6 Months" value="6m" />
                  <Picker.Item label="1 Year" value="1y" />
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Generate Prediction Button */}
        <TouchableOpacity
          style={[styles.predictButton, loading && styles.predictButtonDisabled]}
          onPress={generateMarketPrediction}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#ccc', '#aaa'] : ['#9C27B0', '#7B1FA2']}
            style={styles.predictButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="insights" size={24} color="#fff" />
            )}
            <Text style={styles.predictButtonText}>
              {loading ? 'Analyzing Market...' : 'Generate AI Price Prediction'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <PredictionModal />
    </SafeAreaView>
  );
};

const getRiskColor = (level) => {
  switch (level) {
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
  refreshButton: {
    padding: 8,
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
    flex: 1,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
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
  priceCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  priceCard: {
    width: 120,
    marginHorizontal: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  priceCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  priceCardHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  priceCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  priceCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  priceCardUnit: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  marketOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  keyFactors: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  keyFactorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  keyFactor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  controlsContainer: {
    marginTop: 8,
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
  predictButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  predictButtonDisabled: {
    opacity: 0.6,
  },
  predictButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  predictButtonText: {
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
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  rangeItem: {
    alignItems: 'center',
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  rangeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
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
  timingContainer: {
    marginTop: 16,
  },
  timingCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  timingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  timingPeriod: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  timingReason: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  riskContainer: {
    marginTop: 16,
  },
  riskLevel: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  riskLevelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  riskFactors: {
    marginBottom: 16,
  },
  riskFactorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  riskFactor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  mitigation: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  mitigationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  mitigationStrategy: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  comparisonItem: {
    alignItems: 'center',
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  comparisonChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
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
  alertButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default MarketInsightsScreen;
