import AsyncStorage from '@react-native-async-storage/async-storage';

class IoTService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes for IoT data
    this.sensorTypes = [
      'soil_moisture',
      'temperature',
      'humidity',
      'ph_level',
      'nitrogen',
      'phosphorus',
      'potassium',
      'light_intensity',
      'air_pressure',
      'wind_speed'
    ];
  }

  // Real-time Sensor Data
  async getSensorData(farmId, sensorType = 'all', timeRange = '24h') {
    try {
      const cacheKey = `sensors_${farmId}_${sensorType}_${timeRange}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await fetch(`${this.baseUrl}/iot/sensors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, sensorType, timeRange }),
      });

      if (response.ok) {
        const data = await response.json();
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
      
      return this.generateMockSensorData(sensorType, timeRange);
    } catch (error) {
      console.error('Get sensor data error:', error);
      return this.generateMockSensorData(sensorType, timeRange);
    }
  }

  // Smart Irrigation System
  async getIrrigationStatus(farmId) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/irrigation/${farmId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockIrrigationStatus();
    } catch (error) {
      console.error('Get irrigation status error:', error);
      return this.generateMockIrrigationStatus();
    }
  }

  async controlIrrigation(farmId, action, duration = null, zones = []) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/irrigation/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, action, duration, zones }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.mockIrrigationControl(action, duration, zones);
    } catch (error) {
      console.error('Control irrigation error:', error);
      return this.mockIrrigationControl(action, duration, zones);
    }
  }

  // Automated Alerts & Notifications
  async getAlerts(farmId, severity = 'all', type = 'all') {
    try {
      const response = await fetch(`${this.baseUrl}/iot/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, severity, type }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockAlerts();
    } catch (error) {
      console.error('Get alerts error:', error);
      return this.generateMockAlerts();
    }
  }

  // Environmental Monitoring
  async getEnvironmentalData(farmId, timeRange = '7d') {
    try {
      const response = await fetch(`${this.baseUrl}/iot/environment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, timeRange }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockEnvironmentalData(timeRange);
    } catch (error) {
      console.error('Get environmental data error:', error);
      return this.generateMockEnvironmentalData(timeRange);
    }
  }

  // Device Management
  async getDeviceStatus(farmId) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/devices/${farmId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockDeviceStatus();
    } catch (error) {
      console.error('Get device status error:', error);
      return this.generateMockDeviceStatus();
    }
  }

  async configureDevice(deviceId, settings) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/devices/configure`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, settings }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.mockDeviceConfiguration(deviceId, settings);
    } catch (error) {
      console.error('Configure device error:', error);
      return { success: false, message: 'Failed to configure device' };
    }
  }

  // Automation Rules
  async getAutomationRules(farmId) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/automation/rules/${farmId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockAutomationRules();
    } catch (error) {
      console.error('Get automation rules error:', error);
      return this.generateMockAutomationRules();
    }
  }

  async createAutomationRule(farmId, rule) {
    try {
      const response = await fetch(`${this.baseUrl}/iot/automation/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, ...rule }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.mockCreateAutomationRule(rule);
    } catch (error) {
      console.error('Create automation rule error:', error);
      return { success: false, message: 'Failed to create automation rule' };
    }
  }

  // Energy Monitoring
  async getEnergyConsumption(farmId, timeRange = '30d') {
    try {
      const response = await fetch(`${this.baseUrl}/iot/energy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, timeRange }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockEnergyData(timeRange);
    } catch (error) {
      console.error('Get energy consumption error:', error);
      return this.generateMockEnergyData(timeRange);
    }
  }

  // Mock Data Generators
  generateMockSensorData(sensorType, timeRange) {
    const timePoints = this.getTimePoints(timeRange);
    const sensors = sensorType === 'all' ? this.sensorTypes : [sensorType];
    
    const data = {};
    
    sensors.forEach(type => {
      data[type] = timePoints.map(time => ({
        timestamp: time,
        value: this.generateSensorValue(type),
        unit: this.getSensorUnit(type),
        status: Math.random() > 0.1 ? 'normal' : 'warning'
      }));
    });

    return {
      success: true,
      farmId: 'demo-farm',
      sensorData: data,
      lastUpdated: Date.now(),
      deviceCount: sensors.length,
      dataPoints: timePoints.length
    };
  }

  generateMockIrrigationStatus() {
    return {
      success: true,
      status: {
        isActive: Math.random() > 0.7,
        mode: 'automatic', // automatic, manual, scheduled
        waterFlow: Math.round(Math.random() * 50 + 10), // L/min
        pressure: Math.round(Math.random() * 20 + 20), // PSI
        zones: [
          {
            id: 'zone-1',
            name: 'Field A',
            status: 'active',
            duration: 45, // minutes
            remaining: 23,
            soilMoisture: Math.round(Math.random() * 30 + 40)
          },
          {
            id: 'zone-2',
            name: 'Field B',
            status: 'idle',
            duration: 0,
            remaining: 0,
            soilMoisture: Math.round(Math.random() * 30 + 40)
          },
          {
            id: 'zone-3',
            name: 'Greenhouse',
            status: 'scheduled',
            duration: 30,
            remaining: 0,
            soilMoisture: Math.round(Math.random() * 30 + 40)
          }
        ],
        schedule: {
          morning: { enabled: true, time: '06:00', duration: 30 },
          evening: { enabled: true, time: '18:00', duration: 45 }
        },
        totalWaterUsed: Math.round(Math.random() * 1000 + 500), // liters today
        estimatedCost: Math.round(Math.random() * 50 + 25) // rupees today
      }
    };
  }

  generateMockAlerts() {
    const alertTypes = [
      'soil_moisture_low',
      'temperature_high',
      'disease_detected',
      'pest_activity',
      'equipment_malfunction',
      'weather_warning',
      'irrigation_failure',
      'nutrient_deficiency'
    ];

    const severityLevels = ['low', 'medium', 'high', 'critical'];
    
    const alerts = [];
    const alertCount = Math.floor(Math.random() * 8) + 2;
    
    for (let i = 0; i < alertCount; i++) {
      const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const severity = severityLevels[Math.floor(Math.random() * severityLevels.length)];
      
      alerts.push({
        id: `alert-${i + 1}`,
        type,
        severity,
        title: this.getAlertTitle(type),
        message: this.getAlertMessage(type),
        timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000, // last 24 hours
        location: `Zone ${Math.floor(Math.random() * 3) + 1}`,
        acknowledged: Math.random() > 0.6,
        actionRequired: severity === 'high' || severity === 'critical',
        recommendations: this.getAlertRecommendations(type)
      });
    }

    return {
      success: true,
      alerts: alerts.sort((a, b) => b.timestamp - a.timestamp),
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        unacknowledged: alerts.filter(a => !a.acknowledged).length
      }
    };
  }

  generateMockEnvironmentalData(timeRange) {
    const timePoints = this.getTimePoints(timeRange);
    
    return {
      success: true,
      timeRange,
      data: {
        airQuality: {
          aqi: Math.round(Math.random() * 100 + 50),
          status: Math.random() > 0.7 ? 'Good' : 'Moderate',
          pm25: Math.round(Math.random() * 30 + 10),
          pm10: Math.round(Math.random() * 50 + 20)
        },
        soilConditions: {
          temperature: timePoints.map(time => ({
            timestamp: time,
            value: Math.round((Math.random() * 10 + 20) * 10) / 10
          })),
          moisture: timePoints.map(time => ({
            timestamp: time,
            value: Math.round((Math.random() * 30 + 40) * 10) / 10
          })),
          ph: timePoints.map(time => ({
            timestamp: time,
            value: Math.round((Math.random() * 2 + 6) * 10) / 10
          })),
          nutrients: {
            nitrogen: Math.round(Math.random() * 50 + 100),
            phosphorus: Math.round(Math.random() * 30 + 40),
            potassium: Math.round(Math.random() * 40 + 120)
          }
        },
        microclimate: {
          temperature: timePoints.map(time => ({
            timestamp: time,
            value: Math.round((Math.random() * 15 + 15) * 10) / 10
          })),
          humidity: timePoints.map(time => ({
            timestamp: time,
            value: Math.round((Math.random() * 30 + 50) * 10) / 10
          })),
          lightIntensity: timePoints.map(time => ({
            timestamp: time,
            value: Math.round(Math.random() * 1000 + 500)
          }))
        }
      }
    };
  }

  generateMockDeviceStatus() {
    const devices = [
      {
        id: 'sensor-01',
        name: 'Soil Moisture Sensor A',
        type: 'soil_sensor',
        status: 'online',
        battery: Math.round(Math.random() * 40 + 60),
        lastSeen: Date.now() - Math.random() * 60 * 60 * 1000,
        location: 'Field A - Zone 1',
        firmware: '1.2.3'
      },
      {
        id: 'sensor-02',
        name: 'Weather Station',
        type: 'weather_station',
        status: 'online',
        battery: 95,
        lastSeen: Date.now() - Math.random() * 30 * 60 * 1000,
        location: 'Central Location',
        firmware: '2.1.0'
      },
      {
        id: 'pump-01',
        name: 'Irrigation Pump A',
        type: 'irrigation_pump',
        status: Math.random() > 0.8 ? 'maintenance' : 'online',
        battery: null, // AC powered
        lastSeen: Date.now() - Math.random() * 15 * 60 * 1000,
        location: 'Pump House',
        firmware: '1.5.2'
      },
      {
        id: 'valve-01',
        name: 'Smart Valve Zone 1',
        type: 'valve_controller',
        status: 'online',
        battery: Math.round(Math.random() * 30 + 70),
        lastSeen: Date.now() - Math.random() * 45 * 60 * 1000,
        location: 'Field A',
        firmware: '1.1.8'
      },
      {
        id: 'camera-01',
        name: 'Crop Monitoring Camera',
        type: 'camera',
        status: Math.random() > 0.9 ? 'offline' : 'online',
        battery: null, // Solar powered
        lastSeen: Date.now() - Math.random() * 2 * 60 * 60 * 1000,
        location: 'Field B',
        firmware: '3.0.1'
      }
    ];

    return {
      success: true,
      devices,
      summary: {
        total: devices.length,
        online: devices.filter(d => d.status === 'online').length,
        offline: devices.filter(d => d.status === 'offline').length,
        maintenance: devices.filter(d => d.status === 'maintenance').length,
        lowBattery: devices.filter(d => d.battery && d.battery < 20).length
      }
    };
  }

  generateMockAutomationRules() {
    return {
      success: true,
      rules: [
        {
          id: 'rule-01',
          name: 'Auto Irrigation - Low Soil Moisture',
          enabled: true,
          trigger: {
            type: 'sensor_threshold',
            sensor: 'soil_moisture',
            condition: 'below',
            value: 30,
            unit: '%'
          },
          actions: [
            {
              type: 'irrigation',
              zone: 'all',
              duration: 30,
              unit: 'minutes'
            }
          ],
          schedule: {
            timeRange: { start: '06:00', end: '20:00' },
            cooldown: 120 // minutes
          },
          lastTriggered: Date.now() - 6 * 60 * 60 * 1000,
          triggerCount: 23
        },
        {
          id: 'rule-02',
          name: 'High Temperature Alert',
          enabled: true,
          trigger: {
            type: 'sensor_threshold',
            sensor: 'temperature',
            condition: 'above',
            value: 35,
            unit: '°C'
          },
          actions: [
            {
              type: 'notification',
              message: 'High temperature detected',
              severity: 'high'
            },
            {
              type: 'irrigation',
              zone: 'greenhouse',
              duration: 15,
              unit: 'minutes'
            }
          ],
          schedule: {
            timeRange: { start: '00:00', end: '23:59' },
            cooldown: 60
          },
          lastTriggered: Date.now() - 2 * 60 * 60 * 1000,
          triggerCount: 7
        },
        {
          id: 'rule-03',
          name: 'Evening Irrigation Schedule',
          enabled: true,
          trigger: {
            type: 'schedule',
            time: '18:00',
            days: ['mon', 'wed', 'fri']
          },
          actions: [
            {
              type: 'irrigation',
              zone: 'field_a',
              duration: 45,
              unit: 'minutes'
            }
          ],
          schedule: null,
          lastTriggered: Date.now() - 18 * 60 * 60 * 1000,
          triggerCount: 156
        }
      ]
    };
  }

  generateMockEnergyData(timeRange) {
    const timePoints = this.getTimePoints(timeRange);
    
    return {
      success: true,
      timeRange,
      data: {
        totalConsumption: Math.round(Math.random() * 500 + 300), // kWh
        cost: Math.round(Math.random() * 2000 + 1200), // rupees
        devices: [
          {
            name: 'Irrigation Pumps',
            consumption: Math.round(Math.random() * 200 + 150),
            percentage: 65,
            cost: Math.round(Math.random() * 800 + 600)
          },
          {
            name: 'Lighting Systems',
            consumption: Math.round(Math.random() * 50 + 30),
            percentage: 15,
            cost: Math.round(Math.random() * 200 + 120)
          },
          {
            name: 'Ventilation',
            consumption: Math.round(Math.random() * 40 + 25),
            percentage: 12,
            cost: Math.round(Math.random() * 150 + 100)
          },
          {
            name: 'Sensors & Controllers',
            consumption: Math.round(Math.random() * 15 + 5),
            percentage: 8,
            cost: Math.round(Math.random() * 60 + 30)
          }
        ],
        hourlyConsumption: timePoints.slice(-24).map(time => ({
          timestamp: time,
          consumption: Math.round(Math.random() * 20 + 5)
        })),
        solarGeneration: {
          total: Math.round(Math.random() * 200 + 100),
          savings: Math.round(Math.random() * 800 + 400),
          efficiency: Math.round(Math.random() * 20 + 75)
        }
      }
    };
  }

  // Helper Methods
  getTimePoints(timeRange) {
    const now = Date.now();
    const points = [];
    let interval, count;

    switch (timeRange) {
      case '1h':
        interval = 5 * 60 * 1000; // 5 minutes
        count = 12;
        break;
      case '24h':
        interval = 60 * 60 * 1000; // 1 hour
        count = 24;
        break;
      case '7d':
        interval = 6 * 60 * 60 * 1000; // 6 hours
        count = 28;
        break;
      case '30d':
        interval = 24 * 60 * 60 * 1000; // 1 day
        count = 30;
        break;
      default:
        interval = 60 * 60 * 1000;
        count = 24;
    }

    for (let i = count - 1; i >= 0; i--) {
      points.push(now - (i * interval));
    }

    return points;
  }

  generateSensorValue(type) {
    const ranges = {
      soil_moisture: { min: 20, max: 80, precision: 1 },
      temperature: { min: 15, max: 35, precision: 1 },
      humidity: { min: 40, max: 90, precision: 1 },
      ph_level: { min: 5.5, max: 8.5, precision: 2 },
      nitrogen: { min: 50, max: 200, precision: 0 },
      phosphorus: { min: 20, max: 80, precision: 0 },
      potassium: { min: 80, max: 250, precision: 0 },
      light_intensity: { min: 200, max: 2000, precision: 0 },
      air_pressure: { min: 980, max: 1030, precision: 1 },
      wind_speed: { min: 0, max: 25, precision: 1 }
    };

    const range = ranges[type] || { min: 0, max: 100, precision: 1 };
    const value = Math.random() * (range.max - range.min) + range.min;
    return Math.round(value * Math.pow(10, range.precision)) / Math.pow(10, range.precision);
  }

  getSensorUnit(type) {
    const units = {
      soil_moisture: '%',
      temperature: '°C',
      humidity: '%',
      ph_level: 'pH',
      nitrogen: 'ppm',
      phosphorus: 'ppm',
      potassium: 'ppm',
      light_intensity: 'lux',
      air_pressure: 'hPa',
      wind_speed: 'km/h'
    };

    return units[type] || 'units';
  }

  getAlertTitle(type) {
    const titles = {
      soil_moisture_low: 'Low Soil Moisture Detected',
      temperature_high: 'High Temperature Alert',
      disease_detected: 'Plant Disease Detected',
      pest_activity: 'Pest Activity Observed',
      equipment_malfunction: 'Equipment Malfunction',
      weather_warning: 'Severe Weather Warning',
      irrigation_failure: 'Irrigation System Failure',
      nutrient_deficiency: 'Nutrient Deficiency Detected'
    };

    return titles[type] || 'System Alert';
  }

  getAlertMessage(type) {
    const messages = {
      soil_moisture_low: 'Soil moisture levels have dropped below optimal range in multiple zones.',
      temperature_high: 'Temperature has exceeded safe limits for crop growth.',
      disease_detected: 'AI analysis has detected potential disease symptoms in crop monitoring images.',
      pest_activity: 'Unusual pest activity detected through sensor monitoring.',
      equipment_malfunction: 'One or more devices are not responding properly.',
      weather_warning: 'Severe weather conditions predicted in your area.',
      irrigation_failure: 'Irrigation system has failed to activate as scheduled.',
      nutrient_deficiency: 'Soil sensors indicate nutrient levels below recommended values.'
    };

    return messages[type] || 'System alert requires your attention.';
  }

  getAlertRecommendations(type) {
    const recommendations = {
      soil_moisture_low: [
        'Activate irrigation system immediately',
        'Check soil moisture sensors for accuracy',
        'Consider adjusting irrigation schedule'
      ],
      temperature_high: [
        'Increase irrigation frequency',
        'Provide shade cover if possible',
        'Monitor crops for heat stress symptoms'
      ],
      disease_detected: [
        'Inspect affected area immediately',
        'Consider fungicide application',
        'Isolate affected plants if necessary'
      ],
      pest_activity: [
        'Conduct visual inspection of crops',
        'Apply appropriate pest control measures',
        'Monitor pest trap data'
      ],
      equipment_malfunction: [
        'Check device connections',
        'Inspect for physical damage',
        'Contact technical support if needed'
      ],
      weather_warning: [
        'Secure loose equipment',
        'Harvest ready crops if possible',
        'Ensure drainage systems are clear'
      ],
      irrigation_failure: [
        'Check pump and valve status',
        'Verify water source availability',
        'Manually activate backup systems'
      ],
      nutrient_deficiency: [
        'Test soil samples in laboratory',
        'Apply appropriate fertilizers',
        'Adjust nutrient management plan'
      ]
    };

    return recommendations[type] || ['Monitor situation closely', 'Take appropriate action'];
  }

  // Mock implementations for control functions
  mockIrrigationControl(action, duration, zones) {
    return {
      success: true,
      message: `Irrigation ${action} command executed successfully`,
      action,
      duration,
      zones,
      timestamp: Date.now(),
      estimatedCompletion: duration ? Date.now() + (duration * 60 * 1000) : null
    };
  }

  mockDeviceConfiguration(deviceId, settings) {
    return {
      success: true,
      message: 'Device configured successfully',
      deviceId,
      settings,
      timestamp: Date.now()
    };
  }

  mockCreateAutomationRule(rule) {
    return {
      success: true,
      message: 'Automation rule created successfully',
      ruleId: `rule-${Date.now()}`,
      rule: {
        ...rule,
        id: `rule-${Date.now()}`,
        created: Date.now(),
        enabled: true,
        triggerCount: 0,
        lastTriggered: null
      }
    };
  }

  // Cache management
  clearCache() {
    this.cache.clear();
  }
}

export default new IoTService();
