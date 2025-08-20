/**
 * Weather related type definitions for KrishiVeda app
 * Updated to match Open-Meteo API format
 */

export interface WeatherData {
  location: Location;
  current: CurrentWeather;
  forecast?: WeatherForecast[];
  hourly?: HourlyForecast[];
  alerts?: WeatherAlert[];
  lastUpdated: string;
}

export interface Location {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  uvIndex: number;
  condition: string;
  description: string;
  icon: string;
  precipitationChance?: number;
  
  // Legacy API compatibility properties
  temp_c?: number;
  feelslike_c?: number;
  wind_kph?: number;
  vis_km?: number;
  pressure_mb?: number;
  last_updated?: string;
}

export interface WeatherForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  precipitationChance: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  icon: string;
  precipitationChance: number;
  humidity?: number;
  windSpeed?: number;
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  time: string;
  expires: string;
}

export type WeatherAlertType = 'rain' | 'flood' | 'storm' | 'wind' | 'temperature' | 'other';

