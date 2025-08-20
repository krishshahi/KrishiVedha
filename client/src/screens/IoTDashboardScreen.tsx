import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { iotIntegrationService } from '../services/iotIntegrationService';

const { width } = Dimensions.get('window');

// Utility function to safely render any complex object as text
const safeRenderObject = (obj: any, fallback = 'N/A'): string => {
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
const safeText = (value: any, fallback = 'N/A'): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return safeRenderObject(value, fallback);
  return String(value);
};

interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightIntensity: number;
  ph: number;
  timestamp: Date;
}

interface DeviceStatus {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'maintenance';
  batteryLevel: number;
  lastSeen: Date;
}

interface AutomationRule {
  id: string;
  name: string;
  condition: string | any;
  action: string | any;
  enabled: boolean;
  lastTriggered?: Date;
}

const IoTDashboardScreen: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load sensor data
      const sensors = await iotIntegrationService.getSensorData();
      if (sensors.length > 0) {
        setSensorData(sensors[0]);
      }

      // Load device status
      const deviceList = await iotIntegrationService.getConnectedDevices();
      setDevices(deviceList);

      // Load automation rules
      const rules = await iotIntegrationService.getAutomationRules();
      setAutomationRules(rules);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const toggleIrrigation = async () => {
    try {
      await iotIntegrationService.controlIrrigation(true, 15); // 15 minutes
      Alert.alert('Success', 'Irrigation started for 15 minutes');
      loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to start irrigation');
    }
  };

  const toggleAutomationRule = async (ruleId: string, enabled: boolean) => {
    try {
      const updatedRules = automationRules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled } : rule
      );
      setAutomationRules(updatedRules);
      
      Alert.alert(
        'Success', 
        `Automation rule ${enabled ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update automation rule');
    }
  };

  const renderSensorCard = (title: string, value: string, icon: string, color: string) => (
    <View style={[styles.sensorCard, { borderLeftColor: color }]}>
      <View style={styles.sensorHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.sensorTitle}>{title}</Text>
      </View>
      <Text style={[styles.sensorValue, { color }]}>{value}</Text>
    </View>
  );

  const renderDeviceCard = (device: DeviceStatus) => (
    <View key={device.id} style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceType}>{device.type}</Text>
        </View>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: device.status === 'online' ? COLORS.success : COLORS.error }
        ]} />
      </View>
      <View style={styles.deviceDetails}>
        <Text style={styles.deviceDetail}>
          Battery: {device.batteryLevel}%
        </Text>
        <Text style={styles.deviceDetail}>
          Last seen: {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : 'N/A'}
        </Text>
      </View>
    </View>
  );

  const renderAutomationRule = (rule: AutomationRule) => (
    <View key={rule.id} style={styles.ruleCard}>
      <View style={styles.ruleHeader}>
        <Text style={styles.ruleName}>{rule.name}</Text>
        <TouchableOpacity
          onPress={() => toggleAutomationRule(rule.id, !rule.enabled)}
          style={[
            styles.toggleButton,
            { backgroundColor: rule.enabled ? COLORS.primary : COLORS.textLight }
          ]}
        >
          <Text style={[
            styles.toggleButtonText,
            { color: rule.enabled ? COLORS.textWhite : COLORS.text.primary }
          ]}>
            {rule.enabled ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.ruleCondition}>When: {safeText(rule.condition, 'No condition specified')}</Text>
      <Text style={styles.ruleAction}>Then: {safeText(rule.action, 'No action specified')}</Text>
      {rule.lastTriggered && (
        <Text style={styles.ruleLastTriggered}>
          Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading IoT Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>IoT Dashboard</Text>
          <Text style={styles.subtitle}>Smart Farm Monitoring</Text>
        </View>

        {/* Sensor Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environmental Sensors</Text>
          <View style={styles.sensorGrid}>
            {sensorData && (
              <>
                {renderSensorCard(
                  'Temperature', 
                  `${sensorData.temperature}°C`, 
                  'thermometer-outline', 
                  COLORS.error
                )}
                {renderSensorCard(
                  'Humidity', 
                  `${sensorData.humidity}%`, 
                  'water-outline', 
                  COLORS.info
                )}
                {renderSensorCard(
                  'Soil Moisture', 
                  `${sensorData.soilMoisture}%`, 
                  'leaf-outline', 
                  COLORS.success
                )}
                {renderSensorCard(
                  'Light', 
                  `${sensorData.lightIntensity} lux`, 
                  'sunny-outline', 
                  COLORS.warning
                )}
                {renderSensorCard(
                  'pH Level', 
                  sensorData.ph.toFixed(1), 
                  'flask-outline', 
                  COLORS.secondary
                )}
              </>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleIrrigation}>
              <Ionicons name="water" size={24} color={COLORS.textWhite} />
              <Text style={styles.actionButtonText}>Start Irrigation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
              <Ionicons name="refresh-outline" size={24} color={COLORS.primary} />
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                Ventilation
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connected Devices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Devices ({devices.length})</Text>
          {devices.map(renderDeviceCard)}
        </View>

        {/* Automation Rules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Automation Rules</Text>
          {automationRules.map(renderAutomationRule)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sensorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: (width - 48) / 2,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sensorTitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
  sensorValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  deviceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  deviceType: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textTransform: 'capitalize',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deviceDetail: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  ruleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ruleCondition: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  ruleAction: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  ruleLastTriggered: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
});

export default IoTDashboardScreen;
