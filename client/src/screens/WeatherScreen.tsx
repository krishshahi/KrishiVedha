import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  RefreshControl, 
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';
import weatherService from '../services/weatherService';
import { WeatherData } from '../types/weather.types';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';

interface ForecastItemProps {
  time: string;
  icon: string;
  temp: number;
  precipitation: number;
}

const ForecastItem: React.FC<ForecastItemProps> = ({ time, icon, temp, precipitation }) => {
  return (
    <View style={styles.forecastItem}>
      <Text style={styles.forecastTime}>{time}</Text>
      <Text style={styles.forecastIcon}>{icon}</Text>
      <Text style={styles.forecastTemp}>{temp}°C</Text>
      <Text style={styles.forecastPrecip}>{precipitation}%</Text>
    </View>
  );
};

interface DailyForecastProps {
  day: string;
  icon: string;
  highTemp: number;
  lowTemp: number;
  precipitation: number;
}

const DailyForecast: React.FC<DailyForecastProps> = ({ day, icon, highTemp, lowTemp, precipitation }) => {
  return (
    <View style={styles.dailyItem}>
      <Text style={styles.dailyDay}>{day}</Text>
      <Text style={styles.dailyIcon}>{icon}</Text>
      <View style={styles.dailyTempContainer}>
        <Text style={styles.dailyHighTemp}>{highTemp}°</Text>
        <Text style={styles.dailyLowTemp}>{lowTemp}°</Text>
      </View>
      <Text style={styles.dailyPrecip}>{precipitation}%</Text>
    </View>
  );
};

const WeatherScreen = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState({ lat: 27.7172, lng: 85.3240 }); // Default to Kathmandu
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);

  const fetchWeatherData = useCallback(async () => {
    try {
      setError(null);
      console.log('🌤️ Fetching comprehensive weather data for:', location);
      const completeWeatherData = await weatherService.getCompleteWeatherData(location.lat, location.lng);
      console.log('🌤️ Complete weather data received:', completeWeatherData);
      setWeatherData(completeWeatherData);
    } catch (err) {
      setError('Failed to fetch weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWeatherData();
  }, [fetchWeatherData]);

  const handleLocationChange = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to get weather for your area.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude
      });
      setLoading(true);
    } catch (error) {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    }
  };

  const getWeatherIcon = (condition?: string) => {
    if (!condition) return '🌤️';
    
    const icons: { [key: string]: string } = {
      'clear': '☀️',
      'sunny': '☀️',
      'partly-cloudy': '🌤️',
      'cloudy': '☁️',
      'overcast': '⛅',
      'rain': '🌧️',
      'light-rain': '🌦️',
      'heavy-rain': '⛈️',
      'snow': '🌨️',
      'fog': '🌫️',
      'wind': '💨'
    };
    return icons[condition.toLowerCase()] || '🌤️';
  };

  const generateWeatherAlerts = () => {
    const alerts = [];
    
    // Use either real weather data or fallback values for demonstration
    const temp = weatherData?.current?.temperature || 28;
    const precipitation = weatherData?.current?.precipitationChance || 0;
    const windSpeed = weatherData?.current?.windSpeed || 5;
    const humidity = weatherData?.current?.humidity || 65;
    const condition = weatherData?.current?.condition?.toLowerCase() || 'partly-cloudy';
    
    // Debug logging
    console.log('Weather data for alerts:', { temp, precipitation, windSpeed, humidity, condition });

    // High temperature alert
    if (temp > 35) {
      alerts.push({
        id: 'heat',
        icon: '🌡️',
        title: 'Extreme Heat Warning',
        description: `Very high temperature (${Math.round(temp)}°C). Avoid outdoor activities during peak hours.`,
        color: COLORS.error,
        priority: 'high'
      });
    } else if (temp > 30) {
      alerts.push({
        id: 'hot',
        icon: '☀️',
        title: 'Hot Weather Alert',
        description: `High temperature expected (${Math.round(temp)}°C). Stay hydrated and seek shade.`,
        color: COLORS.warning,
        priority: 'medium'
      });
    }

    // Low temperature alert
    if (temp < 5) {
      alerts.push({
        id: 'cold',
        icon: '🥶',
        title: 'Cold Weather Warning',
        description: `Very low temperature (${Math.round(temp)}°C). Protect crops from frost damage.`,
        color: COLORS.info,
        priority: 'high'
      });
    }

    // Precipitation alerts
    if (precipitation > 70) {
      alerts.push({
        id: 'heavy-rain',
        icon: '⛈️',
        title: 'Heavy Rainfall Alert',
        description: `Heavy rainfall expected (${Math.round(precipitation)}% chance). Risk of flooding and crop damage.`,
        color: COLORS.warning,
        priority: 'high'
      });
    } else if (precipitation > 40) {
      alerts.push({
        id: 'rain',
        icon: '🌧️',
        title: 'Rainfall Expected',
        description: `Moderate rainfall likely (${Math.round(precipitation)}% chance). Good for irrigation but monitor drainage.`,
        color: COLORS.info,
        priority: 'medium'
      });
    }

    // Wind alerts
    if (windSpeed > 25) {
      alerts.push({
        id: 'strong-wind',
        icon: '💨',
        title: 'Strong Wind Alert',
        description: `High wind speeds (${Math.round(windSpeed)} km/h). Secure loose objects and protect tall crops.`,
        color: COLORS.warning,
        priority: 'medium'
      });
    }

    // Humidity alerts
    if (humidity > 85) {
      alerts.push({
        id: 'high-humidity',
        icon: '💧',
        title: 'High Humidity Alert',
        description: `Very high humidity (${humidity}%). Increased risk of plant diseases and pest activity.`,
        color: COLORS.info,
        priority: 'low'
      });
    } else if (humidity < 30) {
      alerts.push({
        id: 'low-humidity',
        icon: '🏜️',
        title: 'Low Humidity Alert',
        description: `Low humidity (${humidity}%). Consider additional irrigation for crops.`,
        color: COLORS.warning,
        priority: 'medium'
      });
    }

    // Drought conditions
    if (precipitation < 10 && temp > 28 && humidity < 40) {
      alerts.push({
        id: 'drought',
        icon: '🌵',
        title: 'Drought Conditions',
        description: 'Hot, dry conditions detected. Implement water conservation measures.',
        color: COLORS.error,
        priority: 'high'
      });
    }

    // Add some example alerts if no real alerts are generated
    if (alerts.length === 0) {
      alerts.push({
        id: 'example-weather-info',
        icon: '🌤️',
        title: 'Weather Information',
        description: `Current conditions: ${Math.round(temp)}°C, ${humidity}% humidity. Monitor crops for optimal growing conditions.`,
        color: COLORS.info,
        priority: 'medium'
      });
      
      if (temp > 25) {
        alerts.push({
          id: 'warm-weather',
          icon: '☀️',
          title: 'Warm Weather Conditions',
          description: 'Good weather for crop growth. Ensure adequate irrigation.',
          color: COLORS.primary,
          priority: 'low'
        });
      }
    }

    // Sort by priority (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return alerts.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  };

  const weatherAlerts = generateWeatherAlerts();

  const generateFarmingImpact = () => {
    if (!weatherData?.current || !user?.farms || user.farms.length === 0) return [];

    const impacts = [];
    const temp = weatherData.current.temperature;
    const humidity = weatherData.current.humidity;
    const windSpeed = weatherData.current.windSpeed;
    const condition = weatherData.current.condition?.toLowerCase() || '';
    const precipitation = weatherData.current.precipitationChance || 0;

    // Get all unique crops from all farms
    const allCrops = user.farms.flatMap(farm => farm.crops);
    const uniqueCrops = allCrops.reduce((unique, crop) => {
      if (!unique.find(c => c.name.toLowerCase() === crop.name.toLowerCase())) {
        unique.push(crop);
      }
      return unique;
    }, [] as { name: string; status: string }[]);

    uniqueCrops.forEach((crop) => {
      switch (crop.name.toLowerCase()) {
          case 'rice':
            // Rice crops analysis
            if (condition.includes('rain') || precipitation > 30) {
              impacts.push({
                crop: 'Rice Crops',
                icon: '🌾',
                description: 'Abundant rainfall is excellent for rice cultivation. Monitor water levels in paddies and ensure proper drainage to prevent waterlogging.'
              });
            } else if (temp > 30 && humidity < 40) {
              impacts.push({
                crop: 'Rice Crops',
                icon: '🌾',
                description: 'Hot and dry conditions detected. Increase irrigation frequency for rice paddies to maintain optimal water levels.'
              });
            } else {
              impacts.push({
                crop: 'Rice Crops',
                icon: '🌾',
                description: 'Current weather conditions are favorable for rice cultivation. Monitor crop growth and maintain steady water levels.'
              });
            }
            break;
          case 'potato':
            // Potato crops analysis
            if (condition.includes('storm') || condition.includes('thunderstorm')) {
              impacts.push({
                crop: 'Potato Crops',
                icon: '🥔',
                description: 'Stormy weather detected. Protect potato plants and check for physical damage after storms pass.'
              });
            } else if (humidity > 85) {
              impacts.push({
                crop: 'Potato Crops',
                icon: '🥔',
                description: 'High humidity increases risk of potato blight and fungal diseases. Consider preventive fungicide application.'
              });
            } else if (temp > 25 && temp < 30) {
              impacts.push({
                crop: 'Potato Crops',
                icon: '🥔',
                description: 'Optimal temperature range for potato growth. Good conditions for tuber development and harvest preparation.'
              });
            } else {
              impacts.push({
                crop: 'Potato Crops',
                icon: '🥔',
                description: 'Monitor potato crops for pest activity and ensure adequate soil moisture for healthy tuber development.'
              });
            }
            break;
          case 'wheat':
            // Add wheat crops if temperature is suitable
            if (temp < 25) {
              impacts.push({
                crop: 'Wheat Crops',
                icon: '🌾',
                description: 'Cool temperatures are favorable for wheat growth. Monitor for pest activity and ensure adequate nutrition.'
              });
            }
            break;
          case 'corn':
            // Add corn crops for warmer weather
            if (temp > 25 && temp < 35) {
              impacts.push({
                crop: 'Corn Crops',
                icon: '🌽',
                description: 'Warm temperatures support corn growth. Ensure adequate water supply and monitor for pest damage.'
              });
            }
            break;
          default:
            break;
        }
    });

    return impacts;
  };

  const farmingImpacts = generateFarmingImpact();

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  if (error && !weatherData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchWeatherData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weather Forecast</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Weather */}
        <View style={styles.currentWeather}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>
              {user?.location
                ? `${user.location.district || 'Kathmandu'}`
                : 'Kathmandu'}
            </Text>
            <TouchableOpacity style={styles.locationButton} onPress={handleLocationChange}>
              <Text style={styles.locationButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.weatherMainInfo}>
            <Text style={styles.weatherIcon}>
              {weatherData ? getWeatherIcon(weatherData.current?.condition) : '☀️'}
            </Text>
            <Text style={styles.temperatureText}>
              {weatherData && !isNaN(weatherData.current?.temperature) ? Math.round(weatherData.current.temperature) : 28}°C
            </Text>
            <Text style={styles.weatherCondition}>
              {weatherData && weatherData.current?.condition ? weatherData.current.condition : 'Partly Cloudy'}
            </Text>
          </View>
          
          <View style={styles.weatherDetailsRow}>
            <View style={styles.weatherDetailItem}>
              <Text style={styles.weatherDetailIcon}>💧</Text>
              <Text style={styles.weatherDetailTitle}>Humidity</Text>
              <Text style={styles.weatherDetailValue}>
              {weatherData && !isNaN(weatherData.current?.humidity) ? weatherData.current.humidity : 65}%
              </Text>
            </View>
            <View style={styles.weatherDetailItem}>
              <Text style={styles.weatherDetailIcon}>💨</Text>
              <Text style={styles.weatherDetailTitle}>Wind</Text>
              <Text style={styles.weatherDetailValue}>
              {weatherData && !isNaN(weatherData.current?.windSpeed) ? Math.round(weatherData.current.windSpeed) : 5} km/h
              </Text>
            </View>
            <View style={styles.weatherDetailItem}>
              <Text style={styles.weatherDetailIcon}>☔</Text>
              <Text style={styles.weatherDetailTitle}>Rain</Text>
              <Text style={styles.weatherDetailValue}>
              {weatherData && !isNaN(weatherData.current?.precipitationChance) ? Math.round(weatherData.current.precipitationChance) : 0}%
              </Text>
            </View>
          </View>
        </View>
        
        {/* Dynamic Weather Alerts */}
        {weatherAlerts.length > 0 && (
          <View style={styles.alertContainer}>
            <Text style={styles.alertsSectionTitle}>Weather Alerts</Text>
            {weatherAlerts.slice(0, 3).map((alert, index) => (
              <View 
                key={alert.id} 
                style={[
                  styles.alertItem, 
                  { backgroundColor: alert.color + '20', marginBottom: index < weatherAlerts.slice(0, 3).length - 1 ? SPACING.sm : 0 }
                ]}
              >
                <Text style={[styles.alertIcon, { color: alert.color }]}>{alert.icon}</Text>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDescription}>{alert.description}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.alertButton, { backgroundColor: alert.color }]}
                  onPress={() => Alert.alert(alert.title, alert.description)}
                >
                  <Text style={styles.alertButtonText}>Details</Text>
                </TouchableOpacity>
              </View>
            ))}
            {weatherAlerts.length > 3 && (
              <TouchableOpacity 
                style={styles.viewAllAlertsButton}
                onPress={() => {
                  const allAlerts = weatherAlerts.map(alert => `${alert.title}: ${alert.description}`).join('\n\n');
                  Alert.alert('All Weather Alerts', allAlerts);
                }}
              >
                <Text style={styles.viewAllAlertsText}>View All {weatherAlerts.length} Alerts</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Forecast Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'today' && styles.activeTab]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'tomorrow' && styles.activeTab]}
            onPress={() => setActiveTab('tomorrow')}
          >
            <Text style={[styles.tabText, activeTab === 'tomorrow' && styles.activeTabText]}>Tomorrow</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'week' && styles.activeTab]}
            onPress={() => setActiveTab('week')}
          >
            <Text style={[styles.tabText, activeTab === 'week' && styles.activeTabText]}>7 Days</Text>
          </TouchableOpacity>
        </View>
        
        {/* Hourly Forecast */}
        {(activeTab === 'today' || activeTab === 'tomorrow') && (
          <View style={styles.hourlyForecastContainer}>
            <Text style={styles.forecastTitle}>Hourly Forecast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
              {weatherData?.hourly && weatherData.hourly.length > 0 ? (
                weatherData.hourly.slice(0, 12).map((hourlyItem, index) => (
                  <ForecastItem
                    key={index}
                    time={new Date(hourlyItem.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                    icon={getWeatherIcon(hourlyItem.condition)}
                    temp={Math.round(hourlyItem.temperature)}
                    precipitation={hourlyItem.precipitationChance}
                  />
                ))
              ) : (
                // Fallback to daily forecast if no hourly data
                weatherData?.forecast && weatherData.forecast.slice(0, 6).map((forecast, index) => (
                  <ForecastItem
                    key={index}
                    time={new Date(forecast.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    icon={getWeatherIcon(forecast.condition)}
                    temp={Math.round(forecast.temperature.max)}
                    precipitation={forecast.precipitationChance}
                  />
                ))
              )}
            </ScrollView>
          </View>
        )}
        
        {/* Daily Forecast */}
        {activeTab === 'week' && (
          <View style={styles.dailyForecastContainer}>
            <Text style={styles.forecastTitle}>7-Day Forecast</Text>
            {weatherData?.forecast && weatherData.forecast.map((forecast, index) => (
              <DailyForecast
                key={index}
                day={new Date(forecast.date).toLocaleDateString('en-US', { weekday: 'short' })}
                icon={getWeatherIcon(forecast.condition)}
                highTemp={Math.round(forecast.temperature.max)}
                lowTemp={Math.round(forecast.temperature.min)}
                precipitation={forecast.precipitationChance}
              />
            ))}
          </View>
        )}
        
        {/* Agricultural Weather Impact */}
        <View style={styles.impactContainer}>
          <Text style={styles.forecastTitle}>Impact on Farming</Text>
          {farmingImpacts.length > 0 ? (
            farmingImpacts.map((impact, index) => (
              <View key={index} style={styles.impactItem}>
                <Text style={styles.impactIcon}>{impact.icon}</Text>
                <View style={styles.impactContent}>
                  <Text style={styles.impactTitle}>{impact.crop}</Text>
                  <Text style={styles.impactDescription}>{impact.description}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.impactItem}>
              <Text style={styles.impactIcon}>🌱</Text>
              <View style={styles.impactContent}>
                <Text style={styles.impactTitle}>No Crops Registered</Text>
                <Text style={styles.impactDescription}>
                  Add crops to your farm profile to get personalized weather impact analysis and farming recommendations.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  scrollView: {
    flex: 1,
  },
  currentWeather: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    margin: SPACING.md,
    padding: SPACING.md,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  locationButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 15,
  },
  locationButtonText: {
    color: COLORS.textWhite,
    fontSize: FONTS.size.sm,
  },
  weatherMainInfo: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  weatherIcon: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  temperatureText: {
    fontSize: FONTS.size.xxxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  weatherCondition: {
    fontSize: FONTS.size.md,
    color: COLORS.textWhite,
    opacity: 0.9,
  },
  weatherDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  weatherDetailItem: {
    alignItems: 'center',
  },
  weatherDetailIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  weatherDetailTitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textWhite,
    opacity: 0.8,
  },
  weatherDetailValue: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  alertContainer: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  alertItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  alertDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  alertButton: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 15,
  },
  alertButtonText: {
    color: COLORS.textWhite,
    fontSize: FONTS.size.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 25,
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  activeTabText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  hourlyForecastContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  forecastTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  hourlyScroll: {
    flexDirection: 'row',
  },
  forecastItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    width: 60,
  },
  forecastTime: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  forecastIcon: {
    fontSize: 24,
    marginVertical: SPACING.xs,
  },
  forecastTemp: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  forecastPrecip: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent,
  },
  dailyForecastContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dailyDay: {
    width: 60,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  dailyIcon: {
    width: 40,
    fontSize: 24,
    textAlign: 'center',
  },
  dailyTempContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  dailyHighTemp: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginRight: SPACING.md,
  },
  dailyLowTemp: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  dailyPrecip: {
    width: 40,
    fontSize: FONTS.size.md,
    color: COLORS.accent,
    textAlign: 'right',
  },
  impactContainer: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.lg,
  },
  impactItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  impactIcon: {
    fontSize: 30,
    marginRight: SPACING.md,
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  impactDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: FONTS.size.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  retryButtonText: {
    color: COLORS.textWhite,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
  },
  alertsSectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  viewAllAlertsButton: {
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.sm,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  viewAllAlertsText: {
    color: COLORS.primary,
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
  },
});

export default WeatherScreen;

