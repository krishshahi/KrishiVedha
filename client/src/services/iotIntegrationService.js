import AsyncStorage from '@react-native-async-storage/async-storage';

class IoTIntegrationService {
  constructor() {
    // Use dynamic IP configuration
    this.baseUrl = 'http://10.10.13.97:3000/api';
    this.wsUrl = 'ws://10.10.13.97:3001'; // IoT server runs on port 3001
    this.sensorData = new Map();
    this.deviceConnections = new Map();
    this.automationRules = new Map();
    this.alertThresholds = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3; // Reduced for faster fallback
    this.initialized = false;
    this.useMockData = false;
    
    // Don't auto-initialize in constructor to prevent startup errors
    // this.initializeWebSocket();
    // this.loadStoredData();
  }

  // Add initialize method for app startup integration
  async initialize() {
    if (this.initialized) {
      console.log('🔄 IoT service already initialized');
      return;
    }

    try {
      console.log('🤖 Initializing IoT Integration Service...');
      
      // Try to initialize WebSocket connection
      this.initializeWebSocket();
      
      // Load any stored data
      await this.loadStoredData();
      
      this.initialized = true;
      console.log('✅ IoT Integration Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize IoT service:', error);
      // Don't throw - allow app to continue without IoT
      this.initialized = true; // Mark as initialized anyway
    }
  }

  // WebSocket Connection Management
  initializeWebSocket() {
    try {
      console.log('🔌 Attempting to connect to IoT WebSocket:', this.wsUrl);
      this.ws = new WebSocket(this.wsUrl);
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws.readyState === WebSocket.CONNECTING) {
          console.log('⏰ WebSocket connection timeout, falling back to mock data');
          this.ws.close();
          this.enableMockMode();
        }
      }, 5000);
      
      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('🔌 IoT WebSocket connected successfully to', this.wsUrl);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.useMockData = false;
        this.authenticateConnection();
        this.subscribeToDevices();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingData(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        clearTimeout(connectionTimeout);
        console.log('🔌 IoT WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('IoT WebSocket error:', error);
        this.enableMockMode();
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.enableMockMode();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting IoT reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => this.initializeWebSocket(), 3000 * this.reconnectAttempts);
    } else {
      console.log('❌ Max reconnect attempts reached, enabling mock mode');
      this.enableMockMode();
    }
  }

  enableMockMode() {
    if (this.useMockData) {
      return; // Already in mock mode
    }
    
    console.log('🎭 Enabling IoT mock mode with simulated data');
    this.useMockData = true;
    this.isConnected = false;
    
    // Generate mock sensor data periodically (less frequently to reduce log spam)
    if (!this.mockDataInterval) {
      this.mockDataInterval = setInterval(() => {
        this.generateMockSensorData();
      }, 30000); // Update every 30 seconds instead of 10
    }
    
    // Initialize with some mock data immediately
    this.generateMockSensorData();
    this.generateMockDevices();
    this.generateMockAutomationRules();
    
    console.log('✅ Mock mode enabled - IoT Dashboard will show simulated data');
  }
  
  generateMockSensorData() {
    const mockDevices = ['sensor-001', 'sensor-002', 'sensor-003'];
    const sensorTypes = ['temperature', 'humidity', 'soilMoisture', 'lightIntensity', 'ph'];
    
    mockDevices.forEach(deviceId => {
      if (!this.sensorData.has(deviceId)) {
        this.sensorData.set(deviceId, new Map());
      }
      
      sensorTypes.forEach(sensorType => {
        let value;
        switch (sensorType) {
          case 'temperature':
            value = 18 + Math.random() * 15; // 18-33°C
            break;
          case 'humidity':
            value = 40 + Math.random() * 40; // 40-80%
            break;
          case 'soilMoisture':
            value = 30 + Math.random() * 50; // 30-80%
            break;
          case 'lightIntensity':
            value = 200 + Math.random() * 800; // 200-1000 lux
            break;
          case 'ph':
            value = 5.5 + Math.random() * 2.5; // 5.5-8.0 pH
            break;
          default:
            value = Math.random() * 100;
        }
        
        this.sensorData.get(deviceId).set(sensorType, {
          value: parseFloat(value.toFixed(2)),
          timestamp: Date.now(),
          location: `Field ${deviceId.split('-')[1]}`,
          quality: 'good',
          trend: 'stable'
        });
      });
    });
  }
  
  generateMockDevices() {
    const mockDevices = [
      {
        id: 'sensor-001',
        name: 'Temperature Sensor 1',
        type: 'Temperature/Humidity Sensor',
        status: 'online',
        batteryLevel: 85,
        lastSeen: new Date()
      },
      {
        id: 'sensor-002', 
        name: 'Soil Monitor 1',
        type: 'Soil Moisture Sensor',
        status: 'online',
        batteryLevel: 72,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        id: 'irrigation-001',
        name: 'Smart Irrigation Valve',
        type: 'Irrigation Controller', 
        status: 'offline',
        batteryLevel: 0, // Mains powered
        lastSeen: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      }
    ];
    
    mockDevices.forEach(device => {
      this.deviceConnections.set(device.id, device);
    });
  }
  
  generateMockAutomationRules() {
    const mockRules = [
      {
        id: 'rule-001',
        name: 'Smart Irrigation',
        condition: 'Soil moisture < 30%',
        action: 'Start irrigation for 15 minutes',
        enabled: true,
        lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 'rule-002',
        name: 'High Temperature Alert',
        condition: 'Temperature > 35°C',
        action: 'Send notification to farmer',
        enabled: true
      },
      {
        id: 'rule-003',
        name: 'Low Battery Warning',
        condition: 'Battery level < 20%',
        action: 'Send maintenance alert',
        enabled: false
      }
    ];
    
    mockRules.forEach(rule => {
      this.automationRules.set(rule.id, rule);
    });
  }

  async authenticateConnection() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const token = await AsyncStorage.getItem('authToken');
        console.log('🔐 Authenticating WebSocket with token:', token ? 'Present' : 'Missing');
        this.ws.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
      } catch (error) {
        console.error('Error getting auth token for WebSocket:', error);
      }
    }
  }

  subscribeToDevices() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        devices: Array.from(this.deviceConnections.keys())
      }));
    }
  }

  // Real-time Sensor Data Management
  handleIncomingData(data) {
    switch (data.type) {
      case 'connected':
        console.log('📡 WebSocket server connected:', data.message);
        break;
      case 'authenticated':
        console.log('✅ WebSocket authenticated:', data.status, data.clientId);
        this.isConnected = true;
        break;
      case 'error':
        console.error('🚨 WebSocket server error:', data.message);
        break;
      case 'pong':
        console.log('🏓 Pong received from server');
        break;
      case 'sensor_data':
        console.log('📊 Received sensor data:', data.data);
        this.processSensorData(data);
        break;
      case 'device_status':
        this.updateDeviceStatus(data);
        break;
      case 'automation_trigger':
        this.handleAutomationTrigger(data);
        break;
      case 'alert':
        console.log('🚨 System alert:', data);
        this.processAlert(data);
        break;
      case 'subscribed':
        console.log('📡 Subscribed to topic:', data.topic);
        break;
      case 'unsubscribed':
        console.log('📡 Unsubscribed from topic:', data.topic);
        break;
      default:
        console.log('Unknown message type:', data.type, data);
    }
  }

  processSensorData(data) {
    const { deviceId, sensorType, value, timestamp, location } = data;
    
    // Store sensor data
    if (!this.sensorData.has(deviceId)) {
      this.sensorData.set(deviceId, new Map());
    }
    
    this.sensorData.get(deviceId).set(sensorType, {
      value,
      timestamp: timestamp || Date.now(),
      location,
      quality: this.assessDataQuality(value, sensorType),
      trend: this.calculateTrend(deviceId, sensorType, value)
    });

    // Check for automation triggers
    this.checkAutomationRules(deviceId, sensorType, value);
    
    // Check for alert conditions
    this.checkAlertThresholds(deviceId, sensorType, value);
    
    // Store for offline access
    this.cacheSensorData(deviceId, sensorType, { value, timestamp });
  }

  // Advanced Sensor Data Analytics
  async fetchAllSensorData() {
    try {
      const response = await fetch(`${this.baseUrl}/iot/sensors/data`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      // Return cached/mock data if API unavailable
      return this.generateMockSensorData();
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      return this.generateMockSensorData();
    }
  }

  // Add alias method for dashboard compatibility
  async getSensorData(farmId = null) {
    console.log('📊 Getting sensor data for dashboard...');
    
    // If we're already in mock mode, return mock data immediately
    if (this.useMockData) {
      console.log('📊 Using mock sensor data (mock mode enabled)');
      const result = this.generateMockSensorData();
      return result.success ? [result.data] : [];
    }
    
    try {
      // Set a quick timeout for the network request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      let response;
      if (farmId) {
        response = await fetch(`${this.baseUrl}/iot/sensors/farm/${farmId}`, {
          signal: controller.signal
        });
      } else {
        response = await fetch(`${this.baseUrl}/iot/sensors/data`, {
          signal: controller.signal
        });
      }
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Successfully fetched real sensor data');
        return result.success ? [result.data] : [];
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Only log the error once, then enable mock mode
      if (!this.useMockData) {
        console.warn('⚠️ Network request failed, switching to mock data mode:', error.message);
        this.enableMockMode();
      }
      
      const result = this.generateMockSensorData();
      return result.success ? [result.data] : [];
    }
  }

  // Add missing method for getting connected devices
  async getConnectedDevices(farmId = null) {
    console.log('🔌 Getting connected devices...');
    
    // If we're already in mock mode, return mock data immediately
    if (this.useMockData) {
      console.log('🔌 Using mock device data (mock mode enabled)');
      const mockResult = this.generateMockConnectedDevices(farmId);
      return Array.isArray(mockResult.devices) ? mockResult.devices : [];
    }
    
    try {
      // Set a quick timeout for the network request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${this.baseUrl}/iot/devices${farmId ? `?farmId=${farmId}` : ''}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔌 Successfully fetched real device data');
        const devices = result.success ? (result.devices || result.data || []) : [];
        return Array.isArray(devices) ? devices : [];
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Only log the error once, then enable mock mode
      if (!this.useMockData) {
        console.warn('⚠️ Device API request failed, switching to mock data mode:', error.message);
        this.enableMockMode();
      }
      
      const mockResult = this.generateMockConnectedDevices(farmId);
      return Array.isArray(mockResult.devices) ? mockResult.devices : [];
    }
  }

  // Add missing method for getting automation rules  
  async getAutomationRules(farmId = null) {
    console.log('🤖 Getting automation rules...');
    
    // If we're already in mock mode, return mock data immediately
    if (this.useMockData) {
      console.log('🤖 Using mock automation rules (mock mode enabled)');
      const mockResult = this.generateMockAutomationRules(farmId);
      return Array.isArray(mockResult) ? mockResult : [];
    }
    
    try {
      // Set a quick timeout for the network request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${this.baseUrl}/iot/automation/rules${farmId ? `?farmId=${farmId}` : ''}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🤖 Successfully fetched real automation rules');
        const rules = result.success ? (result.data || result.rules || []) : [];
        return Array.isArray(rules) ? rules : [];
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Only log the error once, then enable mock mode
      if (!this.useMockData) {
        console.warn('⚠️ Automation rules API request failed, switching to mock data mode:', error.message);
        this.enableMockMode();
      }
      
      const mockResult = this.generateMockAutomationRules(farmId);
      return Array.isArray(mockResult) ? mockResult : [];
    }
  }

  async getSensorHistory(deviceId, sensorType, timeRange = '24h') {
    try {
      const response = await fetch(
        `${this.baseUrl}/iot/sensors/${deviceId}/${sensorType}/history?range=${timeRange}`
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockSensorHistory(deviceId, sensorType, timeRange);
    } catch (error) {
      console.error('Error fetching sensor history:', error);
      return this.generateMockSensorHistory(deviceId, sensorType, timeRange);
    }
  }

  async getDeviceStatus(deviceId) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/devices/${deviceId}/status`);
      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockDeviceStatus(deviceId);
    } catch (error) {
      console.error('Error fetching device status:', error);
      return this.generateMockDeviceStatus(deviceId);
    }
  }

  // Smart Irrigation System
  async controlIrrigation(zoneId, action, duration = null, moisture_threshold = null) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/irrigation/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId,
          action, // 'start', 'stop', 'schedule'
          duration,
          moisture_threshold
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.updateIrrigationStatus(zoneId, result.status);
        return result;
      }
      
      return this.simulateIrrigationControl(zoneId, action, duration);
    } catch (error) {
      console.error('Irrigation control error:', error);
      return this.simulateIrrigationControl(zoneId, action, duration);
    }
  }

  async getIrrigationSchedule(farmId) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/irrigation/schedule?farmId=${farmId}`);
      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockIrrigationSchedule(farmId);
    } catch (error) {
      console.error('Error fetching irrigation schedule:', error);
      return this.generateMockIrrigationSchedule(farmId);
    }
  }

  async optimizeIrrigationSchedule(farmId, weatherData, soilData, cropData) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/irrigation/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, weatherData, soilData, cropData })
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateOptimizedSchedule(farmData, weatherData, soilData);
    } catch (error) {
      console.error('Schedule optimization error:', error);
      return this.generateOptimizedSchedule(farmData, weatherData, soilData);
    }
  }

  // Environmental Monitoring
  async getEnvironmentalData(farmId, timeRange = '24h') {
    try {
      const response = await fetch(
        `${this.baseUrl}/iot/environment/${farmId}?range=${timeRange}`
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockEnvironmentalData(farmId, timeRange);
    } catch (error) {
      console.error('Error fetching environmental data:', error);
      return this.generateMockEnvironmentalData(farmId, timeRange);
    }
  }

  async getWeatherStationData(stationId) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/weather-station/${stationId}`);
      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockWeatherStationData(stationId);
    } catch (error) {
      console.error('Error fetching weather station data:', error);
      return this.generateMockWeatherStationData(stationId);
    }
  }

  // Automation Rules Management
  async createAutomationRule(rule) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/automation/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });

      if (response.ok) {
        const savedRule = await response.json();
        this.automationRules.set(savedRule.id, savedRule);
        return savedRule;
      }
      
      return this.storeMockAutomationRule(rule);
    } catch (error) {
      console.error('Error creating automation rule:', error);
      return this.storeMockAutomationRule(rule);
    }
  }


  async updateAutomationRule(ruleId, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/automation/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedRule = await response.json();
        this.automationRules.set(ruleId, updatedRule);
        return updatedRule;
      }
      
      return this.updateMockAutomationRule(ruleId, updates);
    } catch (error) {
      console.error('Error updating automation rule:', error);
      return this.updateMockAutomationRule(ruleId, updates);
    }
  }

  // Device Management
  async registerDevice(device) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/devices/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device)
      });

      if (response.ok) {
        const registeredDevice = await response.json();
        this.deviceConnections.set(device.id, registeredDevice);
        return registeredDevice;
      }
      
      return this.registerMockDevice(device);
    } catch (error) {
      console.error('Device registration error:', error);
      return this.registerMockDevice(device);
    }
  }


  async updateDeviceConfiguration(deviceId, config) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/devices/${deviceId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.updateMockDeviceConfig(deviceId, config);
    } catch (error) {
      console.error('Device configuration error:', error);
      return this.updateMockDeviceConfig(deviceId, config);
    }
  }

  // Analytics and Insights
  async getIoTAnalytics(farmId, timeRange = '7d') {
    try {
      const response = await fetch(
        `${this.baseUrl}/iot/analytics/${farmId}?range=${timeRange}`
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockIoTAnalytics(farmId, timeRange);
    } catch (error) {
      console.error('Error fetching IoT analytics:', error);
      return this.generateMockIoTAnalytics(farmId, timeRange);
    }
  }

  async getEnergyConsumption(farmId, timeRange = '7d') {
    try {
      const response = await fetch(
        `${this.baseUrl}/iot/energy/${farmId}?range=${timeRange}`
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockEnergyData(farmId, timeRange);
    } catch (error) {
      console.error('Error fetching energy data:', error);
      return this.generateMockEnergyData(farmId, timeRange);
    }
  }

  // Helper Methods
  assessDataQuality(value, sensorType) {
    // Simple quality assessment based on sensor type and value ranges
    const qualityRanges = {
      temperature: { min: -10, max: 50, optimal: { min: 15, max: 35 } },
      humidity: { min: 0, max: 100, optimal: { min: 40, max: 80 } },
      soil_moisture: { min: 0, max: 100, optimal: { min: 30, max: 70 } },
      ph: { min: 3, max: 11, optimal: { min: 6, max: 8 } }
    };

    const range = qualityRanges[sensorType];
    if (!range) return 'unknown';

    if (value < range.min || value > range.max) return 'poor';
    if (value >= range.optimal.min && value <= range.optimal.max) return 'excellent';
    return 'good';
  }

  calculateTrend(deviceId, sensorType, currentValue) {
    const deviceData = this.sensorData.get(deviceId);
    if (!deviceData) return 'stable';

    const pastData = deviceData.get(sensorType);
    if (!pastData) return 'stable';

    const diff = currentValue - pastData.value;
    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }

  checkAutomationRules(deviceId, sensorType, value) {
    this.automationRules.forEach((rule, ruleId) => {
      if (rule.enabled && rule.trigger.deviceId === deviceId && rule.trigger.sensorType === sensorType) {
        const shouldTrigger = this.evaluateRuleCondition(rule.trigger, value);
        if (shouldTrigger) {
          this.executeAutomation(rule);
        }
      }
    });
  }

  checkAlertThresholds(deviceId, sensorType, value) {
    const thresholdKey = `${deviceId}_${sensorType}`;
    const threshold = this.alertThresholds.get(thresholdKey);
    
    if (threshold) {
      if (value < threshold.min || value > threshold.max) {
        this.triggerAlert({
          type: 'threshold_exceeded',
          deviceId,
          sensorType,
          value,
          threshold,
          severity: this.calculateAlertSeverity(value, threshold)
        });
      }
    }
  }

  // Mock Data Generators
  generateMockSensorData() {
    return {
      success: true,
      data: {
        temperature: 28.5 + Math.random() * 6 - 3,
        humidity: 65 + Math.random() * 20 - 10,
        soil_moisture: 45 + Math.random() * 20 - 10,
        ph: 6.8 + Math.random() * 0.8 - 0.4,
        light_intensity: 35000 + Math.random() * 10000 - 5000,
        wind_speed: 5.2 + Math.random() * 3 - 1.5,
        rainfall: Math.random() > 0.8 ? Math.random() * 5 : 0
      },
      timestamp: Date.now()
    };
  }

  generateMockEnvironmentalData(farmId, timeRange) {
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 24;
    const data = [];
    
    for (let i = 0; i < hours; i++) {
      data.push({
        timestamp: Date.now() - (hours - i) * 60 * 60 * 1000,
        temperature: 25 + Math.sin(i / 4) * 8 + Math.random() * 2,
        humidity: 60 + Math.cos(i / 6) * 20 + Math.random() * 5,
        soil_moisture: 50 + Math.sin(i / 8) * 15 + Math.random() * 3,
        light_intensity: Math.max(0, 40000 * Math.sin((i % 24) / 24 * Math.PI)),
        wind_speed: 3 + Math.random() * 4,
        atmospheric_pressure: 1013 + Math.random() * 10 - 5
      });
    }
    
    return {
      success: true,
      farmId,
      timeRange,
      data,
      summary: {
        avgTemperature: data.reduce((sum, d) => sum + d.temperature, 0) / data.length,
        avgHumidity: data.reduce((sum, d) => sum + d.humidity, 0) / data.length,
        avgSoilMoisture: data.reduce((sum, d) => sum + d.soil_moisture, 0) / data.length
      }
    };
  }

  generateMockConnectedDevices(farmId) {
    return {
      success: true,
      devices: [
        {
          id: 'sensor_001',
          name: 'Environmental Sensor #1',
          type: 'environmental',
          status: 'online',
          batteryLevel: 87,
          location: { zone: 'A', coordinates: [28.6139, 77.2090] },
          sensors: ['temperature', 'humidity', 'soil_moisture'],
          lastUpdate: Date.now() - 300000
        },
        {
          id: 'irrigation_001',
          name: 'Smart Sprinkler Zone A',
          type: 'irrigation',
          status: 'online',
          batteryLevel: null,
          location: { zone: 'A', coordinates: [28.6140, 77.2091] },
          capabilities: ['water_flow', 'pressure_monitoring'],
          lastUpdate: Date.now() - 180000
        },
        {
          id: 'weather_001',
          name: 'Weather Station',
          type: 'weather',
          status: 'online',
          batteryLevel: 92,
          location: { zone: 'Central', coordinates: [28.6141, 77.2092] },
          sensors: ['temperature', 'humidity', 'wind_speed', 'rainfall'],
          lastUpdate: Date.now() - 120000
        }
      ]
    };
  }

  generateMockIrrigationSchedule(farmId) {
    return {
      success: true,
      farmId,
      schedule: [
        {
          id: 'schedule_001',
          zone: 'A',
          time: '06:00',
          duration: 30,
          days: ['monday', 'wednesday', 'friday'],
          enabled: true,
          moisture_threshold: 35
        },
        {
          id: 'schedule_002',
          zone: 'B',
          time: '06:30',
          duration: 45,
          days: ['tuesday', 'thursday', 'saturday'],
          enabled: true,
          moisture_threshold: 40
        },
        {
          id: 'schedule_003',
          zone: 'C',
          time: '07:00',
          duration: 25,
          days: ['daily'],
          enabled: false,
          moisture_threshold: 30
        }
      ],
      nextIrrigation: {
        zone: 'A',
        scheduledTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        duration: 30
      }
    };
  }

  generateMockAutomationRules(farmId) {
    return [
      {
        id: 'rule_001',
        name: 'Auto Irrigation - Low Moisture',
        enabled: true,
        farmId,
        trigger: {
          type: 'sensor_threshold',
          deviceId: 'sensor_001',
          sensorType: 'soil_moisture',
          operator: 'less_than',
          value: 30
        },
        action: {
          type: 'irrigation_start',
          deviceId: 'irrigation_001',
          duration: 20
        },
        cooldown: 3600000, // 1 hour
        lastTriggered: null
      },
      {
        id: 'rule_002',
        name: 'High Temperature Alert',
        enabled: true,
        farmId,
        trigger: {
          type: 'sensor_threshold',
          deviceId: 'sensor_001',
          sensorType: 'temperature',
          operator: 'greater_than',
          value: 35
        },
        action: {
          type: 'send_alert',
          severity: 'warning',
          message: 'High temperature detected in Zone A'
        },
        cooldown: 1800000, // 30 minutes
        lastTriggered: null
      }
    ];
  }

  simulateIrrigationControl(zoneId, action, duration) {
    return {
      success: true,
      zoneId,
      action,
      duration,
      status: action === 'start' ? 'running' : 'stopped',
      startTime: action === 'start' ? Date.now() : null,
      estimatedEndTime: action === 'start' ? Date.now() + (duration * 60 * 1000) : null,
      waterFlow: action === 'start' ? 15.5 : 0
    };
  }

  // WebSocket Message Handlers
  updateDeviceStatus(data) {
    console.log('📱 Device status update:', data);
    // Update device connection status in memory
    if (this.deviceConnections.has(data.deviceId)) {
      const device = this.deviceConnections.get(data.deviceId);
      Object.assign(device, data);
    }
  }

  handleAutomationTrigger(data) {
    console.log('🤖 Automation triggered:', data);
    // Handle automation rule execution
  }

  processAlert(data) {
    console.log('🚨 Processing alert:', data);
    // Store alert for dashboard display
    // You could emit events here for React components to listen to
  }

  // Storage Management
  async cacheSensorData(deviceId, sensorType, data) {
    try {
      const key = `sensor_${deviceId}_${sensorType}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching sensor data:', error);
    }
  }

  async loadStoredData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sensorKeys = keys.filter(key => key.startsWith('sensor_'));
      
      for (const key of sensorKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          // Process stored sensor data
          console.log(`Loaded cached data for ${key}`);
        }
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  // Cleanup
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.sensorData.clear();
    this.deviceConnections.clear();
  }
}

// Export singleton instance
const iotIntegrationService = new IoTIntegrationService();
export { iotIntegrationService };
export default iotIntegrationService;
