import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import enhancedAIService from '../services/enhancedAIService';

const { width, height } = Dimensions.get('window');

const AnalyticsDashboardScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [dashboardData, setDashboardData] = useState(null);
  const scrollViewRef = useRef();

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulate loading multiple data sources
      const [weatherData, yieldPrediction, marketForecast, cropHealth] = await Promise.all([
        enhancedAIService.getWeatherData(28.6139, 77.2090), // Delhi coordinates
        enhancedAIService.predictYield({ area: 5, cropType: 'wheat' }, [], {}),
        enhancedAIService.getMarketForecast('wheat'),
        generateMockCropHealth()
      ]);

      const processedData = {
        weather: weatherData,
        yield: yieldPrediction,
        market: marketForecast,
        cropHealth: cropHealth,
        overview: generateOverviewMetrics(),
        trends: generateTrendData(),
        alerts: generateSmartAlerts(),
        recommendations: generateDashboardRecommendations()
      };

      setDashboardData(processedData);
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const generateMockCropHealth = () => ({
    overallHealth: Math.random() * 40 + 60,
    diseaseRisk: Math.random() * 30 + 10,
    pestRisk: Math.random() * 25 + 5,
    nutritionScore: Math.random() * 30 + 70,
    growthStage: 'Flowering',
    lastUpdate: Date.now()
  });

  const generateOverviewMetrics = () => ({
    totalFarms: 3,
    totalArea: 15.5,
    activeCrops: 4,
    avgYield: 2.8,
    profitMargin: 23.5,
    efficiency: 87.2,
    waterUsage: 1250,
    energyConsumption: 340
  });

  const generateTrendData = () => {
    const days = [];
    const current = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(current);
      date.setDate(date.getDate() - i);
      
      days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        yield: Math.random() * 50 + 100,
        weather: Math.random() * 40 + 60,
        health: Math.random() * 30 + 70,
        moisture: Math.random() * 40 + 40,
        temperature: Math.random() * 15 + 20
      });
    }
    
    return days;
  };

  const generateSmartAlerts = () => [
    {
      id: 1,
      type: 'warning',
      title: 'Irrigation Needed',
      message: 'Soil moisture in Field A is below optimal level',
      priority: 'high',
      timestamp: Date.now() - 1000 * 60 * 30,
      action: 'Schedule Irrigation'
    },
    {
      id: 2,
      type: 'info',
      title: 'Weather Update',
      message: 'Rain expected in next 48 hours - adjust irrigation schedule',
      priority: 'medium',
      timestamp: Date.now() - 1000 * 60 * 60 * 2,
      action: 'View Forecast'
    },
    {
      id: 3,
      type: 'success',
      title: 'Harvest Ready',
      message: 'Tomatoes in Field C are ready for harvest',
      priority: 'high',
      timestamp: Date.now() - 1000 * 60 * 60 * 6,
      action: 'Schedule Harvest'
    }
  ];

  const generateDashboardRecommendations = () => [
    'Apply nitrogen fertilizer to boost crop growth',
    'Monitor pest activity - increased aphid risk detected',
    'Optimize irrigation schedule based on weather forecast',
    'Consider companion planting for natural pest control'
  ];

  const getTimeRangeLabel = () => {
    const ranges = {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 3 Months',
      '1y': 'Last Year'
    };
    return ranges[selectedTimeRange];
  };

  const renderOverviewTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Key Metrics Cards */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.primaryMetric]}>
            <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.metricGradient}>
              <Icon name="eco" size={32} color="#fff" />
              <Text style={styles.metricValue}>{dashboardData?.overview.totalFarms}</Text>
              <Text style={styles.metricLabel}>Active Farms</Text>
            </LinearGradient>
          </View>
          <View style={[styles.metricCard, styles.secondaryMetric]}>
            <Icon name="landscape" size={24} color="#4CAF50" />
            <Text style={styles.secondaryMetricValue}>{dashboardData?.overview.totalArea} ha</Text>
            <Text style={styles.secondaryMetricLabel}>Total Area</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.secondaryMetric}>
            <Icon name="grass" size={24} color="#FF9800" />
            <Text style={styles.secondaryMetricValue}>{dashboardData?.overview.activeCrops}</Text>
            <Text style={styles.secondaryMetricLabel}>Crop Types</Text>
          </View>
          <View style={styles.secondaryMetric}>
            <Icon name="trending-up" size={24} color="#2196F3" />
            <Text style={styles.secondaryMetricValue}>{dashboardData?.overview.avgYield}t/ha</Text>
            <Text style={styles.secondaryMetricLabel}>Avg Yield</Text>
          </View>
          <View style={styles.secondaryMetric}>
            <Icon name="attach-money" size={24} color="#4CAF50" />
            <Text style={styles.secondaryMetricValue}>{dashboardData?.overview.profitMargin}%</Text>
            <Text style={styles.secondaryMetricLabel}>Profit Margin</Text>
          </View>
        </View>
      </View>

      {/* Weather Widget */}
      <View style={styles.weatherWidget}>
        <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.weatherGradient}>
          <View style={styles.weatherHeader}>
            <Icon name="wb-sunny" size={32} color="#fff" />
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherTemp}>{Math.round(dashboardData?.weather?.temperature || 25)}°C</Text>
              <Text style={styles.weatherDesc}>{dashboardData?.weather?.description || 'Clear sky'}</Text>
            </View>
          </View>
          <View style={styles.weatherDetails}>
            <View style={styles.weatherDetailItem}>
              <Icon name="opacity" size={20} color="#fff" />
              <Text style={styles.weatherDetailText}>{dashboardData?.weather?.humidity || 65}%</Text>
            </View>
            <View style={styles.weatherDetailItem}>
              <Icon name="air" size={20} color="#fff" />
              <Text style={styles.weatherDetailText}>{dashboardData?.weather?.windSpeed || 5} km/h</Text>
            </View>
            <View style={styles.weatherDetailItem}>
              <Icon name="visibility" size={20} color="#fff" />
              <Text style={styles.weatherDetailText}>{Math.round((dashboardData?.weather?.visibility || 10000) / 1000)} km</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Smart Alerts */}
      <View style={styles.alertsSection}>
        <Text style={styles.sectionTitle}>Smart Alerts</Text>
        {dashboardData?.alerts.map(alert => (
          <View key={alert.id} style={[styles.alertCard, styles[`${alert.type}Alert`]]}>
            <View style={styles.alertHeader}>
              <Icon 
                name={alert.type === 'warning' ? 'warning' : alert.type === 'info' ? 'info' : 'check-circle'} 
                size={24} 
                color={alert.type === 'warning' ? '#FF9800' : alert.type === 'info' ? '#2196F3' : '#4CAF50'} 
              />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>
                  {Math.round((Date.now() - alert.timestamp) / (1000 * 60))} minutes ago
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.alertAction}>
              <Text style={styles.alertActionText}>{alert.action}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* AI Recommendations */}
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>AI Recommendations</Text>
        {dashboardData?.recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Icon name="lightbulb-outline" size={20} color="#4CAF50" />
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderTrendsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Yield Trend Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Yield Trends - {getTimeRangeLabel()}</Text>
        <View style={styles.chartWrapper}>
          <LineChart
            width={width - 60}
            height={220}
            data={dashboardData?.trends || []}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="date" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ccc',
                borderRadius: 8
              }}
            />
            <Line 
              type="monotone" 
              dataKey="yield" 
              stroke="#4CAF50" 
              strokeWidth={3}
              dot={{ fill: '#4CAF50', strokeWidth: 2, r: 6 }}
            />
          </LineChart>
        </View>
      </View>

      {/* Weather Impact Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weather Impact on Crop Health</Text>
        <View style={styles.chartWrapper}>
          <AreaChart
            width={width - 60}
            height={200}
            data={dashboardData?.trends || []}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="date" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="health" 
              stackId="1"
              stroke="#2196F3" 
              fill="#2196F3" 
              fillOpacity={0.6}
            />
          </AreaChart>
        </View>
      </View>

      {/* Multi-metric Comparison */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Multi-Metric Analysis</Text>
        <View style={styles.chartWrapper}>
          <BarChart
            width={width - 60}
            height={200}
            data={dashboardData?.trends || []}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="date" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip />
            <Bar dataKey="moisture" fill="#4CAF50" />
            <Bar dataKey="temperature" fill="#FF9800" />
          </BarChart>
        </View>
      </View>
    </ScrollView>
  );

  const renderPerformanceTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Performance Metrics */}
      <View style={styles.performanceContainer}>
        <View style={styles.performanceCard}>
          <View style={styles.performanceHeader}>
            <Icon name="speed" size={28} color="#4CAF50" />
            <Text style={styles.performanceTitle}>Farm Efficiency</Text>
          </View>
          <View style={styles.performanceMetric}>
            <Text style={styles.performanceValue}>{dashboardData?.overview.efficiency}%</Text>
            <Text style={styles.performanceLabel}>Overall Score</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${dashboardData?.overview.efficiency}%` }]} />
          </View>
        </View>

        <View style={styles.performanceCard}>
          <View style={styles.performanceHeader}>
            <Icon name="water-drop" size={28} color="#2196F3" />
            <Text style={styles.performanceTitle}>Water Usage</Text>
          </View>
          <View style={styles.performanceMetric}>
            <Text style={styles.performanceValue}>{dashboardData?.overview.waterUsage}L</Text>
            <Text style={styles.performanceLabel}>This Month</Text>
          </View>
          <Text style={styles.performanceChange}>-15% vs last month</Text>
        </View>

        <View style={styles.performanceCard}>
          <View style={styles.performanceHeader}>
            <Icon name="flash-on" size={28} color="#FF9800" />
            <Text style={styles.performanceTitle}>Energy Usage</Text>
          </View>
          <View style={styles.performanceMetric}>
            <Text style={styles.performanceValue}>{dashboardData?.overview.energyConsumption} kWh</Text>
            <Text style={styles.performanceLabel}>This Month</Text>
          </View>
          <Text style={styles.performanceChange}>+8% vs last month</Text>
        </View>
      </View>

      {/* Crop Health Distribution */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Crop Health Distribution</Text>
        <View style={styles.pieChartContainer}>
          <PieChart width={width - 60} height={250}>
            <Pie
              data={[
                { name: 'Excellent', value: 35, fill: '#4CAF50' },
                { name: 'Good', value: 45, fill: '#8BC34A' },
                { name: 'Fair', value: 15, fill: '#FF9800' },
                { name: 'Poor', value: 5, fill: '#f44336' }
              ]}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            />
            <Tooltip />
          </PieChart>
        </View>
      </View>
    </ScrollView>
  );

  const renderTimeRangeTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeRangeTabs}>
      {['7d', '30d', '90d', '1y'].map(range => (
        <TouchableOpacity
          key={range}
          style={[styles.timeRangeTab, selectedTimeRange === range && styles.activeTimeRangeTab]}
          onPress={() => setSelectedTimeRange(range)}
        >
          <Text style={[
            styles.timeRangeText,
            selectedTimeRange === range && styles.activeTimeRangeText
          ]}>
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 
             range === '90d' ? '3 Months' : '1 Year'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Icon name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview', icon: 'dashboard' },
            { key: 'trends', label: 'Trends', icon: 'trending-up' },
            { key: 'performance', label: 'Performance', icon: 'speed' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Icon 
                name={tab.icon} 
                size={20} 
                color={activeTab === tab.key ? '#4CAF50' : '#666'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Time Range Selection */}
      {activeTab !== 'overview' && renderTimeRangeTabs()}

      {/* Tab Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'trends' && renderTrendsTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#E8F5E8',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  timeRangeTabs: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  timeRangeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeTimeRangeTab: {
    backgroundColor: '#4CAF50',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTimeRangeText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  metricsContainer: {
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    marginRight: 16,
  },
  primaryMetric: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  metricGradient: {
    padding: 20,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  secondaryMetric: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  secondaryMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  secondaryMetricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  weatherWidget: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  weatherGradient: {
    padding: 20,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherInfo: {
    marginLeft: 16,
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  weatherDesc: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherDetailText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  alertsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
  },
  warningAlert: {
    borderLeftColor: '#FF9800',
  },
  infoAlert: {
    borderLeftColor: '#2196F3',
  },
  successAlert: {
    borderLeftColor: '#4CAF50',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  alertAction: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
  },
  alertActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendationsSection: {
    marginBottom: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  recommendationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartWrapper: {
    alignItems: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  performanceContainer: {
    marginBottom: 20,
  },
  performanceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  performanceMetric: {
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  performanceChange: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
});

export default AnalyticsDashboardScreen;
