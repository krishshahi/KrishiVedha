import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import aiApiService from '../services/aiApiService';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const AIDashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmReport, setFarmReport] = useState(null);
  const [realTimeInsights, setRealTimeInsights] = useState(null);
  const [charts, setCharts] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [error, setError] = useState(null);

  // Get current farm from Redux store
  const { currentFarm } = useSelector((state) => state.farm);

  // Initialize AI API service
  useEffect(() => {
    aiApiService.initialize();
  }, []);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!currentFarm?._id) {
      setError('No farm selected');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const analytics = await aiApiService.getComprehensiveFarmAnalytics(
        currentFarm._id,
        '30d'
      );

      setFarmReport(analytics.farmReport);
      setRealTimeInsights(analytics.realTimeInsights);
      setCharts(analytics.charts);
      setAnalyticsSummary(analytics.summary);
    } catch (err) {
      console.error('Failed to load AI dashboard:', err);
      setError(err.message);
      Alert.alert('Error', 'Failed to load AI analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentFarm]);

  // Load data on mount and farm change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  // Navigate to specific AI feature
  const navigateToFeature = (feature) => {
    navigation.navigate(feature, { farmId: currentFarm?._id });
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading AI Analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.header}>
          <Text style={styles.headerTitle}>🤖 AI Farm Analytics</Text>
          <Text style={styles.headerSubtitle}>
            {currentFarm?.name || 'No Farm Selected'}
          </Text>
        </LinearGradient>

        {/* Real-time Insights */}
        {realTimeInsights && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Real-time Insights</Text>
            <View style={styles.insightsGrid}>
              {realTimeInsights.alerts?.map((alert, index) => (
                <View key={index} style={[styles.insightCard, { backgroundColor: getAlertColor(alert.priority) }]}>
                  <Icon name={getAlertIcon(alert.type)} size={24} color="#fff" />
                  <Text style={styles.insightTitle}>{alert.title}</Text>
                  <Text style={styles.insightText}>{alert.message}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 AI Tools</Text>
          <View style={styles.actionsGrid}>
            <AIActionCard
              title="Yield Prediction"
              icon="trending-up"
              color="#2196F3"
              onPress={() => navigateToFeature('YieldPrediction')}
              description="Predict crop yields with AI"
            />
            <AIActionCard
              title="Disease Detection"
              icon="local-hospital"
              color="#FF9800"
              onPress={() => navigateToFeature('DiseaseDetection')}
              description="Detect plant diseases from photos"
            />
            <AIActionCard
              title="Resource Optimizer"
              icon="eco"
              color="#4CAF50"
              onPress={() => navigateToFeature('ResourceOptimization')}
              description="Optimize resource allocation"
            />
            <AIActionCard
              title="Market Insights"
              icon="attach-money"
              color="#9C27B0"
              onPress={() => navigateToFeature('MarketInsights')}
              description="Market price predictions"
            />
          </View>
        </View>

        {/* Farm Report Summary */}
        {farmReport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Farm Performance</Text>
            <View style={styles.reportCard}>
              <View style={styles.reportMetric}>
                <Text style={styles.reportValue}>
                  {farmReport.overallScore || 'N/A'}
                </Text>
                <Text style={styles.reportLabel}>Overall Score</Text>
              </View>
              <View style={styles.reportMetric}>
                <Text style={styles.reportValue}>
                  {farmReport.predictedYield || 'N/A'}
                </Text>
                <Text style={styles.reportLabel}>Predicted Yield</Text>
              </View>
              <View style={styles.reportMetric}>
                <Text style={styles.reportValue}>
                  {farmReport.efficiency || 'N/A'}%
                </Text>
                <Text style={styles.reportLabel}>Efficiency</Text>
              </View>
            </View>
            
            {farmReport.recommendations && (
              <View style={styles.recommendationsContainer}>
                <Text style={styles.recommendationsTitle}>💡 AI Recommendations</Text>
                {farmReport.recommendations.slice(0, 3).map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Icon name="lightbulb-outline" size={16} color="#FFC107" />
                    <Text style={styles.recommendationText}>{rec.text}</Text>
                    <Text style={styles.recommendationImpact}>
                      Impact: {rec.impact}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Charts Preview */}
        {charts && charts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📈 Analytics Charts</Text>
              <TouchableOpacity
                onPress={() => navigateToFeature('ChartGallery')}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Icon name="arrow-forward" size={16} color="#4CAF50" />
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {charts.slice(0, 5).map((chart, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chartPreview}
                  onPress={() => navigateToFeature('ChartDetail', { chartId: chart.id })}
                >
                  {chart.imageUrl ? (
                    <Image
                      source={{ uri: chart.imageUrl }}
                      style={styles.chartImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.chartPlaceholder}>
                      <Icon name="insert-chart" size={32} color="#ccc" />
                    </View>
                  )}
                  <Text style={styles.chartTitle}>{chart.title}</Text>
                  <Text style={styles.chartType}>{chart.type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Weather Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌤️ Weather Insights</Text>
          <TouchableOpacity
            style={styles.weatherCard}
            onPress={() => navigateToFeature('WeatherInsights')}
          >
            <Icon name="wb-sunny" size={32} color="#FFC107" />
            <View style={styles.weatherContent}>
              <Text style={styles.weatherTitle}>AI Weather Analysis</Text>
              <Text style={styles.weatherDescription}>
                Get farming insights based on weather patterns and forecasts
              </Text>
            </View>
            <Icon name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Analytics Summary */}
        {analyticsSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 System Status</Text>
            <View style={styles.statusGrid}>
              <StatusCard
                title="AI Services"
                status={analyticsSummary.ai?.status}
                count={analyticsSummary.ai?.predictions_today}
                icon="psychology"
              />
              <StatusCard
                title="Charts Generated"
                status="active"
                count={analyticsSummary.visualization?.charts_generated}
                icon="insert-chart"
              />
              <StatusCard
                title="Data Sync"
                status={analyticsSummary.sync?.status}
                count={analyticsSummary.sync?.last_sync}
                icon="sync"
              />
              <StatusCard
                title="Notifications"
                status="active"
                count={analyticsSummary.notifications?.sent_today}
                icon="notifications"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// AI Action Card Component
const AIActionCard = ({ title, icon, color, onPress, description }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <LinearGradient
      colors={[color, `${color}CC`]}
      style={styles.actionCardGradient}
    >
      <Icon name={icon} size={32} color="#fff" />
      <Text style={styles.actionCardTitle}>{title}</Text>
      <Text style={styles.actionCardDescription}>{description}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// Status Card Component
const StatusCard = ({ title, status, count, icon }) => (
  <View style={styles.statusCard}>
    <Icon 
      name={icon} 
      size={24} 
      color={status === 'active' || status === 'healthy' ? '#4CAF50' : '#F44336'} 
    />
    <Text style={styles.statusTitle}>{title}</Text>
    <Text style={styles.statusCount}>{count || 'N/A'}</Text>
    <View style={[
      styles.statusIndicator,
      { backgroundColor: status === 'active' || status === 'healthy' ? '#4CAF50' : '#F44336' }
    ]} />
  </View>
);

// Helper functions
const getAlertColor = (priority) => {
  switch (priority) {
    case 'high': return '#F44336';
    case 'medium': return '#FF9800';
    case 'low': return '#4CAF50';
    default: return '#2196F3';
  }
};

const getAlertIcon = (type) => {
  switch (type) {
    case 'weather': return 'wb-cloudy';
    case 'disease': return 'local-hospital';
    case 'irrigation': return 'water-drop';
    case 'market': return 'trending-up';
    default: return 'info';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#4CAF50',
    marginRight: 4,
    fontWeight: '600',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  insightCard: {
    width: width / 2 - 24,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  insightTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  insightText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.9,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  actionCard: {
    width: width / 2 - 24,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionCardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  actionCardDescription: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.9,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportMetric: {
    alignItems: 'center',
  },
  reportValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  reportLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  recommendationsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    flex: 1,
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
  },
  recommendationImpact: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  chartPreview: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartImage: {
    width: '100%',
    height: 80,
    borderRadius: 4,
  },
  chartPlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  chartType: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weatherContent: {
    flex: 1,
    marginLeft: 16,
  },
  weatherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  weatherDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statusCard: {
    width: width / 2 - 24,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  statusCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
});

export default AIDashboardScreen;
