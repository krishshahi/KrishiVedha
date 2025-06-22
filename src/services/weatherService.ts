import axios from 'axios';
import { WeatherData, WeatherForecast } from '../types/weather.types';

// Free weather API - Open-Meteo (no API key required)
// Documentation: https://open-meteo.com/
const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1';
const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1';

class WeatherService {
  private apiKey: string;

  constructor(apiKey: string = WEATHER_API_KEY) {
    this.apiKey = apiKey;
  }

  /**
   * Get current weather data for a location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      const response = await axios.get(`${WEATHER_BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric', // Use Celsius
          lang: 'en'
        }
      });

      const data = response.data;
      
      return {
        location: {
          name: data.name,
          country: data.sys.country,
          lat: data.coord.lat,
          lon: data.coord.lon
        },
        current: {
          temperature: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          windDirection: data.wind.deg,
          visibility: data.visibility / 1000, // Convert to km
          uvIndex: 0, // Not available in free tier
          condition: data.weather[0].main,
          description: data.weather[0].description,
          icon: data.weather[0].icon
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Get weather forecast for next 5 days
   */
  async getWeatherForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
    try {
      const response = await axios.get(`${WEATHER_BASE_URL}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          lang: 'en'
        }
      });

      const data = response.data;
      
      // Group forecasts by day and take the midday forecast (12:00)
      const dailyForecasts: WeatherForecast[] = [];
      const processedDates = new Set();

      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toDateString();
        
        // Take the first forecast of each day (or closest to midday)
        if (!processedDates.has(dateStr) && dailyForecasts.length < 5) {
          processedDates.add(dateStr);
          
          dailyForecasts.push({
            date: date.toISOString(),
            temperature: {
              min: Math.round(item.main.temp_min),
              max: Math.round(item.main.temp_max)
            },
            humidity: item.main.humidity,
            windSpeed: item.wind.speed,
            condition: item.weather[0].main,
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            precipitationChance: Math.round((item.pop || 0) * 100)
          });
        }
      });

      return dailyForecasts;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw new Error('Failed to fetch weather forecast');
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
      const response = await axios.get(`${WEATHER_BASE_URL}/weather`, {
        params: {
          q: `${cityName},NP`, // NP is country code for Nepal
          appid: this.apiKey,
          units: 'metric',
          lang: 'en'
        }
      });

      const data = response.data;
      
      return {
        location: {
          name: data.name,
          country: data.sys.country,
          lat: data.coord.lat,
          lon: data.coord.lon
        },
        current: {
          temperature: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          windDirection: data.wind.deg,
          visibility: data.visibility / 1000,
          uvIndex: 0,
          condition: data.weather[0].main,
          description: data.weather[0].description,
          icon: data.weather[0].icon
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching weather by city:', error);
      throw new Error('Failed to fetch weather data for city');
    }
  }
}

export default new WeatherService();

