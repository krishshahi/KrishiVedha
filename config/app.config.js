/**
 * Centralized Dynamic Configuration System for KrishiVedha
 * This file manages all dynamic configurations that can be modified without code changes
 */

const os = require('os');

// Get network interfaces for dynamic IP detection
const getNetworkIP = () => {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const interfaceList = interfaces[interfaceName];
    for (const iface of interfaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (interfaceName.toLowerCase().includes('wi-fi') || 
            interfaceName.toLowerCase().includes('ethernet') ||
            interfaceName.toLowerCase().includes('wlan') ||
            interfaceName.toLowerCase().includes('eth')) {
          return iface.address;
        }
      }
    }
  }
  
  // Fallback to first non-internal IPv4
  for (const interfaceName in interfaces) {
    const interfaceList = interfaces[interfaceName];
    for (const iface of interfaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
};

// Dynamic environment detection
const getCurrentEnvironment = () => {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  if (process.env.NODE_ENV === 'development') return 'development';
  
  // Auto-detect based on other factors
  if (process.env.PORT && parseInt(process.env.PORT) === 80) return 'production';
  if (process.argv.includes('--prod')) return 'production';
  if (process.argv.includes('--test')) return 'test';
  
  return 'development';
};

// Base configuration
const BASE_CONFIG = {
  app: {
    name: process.env.APP_NAME || 'KrishiVedha',
    version: process.env.APP_VERSION || '1.0.0',
    description: process.env.APP_DESCRIPTION || 'Smart Agriculture Management System',
    environment: getCurrentEnvironment(),
  },
  
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    ip: process.env.SERVER_IP || getNetworkIP(),
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
  },
  
  database: {
    uri: process.env.MONGODB_URI || `mongodb://localhost:27017/${process.env.DB_NAME || 'krishivedha'}`,
    options: {
      maxPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT) || 5000,
    },
  },
  
  auth: {
    jwtSecret: process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex'),
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
  },
  
  api: {
    prefix: process.env.API_PREFIX || '/api',
    version: process.env.API_VERSION || 'v1',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    },
    timeout: parseInt(process.env.API_TIMEOUT) || 30000,
  },
  
  storage: {
    type: process.env.STORAGE_TYPE || 'local', // 'local', 'aws', 'gcp', 'azure'
    local: {
      uploadPath: process.env.UPLOAD_PATH || './uploads',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
      allowedTypes: process.env.ALLOWED_FILE_TYPES ? 
        process.env.ALLOWED_FILE_TYPES.split(',') : 
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
  },
  
  external: {
    weather: {
      apiKey: process.env.OPENWEATHER_API_KEY,
      baseUrl: process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
      timeout: parseInt(process.env.WEATHER_API_TIMEOUT) || 5000,
    },
    ai: {
      enabled: process.env.AI_ENABLED === 'true',
      apiUrl: process.env.AI_API_URL,
      apiKey: process.env.AI_API_KEY,
      timeout: parseInt(process.env.AI_API_TIMEOUT) || 30000,
    },
  },
  
  features: {
    enableWeather: process.env.FEATURE_WEATHER !== 'false',
    enableCommunity: process.env.FEATURE_COMMUNITY !== 'false',
    enableAI: process.env.FEATURE_AI === 'true',
    enableIoT: process.env.FEATURE_IOT === 'true',
    enableAnalytics: process.env.FEATURE_ANALYTICS !== 'false',
    enableNotifications: process.env.FEATURE_NOTIFICATIONS !== 'false',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: process.env.LOG_FILE || './logs/app.log',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
  },
};

// Environment-specific overrides
const ENVIRONMENT_CONFIGS = {
  development: {
    logging: {
      level: 'debug',
    },
    api: {
      rateLimit: {
        max: 1000, // Higher limit for development
      },
    },
  },
  
  test: {
    database: {
      uri: process.env.TEST_MONGODB_URI || `mongodb://localhost:27017/${process.env.TEST_DB_NAME || 'krishivedha_test'}`,
    },
    logging: {
      level: 'error',
    },
    features: {
      enableWeather: false,
      enableAI: false,
    },
  },
  
  production: {
    server: {
      cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false,
        credentials: true,
      },
    },
    logging: {
      level: 'warn',
    },
    auth: {
      sessionTimeout: 7200000, // 2 hours
    },
  },
};

// Merge configuration based on environment
const mergeConfig = (baseConfig, envConfig) => {
  const result = { ...baseConfig };
  
  for (const key in envConfig) {
    if (typeof envConfig[key] === 'object' && !Array.isArray(envConfig[key])) {
      result[key] = { ...result[key], ...envConfig[key] };
    } else {
      result[key] = envConfig[key];
    }
  }
  
  return result;
};

// Get final configuration
const getConfig = () => {
  const environment = getCurrentEnvironment();
  const envConfig = ENVIRONMENT_CONFIGS[environment] || {};
  return mergeConfig(BASE_CONFIG, envConfig);
};

// Configuration validation
const validateConfig = (config) => {
  const errors = [];
  
  if (!config.auth.jwtSecret || config.auth.jwtSecret.length < 32) {
    errors.push('JWT secret must be at least 32 characters long');
  }
  
  if (!config.database.uri) {
    errors.push('Database URI is required');
  }
  
  if (config.external.weather.enabled && !config.external.weather.apiKey) {
    errors.push('Weather API key is required when weather feature is enabled');
  }
  
  return errors;
};

// Export configuration
const CONFIG = getConfig();
const configErrors = validateConfig(CONFIG);

if (configErrors.length > 0) {
  console.error('❌ Configuration validation errors:');
  configErrors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

module.exports = CONFIG;
