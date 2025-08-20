/**
 * Mock Backend Server for Agriculture App Development
 * Provides basic API endpoints to prevent network errors during development
 */

const http = require('http');
const url = require('url');

const PORT = 3001;

// Mock data
const mockFarms = [
  {
    id: 'farm_001',
    name: 'Green Valley Farm',
    location: 'Kathmandu Valley',
    area: 5.2,
    crops: ['Rice', 'Wheat', 'Tomatoes'],
    soilType: 'Loamy',
    irrigationMethod: 'Drip Irrigation'
  },
  {
    id: 'farm_002', 
    name: 'Sunrise Agriculture',
    location: 'Pokhara',
    area: 3.8,
    crops: ['Corn', 'Potatoes'],
    soilType: 'Clay',
    irrigationMethod: 'Sprinkler'
  }
];

const mockUserStats = {
  totalFarms: 2,
  totalArea: 9.0,
  activeCrops: 5,
  monthlyGrowth: 12.5,
  harvestsThisMonth: 3,
  weatherAlerts: 2
};

const mockCommunityPosts = [
  {
    id: 'post_001',
    title: 'Organic Fertilizer Tips',
    author: 'Farmer John',
    content: 'Here are some great organic fertilizer techniques...',
    likes: 45,
    comments: 12,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'post_002',
    title: 'Pest Control Methods',
    author: 'AgriExpert',
    content: 'Natural ways to control pests in your crops...',
    likes: 32,
    comments: 8,
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

const mockWeatherData = {
  current: {
    temperature: 28,
    humidity: 65,
    windSpeed: 12,
    condition: 'Partly Cloudy',
    feelsLike: 30,
    uvIndex: 6
  },
  forecast: [
    {
      date: new Date().toISOString(),
      temperature: { min: 22, max: 29 },
      condition: 'Sunny',
      humidity: 60,
      precipitationChance: 10
    },
    {
      date: new Date(Date.now() + 86400000).toISOString(),
      temperature: { min: 20, max: 27 },
      condition: 'Cloudy',
      humidity: 70,
      precipitationChance: 30
    }
  ]
};

const mockSensorData = {
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
  devices: [
    {
      id: 'sensor_001',
      name: 'Environmental Sensor #1',
      status: 'online',
      batteryLevel: 87,
      lastUpdate: Date.now() - 300000
    },
    {
      id: 'irrigation_001', 
      name: 'Smart Sprinkler Zone A',
      status: 'online',
      lastUpdate: Date.now() - 180000
    }
  ],
  timestamp: Date.now()
};

// Simple request router
const handleRequest = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`📨 ${method} ${path}`);

  // Set JSON response header
  res.setHeader('Content-Type', 'application/json');

  try {
    // Health check endpoint
    if (path === '/api/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ 
        status: 'ok', 
        message: 'Mock backend server is running',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // User farms endpoint
    if (path.includes('/api/users/') && path.includes('/farms')) {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: mockFarms
      }));
      return;
    }

    // User stats endpoint
    if (path.includes('/api/users/') && path.includes('/stats')) {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: mockUserStats
      }));
      return;
    }

    // Weather endpoint
    if (path.startsWith('/api/weather')) {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: mockWeatherData
      }));
      return;
    }

    // Community posts endpoint
    if (path.startsWith('/api/community/posts')) {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: mockCommunityPosts,
        pagination: {
          page: 1,
          limit: 5,
          total: 2,
          totalPages: 1
        }
      }));
      return;
    }

    // IoT Sensor Data Endpoints
    if (path.startsWith('/api/iot/sensors/data') || path.startsWith('/api/iot/sensors/farm/')) {
      // Generate fresh sensor data for each request
      const freshSensorData = {
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
        devices: mockSensorData.devices,
        timestamp: Date.now()
      };
      
      res.writeHead(200);
      res.end(JSON.stringify(freshSensorData));
      return;
    }

    // IoT Connected Devices Endpoint
    if (path.startsWith('/api/iot/devices')) {
      const mockDevices = [
        {
          id: 'sensor_001',
          name: 'Environmental Sensor #1',
          type: 'environmental',
          status: 'online',
          batteryLevel: 87,
          lastSeen: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: 'irrigation_001',
          name: 'Smart Sprinkler Zone A',
          type: 'irrigation',
          status: 'online',
          batteryLevel: null,
          lastSeen: new Date(Date.now() - 180000).toISOString()
        },
        {
          id: 'weather_001',
          name: 'Weather Station',
          type: 'weather',
          status: 'online',
          batteryLevel: 92,
          lastSeen: new Date(Date.now() - 120000).toISOString()
        }
      ];
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        devices: mockDevices
      }));
      return;
    }

    // IoT Automation Rules Endpoint
    if (path.startsWith('/api/iot/automation/rules')) {
      const mockRules = [
        {
          id: 'rule_001',
          name: 'Auto Irrigation - Low Moisture',
          condition: 'Soil moisture < 30%',
          action: 'Start irrigation for 15 minutes',
          enabled: true,
          lastTriggered: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        },
        {
          id: 'rule_002',
          name: 'High Temperature Alert',
          condition: 'Temperature > 35°C',
          action: 'Send notification to farmer',
          enabled: false,
          lastTriggered: null
        },
        {
          id: 'rule_003',
          name: 'Evening Irrigation Schedule',
          condition: 'Daily at 6:00 PM',
          action: 'Start all zone irrigation',
          enabled: true,
          lastTriggered: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
        }
      ];
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        data: mockRules
      }));
      return;
    }

    // Auth endpoints
    if (path === '/api/auth/login') {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: '685829ea7aa46f0e532ec992',
          name: 'Demo Farmer',
          email: 'farmer@example.com',
          location: 'Nepal'
        }
      }));
      return;
    }

    // Default 404 for unhandled routes
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      error: 'Endpoint not found',
      message: `Mock backend: ${method} ${path} not implemented`,
      availableEndpoints: [
        'GET /api/health',
        'GET /api/users/{id}/farms',
        'GET /api/users/{id}/stats',
        'GET /api/weather',
        'GET /api/community/posts',
        'GET /api/iot/sensors/data',
        'GET /api/iot/sensors/farm/{id}',
        'GET /api/iot/devices',
        'GET /api/iot/automation/rules',
        'POST /api/auth/login'
      ]
    }));

  } catch (error) {
    console.error('❌ Server error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }));
  }
};

// Create and start server
const server = http.createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
  console.log('🌾 Mock IoT Backend Server started');
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log('🌐 Server accessible from:');
  console.log('   - http://localhost:3001 (local)');
  console.log('   - http://192.168.1.89:3001 (network)');
  console.log('📋 Available endpoints:');
  console.log('   - GET  /api/health');
  console.log('   - GET  /api/users/{id}/farms');
  console.log('   - GET  /api/users/{id}/stats');
  console.log('   - GET  /api/weather');
  console.log('   - GET  /api/community/posts');
  console.log('   - POST /api/auth/login');
  console.log('✅ Ready to serve requests...');
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});
