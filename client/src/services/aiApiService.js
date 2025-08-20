import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiConfig } from '../config/apiConfig';

const BASE_URL = apiConfig.baseURL;

class AiApiService {
  constructor() {
    this.authToken = null;
    this.requestId = 0;
  }

  // Initialize service and get auth token
  async initialize() {
    try {
      this.authToken = await AsyncStorage.getItem('authToken') || 'mock-jwt-token';
    } catch (error) {
      console.error('Failed to initialize AI API service:', error);
      this.authToken = 'mock-jwt-token';
    }
  }

  // Generate unique request ID for tracking
  generateRequestId() {
    return `req_${Date.now()}_${++this.requestId}`;
  }

  // Common request method with error handling
  async makeRequest(endpoint, options = {}) {
    const requestId = this.generateRequestId();
    const url = `${BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
      'X-Request-ID': requestId,
    };

    const requestOptions = {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    };

    try {
      console.log(`[AI-API] ${options.method || 'GET'} ${url} - Request ID: ${requestId}`);
      
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[AI-API] ${endpoint} - Success`, { requestId, responseSize: JSON.stringify(data).length });
      return data;
    } catch (error) {
      console.error(`[AI-API] ${endpoint} - Error:`, { requestId, error: error.message });
      throw new Error(`AI API request failed: ${error.message}`);
    }
  }

  // =========================
  // AI ANALYTICS METHODS
  // =========================

  /**
   * Predict crop yield using AI
   * @param {Object} data - Yield prediction data
   * @returns {Promise<Object>} Prediction results
   */
  async predictYield(data) {
    return this.makeRequest('/ai/predict-yield', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Detect plant diseases from image
   * @param {Object} data - Disease detection data including image
   * @returns {Promise<Object>} Detection results
   */
  async detectPlantDisease(data) {
    return this.makeRequest('/ai/detect-disease', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Generate weather-based farming insights
   * @param {Object} weatherData - Weather information
   * @param {Object} farmData - Farm-specific data
   * @returns {Promise<Object>} Weather insights
   */
  async generateWeatherInsights(weatherData, farmData) {
    return this.makeRequest('/ai/weather-insights', {
      method: 'POST',
      body: JSON.stringify({ weatherData, farmData }),
    });
  }

  /**
   * Optimize resource allocation using AI
   * @param {Object} data - Resource optimization data
   * @returns {Promise<Object>} Optimization recommendations
   */
  async optimizeResources(data) {
    return this.makeRequest('/ai/optimize-resources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Predict market prices for crops
   * @param {string} cropType - Type of crop
   * @param {Object} location - Location data
   * @param {string} harvestDate - Expected harvest date
   * @param {Object} additionalData - Additional prediction data
   * @returns {Promise<Object>} Market price predictions
   */
  async predictMarketPrices(cropType, location, harvestDate, additionalData = {}) {
    const data = {
      cropType,
      location,
      harvestDate,
      ...additionalData,
    };
    
    return this.makeRequest('/ai/market-prediction', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Generate comprehensive farm analytics report
   * @param {string} farmId - Farm identifier
   * @param {string} timeRange - Time range for report (e.g., '30d', '6m', '1y')
   * @returns {Promise<Object>} Farm analytics report
   */
  async generateFarmReport(farmId, timeRange = '30d') {
    return this.makeRequest(`/ai/farm-report/${farmId}?timeRange=${timeRange}`);
  }

  /**
   * Get real-time AI insights for a farm
   * @param {string} farmId - Farm identifier
   * @returns {Promise<Object>} Real-time insights
   */
  async getRealTimeInsights(farmId) {
    return this.makeRequest(`/ai/real-time-insights/${farmId}`);
  }

  // =========================
  // DATA VISUALIZATION METHODS
  // =========================

  /**
   * Generate yield trend chart
   * @param {Object} data - Yield trend data
   * @param {string} timeRange - Time range for chart
   * @returns {Promise<Object>} Chart data and image
   */
  async generateYieldTrendChart(data, timeRange = '6m') {
    return this.makeRequest(`/charts/yield-trend?timeRange=${timeRange}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Generate resource utilization dashboard
   * @param {Object} data - Resource data
   * @returns {Promise<Object>} Dashboard data and images
   */
  async generateResourceDashboard(data) {
    return this.makeRequest('/charts/resource-dashboard', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Generate disease pattern heatmap
   * @param {Array} diseaseData - Disease occurrence data
   * @param {Object} region - Region bounds for heatmap
   * @returns {Promise<Object>} Heatmap data and image
   */
  async generateDiseaseHeatmap(diseaseData, region) {
    return this.makeRequest('/charts/disease-heatmap', {
      method: 'POST',
      body: JSON.stringify({ diseaseData, region }),
    });
  }

  /**
   * Generate market price trends chart
   * @param {Array} priceData - Historical price data
   * @param {string} cropType - Type of crop
   * @param {Array} predictions - Optional price predictions
   * @returns {Promise<Object>} Market trends chart
   */
  async generateMarketTrendsChart(priceData, cropType, predictions = []) {
    return this.makeRequest('/charts/market-trends', {
      method: 'POST',
      body: JSON.stringify({ priceData, cropType, predictions }),
    });
  }

  /**
   * Generate weather correlation analysis chart
   * @param {Array} weatherData - Weather data
   * @param {Array} yieldData - Yield data
   * @param {Array} correlationFactors - Factors to correlate
   * @returns {Promise<Object>} Correlation chart
   */
  async generateWeatherCorrelationChart(weatherData, yieldData, correlationFactors = []) {
    return this.makeRequest('/charts/weather-correlation', {
      method: 'POST',
      body: JSON.stringify({ weatherData, yieldData, correlationFactors }),
    });
  }

  /**
   * Generate farm performance comparison chart
   * @param {Array} farmDataList - List of farms to compare
   * @param {string} metric - Metric to compare (e.g., 'yield', 'efficiency')
   * @returns {Promise<Object>} Comparison chart
   */
  async generateFarmComparisonChart(farmDataList, metric = 'yield') {
    return this.makeRequest('/charts/farm-comparison', {
      method: 'POST',
      body: JSON.stringify({ farmDataList, metric }),
    });
  }

  /**
   * Generate sustainability metrics chart
   * @param {Object} data - Sustainability data
   * @returns {Promise<Object>} Sustainability chart
   */
  async generateSustainabilityChart(data) {
    return this.makeRequest('/charts/sustainability', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get chart by ID
   * @param {string} chartId - Chart identifier
   * @returns {Promise<Object>} Chart data
   */
  async getChart(chartId) {
    return this.makeRequest(`/charts/${chartId}`);
  }

  /**
   * Get all charts for a specific farm
   * @param {string} farmId - Farm identifier
   * @returns {Promise<Object>} List of farm charts
   */
  async getFarmCharts(farmId) {
    return this.makeRequest(`/charts/farm/${farmId}`);
  }

  // =========================
  // ANALYTICS & UTILITIES
  // =========================

  /**
   * Get analytics summary for all services
   * @returns {Promise<Object>} Analytics summary
   */
  async getAnalyticsSummary() {
    return this.makeRequest('/analytics/summary');
  }

  /**
   * Check health of AI services
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    return this.makeRequest('/health');
  }

  // =========================
  // BATCH OPERATIONS
  // =========================

  /**
   * Generate multiple charts in parallel
   * @param {Array} chartRequests - Array of chart generation requests
   * @returns {Promise<Array>} Array of chart results
   */
  async generateMultipleCharts(chartRequests) {
    const promises = chartRequests.map(async (request) => {
      try {
        switch (request.type) {
          case 'yield-trend':
            return await this.generateYieldTrendChart(request.data, request.timeRange);
          case 'resource-dashboard':
            return await this.generateResourceDashboard(request.data);
          case 'disease-heatmap':
            return await this.generateDiseaseHeatmap(request.diseaseData, request.region);
          case 'market-trends':
            return await this.generateMarketTrendsChart(request.priceData, request.cropType, request.predictions);
          case 'sustainability':
            return await this.generateSustainabilityChart(request.data);
          default:
            throw new Error(`Unknown chart type: ${request.type}`);
        }
      } catch (error) {
        console.error(`Failed to generate ${request.type} chart:`, error);
        return { success: false, error: error.message, type: request.type };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Get comprehensive farm analytics (AI insights + charts)
   * @param {string} farmId - Farm identifier
   * @param {string} timeRange - Time range for analysis
   * @returns {Promise<Object>} Complete analytics package
   */
  async getComprehensiveFarmAnalytics(farmId, timeRange = '30d') {
    try {
      const [
        farmReport,
        realTimeInsights,
        farmCharts,
        analyticsSummary,
      ] = await Promise.all([
        this.generateFarmReport(farmId, timeRange),
        this.getRealTimeInsights(farmId),
        this.getFarmCharts(farmId),
        this.getAnalyticsSummary(),
      ]);

      return {
        success: true,
        farmReport: farmReport.report,
        realTimeInsights: realTimeInsights.insights,
        charts: farmCharts.charts,
        summary: analyticsSummary.summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get comprehensive farm analytics:', error);
      throw error;
    }
  }

  // =========================
  // CACHING & OPTIMIZATION
  // =========================

  /**
   * Cache chart data locally
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   * @param {number} ttl - Time to live in minutes
   */
  async cacheChartData(key, data, ttl = 30) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl: ttl * 60 * 1000, // Convert to milliseconds
      };
      await AsyncStorage.setItem(`chart_cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache chart data:', error);
    }
  }

  /**
   * Get cached chart data
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data or null if expired/not found
   */
  async getCachedChartData(key) {
    try {
      const cached = await AsyncStorage.getItem(`chart_cache_${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      const now = Date.now();
      
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        // Cache expired, remove it
        await AsyncStorage.removeItem(`chart_cache_${key}`);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get cached chart data:', error);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chartCacheKeys = keys.filter(key => key.startsWith('chart_cache_'));
      await AsyncStorage.multiRemove(chartCacheKeys);
      console.log(`Cleared ${chartCacheKeys.length} cached chart items`);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
}

// Create singleton instance
const aiApiService = new AiApiService();

export default aiApiService;
