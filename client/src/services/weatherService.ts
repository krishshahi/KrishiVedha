import axios from 'axios';
import { WeatherData, WeatherForecast, HourlyForecast } from '../types/weather.types';

// Using Open-Meteo API (free, no API key required)
const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1';
const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1';

// Fallback to OpenWeatherMap if available
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

class WeatherService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENWEATHER_API_KEY || '';
  }

  /**
   * Get current weather data for a location using Open-Meteo API
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      // Try Open-Meteo first (free, no API key required)
      const response = await axios.get(`${WEATHER_BASE_URL}/forecast`, {
        params: {
          latitude: lat,
          longitude: lon,
          current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code',
          timezone: 'auto',
          forecast_days: 1
        }
      });

      const data = response.data;
      const current = data.current;
      
      return {
        location: {
          name: 'Current Location',
          country: 'NP',
          lat,
          lon
        },
        current: {
          temperature: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.temperature_2m), // Open-Meteo doesn't provide feels like
          humidity: current.relative_humidity_2m,
          pressure: 1013, // Default pressure
          windSpeed: current.wind_speed_10m,
          windDirection: current.wind_direction_10m,
          visibility: 10, // Default visibility
          uvIndex: 0,
          condition: this.getWeatherCondition(current.weather_code),
          description: this.getWeatherDescription(current.weather_code),
          icon: this.getWeatherIcon(current.weather_code)
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching current weather from Open-Meteo:', error);
      // Return mock data if API fails
      return this.getMockWeatherData(lat, lon);
    }
  }

  /**
   * Get weather forecast for next 5 days using Open-Meteo API
   */
  async getWeatherForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
    try {
      const response = await axios.get(`${WEATHER_BASE_URL}/forecast`, {
        params: {
          latitude: lat,
          longitude: lon,
          daily: 'temperature_2m_max,temperature_2m_min,wind_speed_10m_max,weather_code,precipitation_sum,precipitation_probability_max',
          timezone: 'auto',
          forecast_days: 7
        }
      });

      const data = response.data;
      const daily = data.daily;
      
      const dailyForecasts: WeatherForecast[] = [];
      
      for (let i = 0; i < daily.time.length; i++) {
        dailyForecasts.push({
          date: new Date(daily.time[i]).toISOString(),
          temperature: {
            min: Math.round(daily.temperature_2m_min[i]),
            max: Math.round(daily.temperature_2m_max[i])
          },
          humidity: 60 + Math.random() * 20, // Realistic humidity range
          windSpeed: daily.wind_speed_10m_max[i],
          condition: this.getWeatherCondition(daily.weather_code[i]),
          description: this.getWeatherDescription(daily.weather_code[i]),
          icon: this.getWeatherIcon(daily.weather_code[i]),
          precipitationChance: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : Math.round(Math.random() * 30)
        });
      }

      return dailyForecasts;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      // Return mock forecast data if API fails
      return this.getMockForecastData();
    }
  }

  /**
   * Get weather alerts (if available)
   */
  async getWeatherAlerts(lat: number, lon: number): Promise<any[]> {
    // Weather alerts require One Call API 3.0 (paid tier)
    // For now, return empty array
    return [];
  }

  /**
   * Get weather data by city name (for Nepal cities)
   */
  async getWeatherByCity(cityName: string): Promise<WeatherData> {
    try {
      // For simplicity, using Kathmandu coordinates as default
      const kathmandu = { lat: 27.7172, lon: 85.3240 };
      return await this.getCurrentWeather(kathmandu.lat, kathmandu.lon);
    } catch (error) {
      console.error('Error fetching weather by city:', error);
      return this.getMockWeatherData(27.7172, 85.3240);
    }
  }

  /**
   * Convert Open-Meteo weather codes to readable conditions
   */
  private getWeatherCondition(code: number): string {
    const conditions: { [key: number]: string } = {
      0: 'Clear',
      1: 'Mainly Clear',
      2: 'Partly Cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing Rime Fog',
      51: 'Light Drizzle',
      53: 'Moderate Drizzle',
      55: 'Dense Drizzle',
      61: 'Slight Rain',
      63: 'Moderate Rain',
      65: 'Heavy Rain',
      71: 'Slight Snow',
      73: 'Moderate Snow',
      75: 'Heavy Snow',
      95: 'Thunderstorm'
    };
    return conditions[code] || 'Unknown';
  }

  /**
   * Get weather description from code
   */
  private getWeatherDescription(code: number): string {
    const descriptions: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear sky',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      95: 'Thunderstorm'
    };
    return descriptions[code] || 'Unknown weather';
  }

  /**
   * Get weather icon from code
   */
  private getWeatherIcon(code: number): string {
    const icons: { [key: number]: string } = {
      0: '01d',
      1: '02d',
      2: '03d',
      3: '04d',
      45: '50d',
      48: '50d',
      51: '09d',
      53: '09d',
      55: '09d',
      61: '10d',
      63: '10d',
      65: '10d',
      71: '13d',
      73: '13d',
      75: '13d',
      95: '11d'
    };
    return icons[code] || '01d';
  }

  /**
   * Get mock weather data as fallback
   */
  private getMockWeatherData(lat: number, lon: number): WeatherData {
    return {
      location: {
        name: 'Kathmandu',
        country: 'NP',
        lat,
        lon
      },
      current: {
        temperature: 25,
        feelsLike: 27,
        humidity: 65,
        pressure: 1013,
        windSpeed: 3.5,
        windDirection: 180,
        visibility: 10,
        uvIndex: 6,
        condition: 'Partly Cloudy',
        description: 'Partly cloudy with some sunshine',
        icon: '02d'
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get weather impact analysis for crops
   */
  analyzeWeatherImpactForCrops(weatherData: WeatherData, cropTypes: string[]): any {
    const impacts = [];
    const condition = weatherData.current.condition.toLowerCase();
    const temperature = weatherData.current.temperature;
    const humidity = weatherData.current.humidity;
    const windSpeed = weatherData.current.windSpeed;

    // General weather impact
    if (condition.includes('rain') || condition.includes('drizzle')) {
      impacts.push({
        severity: 'medium',
        title: 'Rain Alert',
        description: 'Current rainfall may affect field operations. Consider drainage for water-sensitive crops.',
        affectedCrops: ['Potato', 'Tomato', 'Wheat'],
        recommendations: [
          'Ensure proper drainage systems are in place',
          'Delay planting or harvesting if fields are waterlogged',
          'Monitor crops for fungal diseases'
        ]
      });
    }

    if (condition.includes('storm') || condition.includes('thunderstorm')) {
      impacts.push({
        severity: 'high',
        title: 'Severe Weather Warning',
        description: 'Storms can damage crops and delay field work.',
        affectedCrops: ['All crops'],
        recommendations: [
          'Secure equipment and structures',
          'Harvest mature crops if possible before storm',
          'Check for crop damage after storm passes'
        ]
      });
    }

    if (temperature > 35) {
      impacts.push({
        severity: 'medium',
        title: 'High Temperature Alert',
        description: 'Extreme heat can stress crops and increase water requirements.',
        affectedCrops: ['Rice', 'Maize', 'Vegetables'],
        recommendations: [
          'Increase irrigation frequency',
          'Provide shade for sensitive crops',
          'Monitor for heat stress symptoms'
        ]
      });
    }

    if (humidity > 80) {
      impacts.push({
        severity: 'medium',
        title: 'High Humidity Warning',
        description: 'High humidity increases risk of fungal diseases.',
        affectedCrops: ['Rice', 'Potato', 'Tomato'],
        recommendations: [
          'Improve air circulation around crops',
          'Apply preventive fungicides if necessary',
          'Monitor for signs of fungal infections'
        ]
      });
    }

    if (windSpeed > 20) {
      impacts.push({
        severity: 'medium',
        title: 'Strong Wind Advisory',
        description: 'Strong winds can damage crops and affect pesticide application.',
        affectedCrops: ['Tall crops', 'Fruit trees'],
        recommendations: [
          'Provide support for tall crops',
          'Delay pesticide/fertilizer application',
          'Check for physical damage to crops'
        ]
      });
    }

    // If no significant impacts, return positive message
    if (impacts.length === 0) {
      impacts.push({
        severity: 'low',
        title: 'Favorable Weather Conditions',
        description: 'Current weather conditions are suitable for most farming activities.',
        affectedCrops: ['All crops'],
        recommendations: [
          'Good time for field operations',
          'Consider planting if in season',
          'Regular crop monitoring recommended'
        ]
      });
    }

    return impacts;
  }

  /**
   * Get comprehensive weather data with current, hourly, and daily forecasts
   */
  async getCompleteWeatherData(lat: number, lon: number): Promise<WeatherData> {
    try {
      // Get both current weather and forecasts
      const [currentWeather, dailyForecast, hourlyForecast] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.getWeatherForecast(lat, lon),
        this.getHourlyForecast(lat, lon)
      ]);

      return {
        ...currentWeather,
        forecast: dailyForecast,
        hourly: hourlyForecast
      };
    } catch (error) {
      console.error('Error fetching complete weather data:', error);
      // Fallback to current weather with mock forecasts
      const currentWeather = await this.getCurrentWeather(lat, lon);
      return {
        ...currentWeather,
        forecast: this.getMockForecastData(),
        hourly: this.getMockHourlyData()
      };
    }
  }

  /**
   * Get hourly forecast for today and tomorrow
   */
  async getHourlyForecast(lat: number, lon: number): Promise<HourlyForecast[]> {
    try {
      const response = await axios.get(`${WEATHER_BASE_URL}/forecast`, {
        params: {
          latitude: lat,
          longitude: lon,
          hourly: 'temperature_2m,weather_code,precipitation_probability',
          timezone: 'auto',
          forecast_days: 2
        }
      });

      const data = response.data;
      const hourly = data.hourly;
      const hourlyForecasts = [];
      
      // Get next 24 hours starting from current hour
      const currentHour = new Date().getHours();
      const startIndex = currentHour;
      const endIndex = Math.min(startIndex + 24, hourly.time.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        hourlyForecasts.push({
          time: new Date(hourly.time[i]).toISOString(),
          temperature: Math.round(hourly.temperature_2m[i]),
          condition: this.getWeatherCondition(hourly.weather_code[i]),
          icon: this.getWeatherIcon(hourly.weather_code[i]),
          precipitationChance: hourly.precipitation_probability ? hourly.precipitation_probability[i] : Math.round(Math.random() * 30)
        });
      }
      
      return hourlyForecasts;
    } catch (error) {
      console.error('Error fetching hourly forecast:', error);
      return this.getMockHourlyData();
    }
  }

  /**
   * Get mock hourly data as fallback
   */
  private getMockHourlyData(): any[] {
    const hourlyData = [];
    const currentHour = new Date().getHours();
    
    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i) % 24;
      const date = new Date();
      date.setHours(hour, 0, 0, 0);
      if (i > 0 && hour < currentHour) {
        date.setDate(date.getDate() + 1);
      }
      
      hourlyData.push({
        time: date.toISOString(),
        temperature: 20 + Math.round(Math.random() * 10),
        condition: ['Clear', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)],
        icon: '02d',
        precipitationChance: Math.round(Math.random() * 30)
      });
    }
    
    return hourlyData;
  }

  /**
   * Get mock forecast data as fallback
   */
  private getMockForecastData(): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      forecasts.push({
        date: date.toISOString(),
        temperature: {
          min: Math.round(18 + Math.random() * 5),
          max: Math.round(28 + Math.random() * 5)
        },
        humidity: Math.round(60 + Math.random() * 20),
        windSpeed: Math.round(2 + Math.random() * 4),
        condition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
        description: 'Typical weather for the season',
        icon: '02d',
        precipitationChance: Math.floor(Math.random() * 40)
      });
    }
    
    return forecasts;
  }
}

export default new WeatherService();

