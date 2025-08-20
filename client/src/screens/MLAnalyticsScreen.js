import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LineChart, ProgressChart, BarChart } from 'react-native-chart-kit';
import * as ImagePicker from 'expo-image-picker';

import MLService from '../services/mlService';

const { width } = Dimensions.get('window');

const MLAnalyticsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [cropHealthData, setCropHealthData] = useState(null);
  const [yieldPrediction, setYieldPrediction] = useState(null);
  const [marketForecast, setMarketForecast] = useState(null);
  const [soilAnalysis, setSoilAnalysis] = useState(null);
  const [processingImage, setProcessingImage] = useState(false);

  const chartConfig = {
    backgroundColor: '#022173',
    backgroundGradientFrom: '#022173',
    backgroundGradientTo: '#1e3a8a',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  useEffect(() => {
    loadMLData();
  }, []);

  const loadMLData = async () => {
    try {
      setLoading(true);
      
      // Load ML metrics
      const metricsData = await MLService.getMetrics();
      setMetrics(metricsData);

      // Load sample predictions if not already loaded
      if (!yieldPrediction) {
        loadSamplePredictions();
      }

    } catch (error) {
      console.error('Error loading ML data:', error);
      Alert.alert('Error', 'Failed to load ML analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadSamplePredictions = async () => {
    try {
      // Sample farm data for predictions
      const sampleFarmData = {
        area: 2.5,
        cropType: 'wheat',
        location: { latitude: 28.6139, longitude: 77.2090 }
      };

      // Load yield prediction
      const yieldData = await MLService.predictYield(
        sampleFarmData,
        { previousYields: [2100, 2300, 2450] },
        { temperature: 25, rainfall: 650 },
        { currentPrice: 2200 }
      );
      setYieldPrediction(yieldData);

      // Load market forecast
      const marketData = await MLService.forecastMarketPrices('wheat', 'punjab', '3months');
      setMarketForecast(marketData);

      // Load soil analysis
      const soilData = await MLService.analyzeSoil(
        { ph: 6.8, nitrogen: 120, phosphorus: 35 },
        'wheat',
        6000
      );
      setSoilAnalysis(soilData);

    } catch (error) {
      console.error('Error loading sample predictions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMLData();
    setRefreshing(false);
  };

  const analyzeCropHealth = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to analyze crop images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProcessingImage(true);
        
        const healthAnalysis = await MLService.analyzeCropHealth(
          result.assets[0].uri,
          'wheat',
          { latitude: 28.6139, longitude: 77.2090 },
          { captureDate: new Date() }
        );
        
        setCropHealthData(healthAnalysis);
        setProcessingImage(false);
        
        // Show results
        navigation.navigate('CropHealthResults', { analysis: healthAnalysis });
      }
    } catch (error) {
      setProcessingImage(false);
      Alert.alert('Error', 'Failed to analyze crop health');
      console.error('Crop health analysis error:', error);
    }
  };

  const renderMetricCard = (title, value, subtext, icon, color, onPress) => (
    <TouchableOpacity style={styles.metricCard} onPress={onPress}>
      <LinearGradient
        colors={[color, color + '80']}
        style={styles.metricGradient}
      >
        <View style={styles.metricHeader}>
          <MaterialIcons name={icon} size={24} color="white" />
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricSubtext}>{subtext}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderPredictionChart = () => {
    if (!yieldPrediction) return null;

    const data = {
      labels: ['Last Year', 'This Year', 'Predicted'],
      datasets: [
        {
          data: [
            yieldPrediction.historicalComparison?.lastSeason || 2100,
            2300,
            yieldPrediction.prediction?.expectedYield || 2500
          ],
          color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Yield Prediction Trend</Text>
        <LineChart
          data={data}
          width={width - 40}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderMarketChart = () => {
    if (!marketForecast || !marketForecast.forecasts) return null;

    const data = {
      labels: marketForecast.forecasts.map(f => f.period),
      datasets: [
        {
          data: marketForecast.forecasts.map(f => f.price),
          color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Market Price Forecast</Text>
        <LineChart
          data={data}
          width={width - 40}
          height={200}
          chartConfig={{
            ...chartConfig,
            backgroundGradientFrom: '#e67e22',
            backgroundGradientTo: '#f39c12',
          }}
          style={styles.chart}
        />
      </View>
    );
  };

  const renderHealthProgress = () => {
    if (!cropHealthData) return null;

    const healthScore = cropHealthData.analysis?.overallHealth?.score || 0;
    const data = {
      data: [healthScore / 100],
    };

    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Crop Health Score</Text>
        <ProgressChart
          data={data}
          width={width - 40}
          height={180}
          strokeWidth={16}
          radius={60}
          chartConfig={{
            ...chartConfig,
            backgroundGradientFrom: '#27ae60',
            backgroundGradientTo: '#2ecc71',
          }}
          hideLegend={true}
        />
        <Text style={styles.progressScore}>{healthScore}%</Text>
        <Text style={styles.progressStatus}>
          {cropHealthData.analysis?.overallHealth?.status || 'Good'}
        </Text>
      </View>
    );
  };

  const renderRecommendations = () => {
    const recommendations = [];
    
    if (yieldPrediction?.prediction?.recommendations) {
      recommendations.push(...yieldPrediction.prediction.recommendations);
    }
    
    if (soilAnalysis?.analysis?.recommendations?.immediate) {
      recommendations.push(...soilAnalysis.analysis.recommendations.immediate);
    }

    if (recommendations.length === 0) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>AI Recommendations</Text>
        {recommendations.slice(0, 5).map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <MaterialIcons name="lightbulb" size={16} color="#f39c12" />
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading ML Analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>ML Analytics</Text>
        <Text style={styles.headerSubtitle}>AI-Powered Farm Intelligence</Text>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, processingImage && styles.actionButtonDisabled]} 
          onPress={analyzeCropHealth}
          disabled={processingImage}
        >
          <MaterialIcons 
            name="camera-alt" 
            size={24} 
            color={processingImage ? "#999" : "white"} 
          />
          <Text style={[styles.actionButtonText, processingImage && { color: '#999' }]}>
            {processingImage ? 'Processing...' : 'Analyze Crop'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => navigation.navigate('YieldPrediction')}
        >
          <FontAwesome5 name="chart-line" size={24} color="white" />
          <Text style={styles.actionButtonText}>Predict Yield</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Grid */}
      {metrics && (
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Health Analyses',
            metrics.cropHealth?.totalAnalyses || 0,
            `${Math.round((metrics.cropHealth?.accuracyRate || 0) * 100)}% accuracy`,
            'local-hospital',
            '#27ae60',
            () => navigation.navigate('CropHealth')
          )}
          {renderMetricCard(
            'Yield Predictions',
            metrics.yieldPrediction?.totalPredictions || 0,
            `${Math.round((metrics.yieldPrediction?.averageAccuracy || 0) * 100)}% accuracy`,
            'trending-up',
            '#3498db',
            () => navigation.navigate('YieldPrediction')
          )}
          {renderMetricCard(
            'Market Forecasts',
            metrics.marketForecast?.totalForecasts || 0,
            `${Math.round((metrics.marketForecast?.averageAccuracy || 0) * 100)}% accuracy`,
            'show-chart',
            '#e74c3c',
            () => navigation.navigate('MarketForecast')
          )}
          {renderMetricCard(
            'Soil Analyses',
            metrics.soilAnalysis?.totalAnalyses || 0,
            `${Math.round((metrics.soilAnalysis?.recommendationSuccess || 0) * 100)}% success rate`,
            'landscape',
            '#9b59b6',
            () => navigation.navigate('SoilAnalysis')
          )}
        </View>
      )}

      {/* Charts and Visualizations */}
      {renderHealthProgress()}
      {renderPredictionChart()}
      {renderMarketChart()}

      {/* AI Recommendations */}
      {renderRecommendations()}

      {/* Feature Cards */}
      <View style={styles.featureContainer}>
        <TouchableOpacity 
          style={styles.featureCard}
          onPress={() => navigation.navigate('DiseaseDetection')}
        >
          <LinearGradient
            colors={['#e74c3c', '#c0392b']}
            style={styles.featureGradient}
          >
            <MaterialIcons name="bug-report" size={40} color="white" />
            <Text style={styles.featureTitle}>Disease Detection</Text>
            <Text style={styles.featureDescription}>
              Early detection of crop diseases using AI image analysis
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureCard}
          onPress={() => navigation.navigate('WeatherAnalysis')}
        >
          <LinearGradient
            colors={['#3498db', '#2980b9']}
            style={styles.featureGradient}
          >
            <Ionicons name="cloud-outline" size={40} color="white" />
            <Text style={styles.featureTitle}>Weather Analysis</Text>
            <Text style={styles.featureDescription}>
              Advanced weather pattern analysis for better planning
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureCard}
          onPress={() => navigation.navigate('ResourceOptimization')}
        >
          <LinearGradient
            colors={['#f39c12', '#e67e22']}
            style={styles.featureGradient}
          >
            <FontAwesome5 name="cogs" size={40} color="white" />
            <Text style={styles.featureTitle}>Resource Optimization</Text>
            <Text style={styles.featureDescription}>
              Optimize water, fertilizer, and labor allocation
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  metricCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  metricGradient: {
    padding: 20,
    minHeight: 120,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  metricValue: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '400',
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  progressContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  progressScore: {
    position: 'absolute',
    top: '50%',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
    marginTop: 20,
  },
  progressStatus: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textTransform: 'capitalize',
  },
  recommendationsContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 4,
  },
  recommendationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  featureContainer: {
    padding: 20,
    gap: 16,
  },
  featureCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featureGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  featureTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default MLAnalyticsScreen;
