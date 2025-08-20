import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import LinearGradient from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, FontAwesome5, Entypo } from '@expo/vector-icons';
import iotIntegrationService from '../services/iotIntegrationService';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;

// Utility function to safely render any complex object as text
const safeRenderObject = (obj, fallback = 'N/A') => {
  try {
    if (obj === null || obj === undefined) return fallback;
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
    if (typeof obj === 'object') {
      // Convert object to string to prevent rendering issues
      if (obj.type && typeof obj.type === 'string') return obj.type.replace('_', ' ');
      if (obj.name && typeof obj.name === 'string') return obj.name;
      if (obj.message && typeof obj.message === 'string') return obj.message;
      // Last resort: stringify the object safely
      return JSON.stringify(obj).substring(0, 50) + '...';
    }
    return String(obj);
  } catch (error) {
    console.error('Error in safeRenderObject:', error);
    return fallback;
  }
};

// Additional safety wrapper for any text rendering
const safeText = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return safeRenderObject(value, fallback);
  return String(value);
};

const IoTDashboardScreen = ({ navigation, route }) => {
  const [deviceData, setDeviceData] = useState([]);
  const [sensorData, setSensorData] = useState({});
  const [environmentalData, setEnvironmentalData] = useState([]);
  const [automationRules, setAutomationRules] = useState([]);
  const [irrigationSchedule, setIrrigationSchedule] = useState([]);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    deviceId: '',
    sensorType: 'soil_moisture',
    operator: 'less_than',
    value: 30,
    action: 'irrigation_start'
  });

  const farmId = route.params?.farmId || 'default-farm';

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadRealTimeData();
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [
        devices,
        environmental,
        rules,
        schedule,
        sensors
      ] = await Promise.all([
        iotIntegrationService.getConnectedDevices(farmId),
        iotIntegrationService.getEnvironmentalData(farmId, selectedTimeRange),
        iotIntegrationService.getAutomationRules(farmId),
        iotIntegrationService.getIrrigationSchedule(farmId),
        iotIntegrationService.fetchAllSensorData()
      ]);

      setConnectedDevices(Array.isArray(devices) ? devices : (devices?.devices || []));
      setEnvironmentalData(Array.isArray(environmental) ? environmental : (environmental?.data || []));
      
      // Debug and sanitize automation rules
      const sanitizedRules = Array.isArray(rules) ? rules.map(rule => ({
        ...rule,
        action: typeof rule.action === 'object' ? JSON.stringify(rule.action) : rule.action,
        trigger: typeof rule.trigger === 'object' ? JSON.stringify(rule.trigger) : rule.trigger
      })) : [];
      console.log('🔍 Sanitized automation rules:', sanitizedRules);
      setAutomationRules(sanitizedRules);
      
      setIrrigationSchedule(Array.isArray(schedule) ? schedule : (schedule?.schedule || []));
      setSensorData(sensors?.data || {});
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load IoT dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const sensors = await iotIntegrationService.fetchAllSensorData();
      setSensorData(sensors.data || {});
    } catch (error) {
      console.error('Error loading real-time data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const toggleIrrigation = async (zoneId, currentStatus) => {
    try {
      const action = currentStatus === 'running' ? 'stop' : 'start';
      const result = await iotIntegrationService.controlIrrigation(zoneId, action, 20);
      
      if (result.success) {
        Alert.alert(
          'Success', 
          `Irrigation ${action === 'start' ? 'started' : 'stopped'} successfully`
        );
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error controlling irrigation:', error);
      Alert.alert('Error', 'Failed to control irrigation system');
    }
  };

  const addAutomationRule = async () => {
    try {
      const result = await iotIntegrationService.createAutomationRule({
        ...newRule,
        farmId,
        enabled: true
      });

      if (result) {
        setShowAddRuleModal(false);
        setNewRule({
          name: '',
          deviceId: '',
          sensorType: 'soil_moisture',
          operator: 'less_than',
          value: 30,
          action: 'irrigation_start'
        });
        await loadDashboardData();
        Alert.alert('Success', 'Automation rule created successfully');
      }
    } catch (error) {
      console.error('Error creating automation rule:', error);
      Alert.alert('Error', 'Failed to create automation rule');
    }
  };

  const getDeviceStatusColor = (status) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'offline': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getSensorStatusColor = (value, type) => {
    const ranges = {
      temperature: { good: [20, 30], warning: [15, 35] },
      humidity: { good: [50, 80], warning: [40, 90] },
      soil_moisture: { good: [40, 70], warning: [30, 80] }
    };

    const range = ranges[type];
    if (!range) return '#4CAF50';

    if (value >= range.good[0] && value <= range.good[1]) return '#4CAF50';
    if (value >= range.warning[0] && value <= range.warning[1]) return '#FF9800';
    return '#F44336';
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#4CAF50'
    }
  };

  const renderOverviewTab = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Real-time Sensor Data */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="sensors" size={24} color="#4CAF50" />
          <Text style={styles.sectionTitle}>Live Sensor Data</Text>
        </View>
        
        <View style={styles.sensorGrid}>
        {sensorData && typeof sensorData === 'object' && Object.entries(sensorData).map(([sensor, value]) => (
          <View key={sensor} style={styles.sensorCard}>
            <View style={[styles.sensorIndicator, { 
              backgroundColor: getSensorStatusColor(value, sensor) 
            }]} />
            <Text style={styles.sensorLabel}>
              {sensor.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.sensorValue}>
              {typeof value === 'number' ? value.toFixed(1) : value}
              {sensor.includes('temperature') ? '°C' : 
               sensor.includes('humidity') || sensor.includes('moisture') ? '%' : ''}
            </Text>
          </View>
        ))}
        </View>
      </View>

      {/* Connected Devices */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="hardware-chip" size={24} color="#2196F3" />
          <Text style={styles.sectionTitle}>Connected Devices</Text>
        </View>
        
        {Array.isArray(connectedDevices) && connectedDevices.map((device) => (
          <View key={device?.id || Math.random()} style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <View style={styles.deviceHeader}>
                <Text style={styles.deviceName}>{device?.name || 'Unknown Device'}</Text>
                <View style={[styles.statusIndicator, {
                  backgroundColor: getDeviceStatusColor(device?.status)
                }]} />
              </View>
              <Text style={styles.deviceType}>{(device?.type || 'unknown').toUpperCase()}</Text>
              <Text style={styles.deviceLocation}>Zone: {device?.location?.zone || 'N/A'}</Text>
            </View>
            
            {device?.batteryLevel && (
              <View style={styles.batteryInfo}>
                <Ionicons 
                  name={device.batteryLevel > 50 ? "battery-full" : 
                        device.batteryLevel > 20 ? "battery-half" : "battery-dead"} 
                  size={20} 
                  color={device.batteryLevel > 20 ? "#4CAF50" : "#F44336"} 
                />
                <Text style={styles.batteryText}>{device.batteryLevel}%</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="tools" size={24} color="#FF9800" />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#E3F2FD' }]}
            onPress={() => toggleIrrigation('A', 'stopped')}
          >
            <FontAwesome5 name="tint" size={24} color="#2196F3" />
            <Text style={styles.quickActionText}>Start Irrigation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#E8F5E8' }]}
            onPress={() => setShowAddRuleModal(true)}
          >
            <MaterialIcons name="auto-awesome" size={24} color="#4CAF50" />
            <Text style={styles.quickActionText}>Add Rule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#FFF3E0' }]}
            onPress={() => navigation.navigate('DeviceSettings')}
          >
            <Ionicons name="settings" size={24} color="#FF9800" />
            <Text style={styles.quickActionText}>Device Config</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#FCE4EC' }]}
            onPress={() => navigation.navigate('IoTAnalytics')}
          >
            <MaterialIcons name="analytics" size={24} color="#E91E63" />
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderChartsTab = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.timeRangeSelector}>
        {['24h', '7d', '30d'].map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              selectedTimeRange === range && styles.timeRangeButtonActive
            ]}
            onPress={() => setSelectedTimeRange(range)}
          >
            <Text style={[
              styles.timeRangeText,
              selectedTimeRange === range && styles.timeRangeTextActive
            ]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {environmentalData.length > 0 && (
        <>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Temperature Trend</Text>
            <LineChart
              data={{
                labels: environmentalData.slice(-8).map((_, index) => 
                  selectedTimeRange === '24h' ? `${index * 3}h` : `Day ${index + 1}`
                ),
                datasets: [{
                  data: environmentalData.slice(-8).map(d => d.temperature),
                  color: () => '#FF6B6B'
                }]
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`
              }}
              style={styles.chart}
            />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Humidity & Soil Moisture</Text>
            <LineChart
              data={{
                labels: environmentalData.slice(-8).map((_, index) => 
                  selectedTimeRange === '24h' ? `${index * 3}h` : `Day ${index + 1}`
                ),
                datasets: [
                  {
                    data: environmentalData.slice(-8).map(d => d.humidity),
                    color: () => '#4ECDC4'
                  },
                  {
                    data: environmentalData.slice(-8).map(d => d.soil_moisture),
                    color: () => '#45B7D1'
                  }
                ]
              }}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderAutomationTab = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Automation Rules */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="auto-awesome" size={24} color="#9C27B0" />
          <Text style={styles.sectionTitle}>Automation Rules</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddRuleModal(true)}
          >
            <MaterialIcons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {Array.isArray(automationRules) && automationRules.map((rule) => (
          <View key={rule?.id || Math.random()} style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <Text style={styles.ruleName}>{rule?.name || 'Unknown Rule'}</Text>
              <View style={[styles.ruleStatus, {
                backgroundColor: rule?.enabled ? '#4CAF50' : '#9E9E9E'
              }]}>
                <Text style={styles.ruleStatusText}>
                  {rule?.enabled ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <Text style={styles.ruleDescription}>
              When {safeText(rule?.trigger?.sensorType?.replace?.('_', ' '), 'sensor')} is {safeText(rule?.trigger?.operator?.replace?.('_', ' '), 'condition')} {safeText(rule?.trigger?.value, 'value')}
            </Text>
            <Text style={styles.ruleAction}>
              Action: {safeText(rule?.action, 'unknown action')}
            </Text>
          </View>
        ))}
      </View>

      {/* Irrigation Schedule */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="clock" size={24} color="#FF9800" />
          <Text style={styles.sectionTitle}>Irrigation Schedule</Text>
        </View>

        {Array.isArray(irrigationSchedule) && irrigationSchedule.map((schedule) => (
          <View key={schedule?.id || Math.random()} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleZone}>Zone {schedule?.zone || 'N/A'}</Text>
              <Text style={styles.scheduleTime}>{schedule?.time || 'N/A'}</Text>
            </View>
            <View style={styles.scheduleDetails}>
              <Text style={styles.scheduleInfo}>
                Duration: {schedule?.duration || 0} minutes
              </Text>
              <Text style={styles.scheduleInfo}>
                Days: {Array.isArray(schedule?.days) ? schedule.days.join(', ') : 'N/A'}
              </Text>
              <Text style={styles.scheduleInfo}>
                Moisture threshold: {schedule?.moisture_threshold || 0}%
              </Text>
            </View>
            <View style={[styles.scheduleStatus, {
              backgroundColor: schedule?.enabled ? '#E8F5E8' : '#FFEBEE'
            }]}>
              <Text style={[styles.scheduleStatusText, {
                color: schedule?.enabled ? '#4CAF50' : '#F44336'
              }]}>
                {schedule?.enabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderAddRuleModal = () => (
    <Modal
      visible={showAddRuleModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddRuleModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Automation Rule</Text>
          <TouchableOpacity onPress={() => setShowAddRuleModal(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Rule Name</Text>
            <TextInput
              style={styles.textInput}
              value={newRule.name}
              onChangeText={(text) => setNewRule({...newRule, name: text})}
              placeholder="Enter rule name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sensor Type</Text>
            <View style={styles.pickerContainer}>
              {['soil_moisture', 'temperature', 'humidity'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    newRule.sensorType === type && styles.pickerOptionActive
                  ]}
                  onPress={() => setNewRule({...newRule, sensorType: type})}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    newRule.sensorType === type && styles.pickerOptionTextActive
                  ]}>
                    {type.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Condition</Text>
            <View style={styles.pickerContainer}>
              {[
                { key: 'less_than', label: 'Less than' },
                { key: 'greater_than', label: 'Greater than' },
                { key: 'equals', label: 'Equals' }
              ].map((operator) => (
                <TouchableOpacity
                  key={operator.key}
                  style={[
                    styles.pickerOption,
                    newRule.operator === operator.key && styles.pickerOptionActive
                  ]}
                  onPress={() => setNewRule({...newRule, operator: operator.key})}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    newRule.operator === operator.key && styles.pickerOptionTextActive
                  ]}>
                    {operator.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Threshold Value</Text>
            <TextInput
              style={styles.textInput}
              value={newRule.value.toString()}
              onChangeText={(text) => setNewRule({...newRule, value: parseFloat(text) || 0})}
              placeholder="Enter threshold value"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={addAutomationRule}>
            <Text style={styles.saveButtonText}>Create Rule</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>IoT Dashboard</Text>
          <TouchableOpacity onPress={onRefresh}>
            <MaterialIcons name="refresh" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview', icon: 'dashboard' },
          { key: 'charts', label: 'Charts', icon: 'show-chart' },
          { key: 'automation', label: 'Automation', icon: 'auto-awesome' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialIcons 
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
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading IoT Dashboard...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'charts' && renderChartsTab()}
            {activeTab === 'automation' && renderAutomationTab()}
          </>
        )}
      </View>

      {renderAddRuleModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sensorCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
  },
  sensorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  sensorLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  sensorValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceType: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  deviceLocation: {
    fontSize: 10,
    color: '#666',
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
  },
  ruleCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ruleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ruleStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ruleStatusText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  ruleDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  ruleAction: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  scheduleCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scheduleZone: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scheduleDetails: {
    marginBottom: 8,
  },
  scheduleInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  scheduleStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scheduleStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerOption: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  pickerOptionActive: {
    backgroundColor: '#4CAF50',
  },
  pickerOptionText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  pickerOptionTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default IoTDashboardScreen;
