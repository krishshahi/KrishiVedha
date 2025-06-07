/**
 * Weather related type definitions for KrishiVeda app
 */

export interface WeatherData {
  location: Location;
  current: CurrentWeather;
  forecast: Forecast;
  alerts?: WeatherAlert[];
}

export interface Location {
  id: string;
  name: string;
  region?: string;
  country: string;
  lat: number;
  lon: number;
  localtime: string;
}

export interface CurrentWeather {
  temp_c: number;
  temp_f: number;
  is_day: number;
  condition: WeatherCondition;
  wind_kph: number;
  wind_dir: string;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  feelslike_f: number;
  vis_km: number;
  uv: number;
  precip_mm: number;
  last_updated: string;
}

export interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}

export interface Forecast {
  forecastday: ForecastDay[];
}

export interface ForecastDay {
  date: string;
  date_epoch: number;
  day: DayForecast;
  hour: HourForecast[];
}

export interface DayForecast {
  maxtemp_c: number;
  maxtemp_f: number;
  mintemp_c: number;
  mintemp_f: number;
  avgtemp_c: number;
  avgtemp_f: number;
  totalsnow_cm: number;
  daily_chance_of_rain: number;
  daily_chance_of_snow: number;
  totalprecip_mm: number;
  condition: WeatherCondition;
  uv: number;
}

export interface HourForecast {
  time: string;
  temp_c: number;
  temp_f: number;
  condition: WeatherCondition;
  wind_kph: number;
  wind_dir: string;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  feelslike_f: number;
  chance_of_rain: number;
  chance_of_snow: number;
  precip_mm: number;
  will_it_rain: number;
  will_it_snow: number;
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

