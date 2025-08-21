import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { styles } from '../styles/HomeScreen.styles';
import { fetchDashboardData, refreshDashboardData } from '../store/slices/dashboardSlice';
import { logoutUser } from '../store/slices/authSlice';
import apiService from '../services/apiService';
import notificationService from '../services/notificationService';

interface FeatureCardProps {
  title: string;
  icon: string;
  description: string;
  onPress: () => void;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  icon: string;
  title: string;
  description: string;
  color: string;
  priority?: number;
  timestamp?: Date;
}

interface Activity {
  id: string;
  date: Date;
  title: string;
  description: string;
  icon: string;
  type: string;
  farmId?: string;
  cropId?: string;
  isCompleted?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, icon, description, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.featureCard}
      onPress={onPress}
    >
      <View style={styles.featureIconContainer}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </TouchableOpacity>
  );
};

const HomeScreenDynamic = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const {
    userStats,
    recentFarms,
    weatherData,
    isLoading,
    isRefreshing,
    error,
  } = useAppSelector((state) => state.dashboard);

  // Local state for dynamic data
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Fetch alerts from backend
  const fetchAlerts = useCallback(async () => {
    if (!user?.id) return;
    
    setAlertsLoading(true);
    try {
      const dynamicAlerts: Alert[] = [];
      
      // Fetch weather alerts
      if (weatherData && weatherData.length > 0) {
        const currentWeather = weatherData[0];
        
        // Heavy rain alert
        if (currentWeather.precipitationChance > 70) {
          dynamicAlerts.push({
            id: 'weather_rain',
            type: 'warning',
            icon: '🌧️',
            title: 'Heavy Rain Alert',
            description: `${currentWeather.precipitationChance}% chance of rain. Protect sensitive crops and check drainage.`,
            color: COLORS.warning,
            priority: 2,
            timestamp: new Date(),
          });
        }
        
        // Temperature alert
        if (currentWeather.temperature > 35) {
          dynamicAlerts.push({
            id: 'weather_heat',
            type: 'danger',
            icon: '🔥',
            title: 'High Temperature Warning',
            description: `Temperature reaching ${currentWeather.temperature}°C. Increase irrigation frequency.`,
            color: COLORS.danger,
            priority: 1,
            timestamp: new Date(),
          });
        } else if (currentWeather.temperature < 10) {
          dynamicAlerts.push({
            id: 'weather_cold',
            type: 'warning',
            icon: '❄️',
            title: 'Low Temperature Alert',
            description: `Temperature dropping to ${currentWeather.temperature}°C. Protect vulnerable crops from frost.`,
            color: COLORS.warning,
            priority: 2,
            timestamp: new Date(),
          });
        }
        
        // Wind alert
        if (currentWeather.windSpeed > 30) {
          dynamicAlerts.push({
            id: 'weather_wind',
            type: 'warning',
            icon: '💨',
            title: 'Strong Wind Advisory',
            description: `Wind speed ${currentWeather.windSpeed} km/h. Secure greenhouse structures and support tall crops.`,
            color: COLORS.warning,
            priority: 3,
            timestamp: new Date(),
          });
        }
      }
      
      // Fetch crop-specific alerts
      try {
        const cropResponse = await apiService.getCrops();
        if (cropResponse && Array.isArray(cropResponse)) {
          cropResponse.forEach((crop: any) => {
            const progress = crop.progress || 0;
            
            // Harvest ready alert
            if (progress >= 90) {
              dynamicAlerts.push({
                id: `crop_harvest_${crop._id}`,
                type: 'success',
                icon: '🌾',
                title: `${crop.name} Ready for Harvest`,
                description: `Your ${crop.name} in ${crop.farmName || 'farm'} is ${progress}% mature and ready for harvest.`,
                color: COLORS.success,
                priority: 1,
                timestamp: new Date(),
              });
            }
            
            // Pest alert (if pest issues detected)
            if (crop.pestAlert) {
              dynamicAlerts.push({
                id: `pest_alert_${crop._id}`,
                type: 'danger',
                icon: '🐛',
                title: 'Pest Alert',
                description: `Pest activity detected in ${crop.name}. Consider organic pest control measures.`,
                color: COLORS.danger,
                priority: 1,
                timestamp: new Date(),
              });
            }
          });
        }
      } catch (error) {
        console.log('Error fetching crop alerts:', error);
      }
      
      // Fetch IoT sensor alerts
      try {
        const iotResponse = await apiService.getIoTDevices();
        if (iotResponse && Array.isArray(iotResponse)) {
          iotResponse.forEach((device: any) => {
            if (device.status === 'alert' || device.alert) {
              dynamicAlerts.push({
                id: `iot_${device._id}`,
                type: 'warning',
                icon: '📡',
                title: `Sensor Alert: ${device.name}`,
                description: device.alertMessage || `${device.name} requires attention. Check sensor readings.`,
                color: COLORS.warning,
                priority: 2,
                timestamp: new Date(),
              });
            }
          });
        }
      } catch (error) {
        console.log('Error fetching IoT alerts:', error);
      }
      
      // Market price alerts
      try {
        const marketResponse = await apiService.getMarketPrices();
        if (marketResponse && Array.isArray(marketResponse)) {
          const highPriceCrops = marketResponse.filter((item: any) => 
            item.priceChange > 10 || item.trending === 'up'
          );
          
          if (highPriceCrops.length > 0) {
            dynamicAlerts.push({
              id: 'market_prices',
              type: 'info',
              icon: '📈',
              title: 'Market Opportunity',
              description: `${highPriceCrops[0].name} prices up ${highPriceCrops[0].priceChange}%. Good time to sell.`,
              color: COLORS.primary,
              priority: 4,
              timestamp: new Date(),
            });
          }
        }
      } catch (error) {
        console.log('Error fetching market alerts:', error);
      }
      
      // If no alerts, add a positive message
      if (dynamicAlerts.length === 0) {
        dynamicAlerts.push({
          id: 'all_good',
          type: 'success',
          icon: '✅',
          title: 'All Systems Normal',
          description: 'Your farms are running smoothly. Keep up the great work!',
          color: COLORS.success,
          priority: 5,
          timestamp: new Date(),
        });
      }
      
      // Sort alerts by priority
      dynamicAlerts.sort((a, b) => (a.priority || 5) - (b.priority || 5));
      setAlerts(dynamicAlerts.slice(0, 5)); // Show top 5 alerts
      
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([{
        id: 'error',
        type: 'info',
        icon: '📢',
        title: 'Welcome to KrishiVeda',
        description: 'Start by adding your farm details to get personalized alerts.',
        color: COLORS.primary,
      }]);
    } finally {
      setAlertsLoading(false);
    }
  }, [user?.id, weatherData]);

  // Fetch activities from backend
  const fetchActivities = useCallback(async () => {
    if (!user?.id) return;
    
    setActivitiesLoading(true);
    try {
      const upcomingActivities: Activity[] = [];
      const today = new Date();
      
      // Fetch crop schedules
      try {
        const crops = await apiService.getCrops();
        if (crops && Array.isArray(crops)) {
          crops.forEach((crop: any) => {
            // Irrigation schedule
            if (crop.irrigationSchedule) {
              const nextIrrigation = new Date(crop.nextIrrigation || today);
              if (nextIrrigation > today) {
                upcomingActivities.push({
                  id: `irrigation_${crop._id}`,
                  date: nextIrrigation,
                  title: `Irrigate ${crop.name}`,
                  description: `Water ${crop.name} in ${crop.farmName || 'your farm'}`,
                  icon: '💧',
                  type: 'irrigation',
                  cropId: crop._id,
                  farmId: crop.farmId,
                });
              }
            }
            
            // Fertilization schedule
            if (crop.fertilizationSchedule) {
              const nextFertilization = new Date(crop.nextFertilization || today);
              if (nextFertilization > today) {
                upcomingActivities.push({
                  id: `fertilization_${crop._id}`,
                  date: nextFertilization,
                  title: `Fertilize ${crop.name}`,
                  description: `Apply ${crop.fertilizerType || 'organic fertilizer'} to ${crop.name}`,
                  icon: '🌿',
                  type: 'fertilization',
                  cropId: crop._id,
                  farmId: crop.farmId,
                });
              }
            }
            
            // Harvest prediction
            if (crop.expectedHarvestDate) {
              const harvestDate = new Date(crop.expectedHarvestDate);
              if (harvestDate > today) {
                upcomingActivities.push({
                  id: `harvest_${crop._id}`,
                  date: harvestDate,
                  title: `Harvest ${crop.name}`,
                  description: `Expected harvest date for ${crop.name}`,
                  icon: '🌾',
                  type: 'harvest',
                  cropId: crop._id,
                  farmId: crop.farmId,
                });
              }
            }
          });
        }
      } catch (error) {
        console.log('Error fetching crop activities:', error);
      }
      
      // Fetch farm maintenance activities
      if (recentFarms && recentFarms.length > 0) {
        recentFarms.forEach((farm: any) => {
          // Equipment maintenance
          if (farm.equipmentMaintenanceDate) {
            const maintenanceDate = new Date(farm.equipmentMaintenanceDate);
            if (maintenanceDate > today) {
              upcomingActivities.push({
                id: `maintenance_${farm._id}`,
                date: maintenanceDate,
                title: 'Equipment Maintenance',
                description: `Scheduled maintenance for ${farm.name}`,
                icon: '🔧',
                type: 'maintenance',
                farmId: farm._id,
              });
            }
          }
          
          // Soil testing reminder
          const lastSoilTest = farm.lastSoilTest ? new Date(farm.lastSoilTest) : new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
          const nextSoilTest = new Date(lastSoilTest.getTime() + 180 * 24 * 60 * 60 * 1000); // Every 6 months
          if (nextSoilTest > today && nextSoilTest < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
            upcomingActivities.push({
              id: `soil_test_${farm._id}`,
              date: nextSoilTest,
              title: 'Soil Testing Due',
              description: `Conduct soil analysis for ${farm.name}`,
              icon: '🧪',
              type: 'soil_test',
              farmId: farm._id,
            });
          }
        });
      }
      
      // Add community events
      try {
        const events = await apiService.getCommunityEvents?.() || [];
        events.forEach((event: any) => {
          const eventDate = new Date(event.date);
          if (eventDate > today) {
            upcomingActivities.push({
              id: `event_${event._id}`,
              date: eventDate,
              title: event.title,
              description: event.description || 'Community farming event',
              icon: '👥',
              type: 'event',
            });
          }
        });
      } catch (error) {
        console.log('Error fetching community events:', error);
      }
      
      // If no activities, add default suggestions
      if (upcomingActivities.length === 0) {
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        upcomingActivities.push(
          {
            id: 'add_crop',
            date: tomorrow,
            title: 'Add Your Crops',
            description: 'Start tracking your crops for personalized schedules',
            icon: '🌱',
            type: 'suggestion',
          },
          {
            id: 'explore_community',
            date: nextWeek,
            title: 'Join Community',
            description: 'Connect with local farmers and share experiences',
            icon: '👋',
            type: 'suggestion',
          }
        );
      }
      
      // Sort activities by date
      upcomingActivities.sort((a, b) => a.date.getTime() - b.date.getTime());
      setActivities(upcomingActivities.slice(0, 5)); // Show next 5 activities
      
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }, [user?.id, recentFarms]);

  // Load dashboard data on component mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(fetchDashboardData(user.id));
    }
  }, [isAuthenticated, user?.id, dispatch]);

  // Fetch dynamic data when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        fetchAlerts();
        fetchActivities();
      }
    }, [isAuthenticated, user?.id, fetchAlerts, fetchActivities])
  );

  // Refresh data when weather data changes
  useEffect(() => {
    if (weatherData && weatherData.length > 0) {
      fetchAlerts();
    }
  }, [weatherData, fetchAlerts]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    if (user?.id) {
      dispatch(refreshDashboardData(user.id));
      fetchAlerts();
      fetchActivities();
    }
  }, [user?.id, dispatch, fetchAlerts, fetchActivities]);

  // Dynamic weather data with fallbacks
  const weatherInfo = useMemo(() => {
    const currentWeather = weatherData[0];
    return {
      temperature: currentWeather?.temperature || '28',
      condition: currentWeather?.condition || 'Partly Cloudy',
      humidity: currentWeather?.humidity || 65,
      windSpeed: currentWeather?.windSpeed || 5,
      precipitationChance: currentWeather?.precipitationChance || 0,
    };
  }, [weatherData]);

  // Dynamic location display
  const locationText = useMemo(() => {
    if (user?.location && typeof user.location === 'object') {
      return `${user.location.district}, ${user.location.province}, ${user.location.country}`;
    }
    return user?.location || 'Your Location';
  }, [user?.location]);

  // Handle activity press
  const handleActivityPress = (activity: Activity) => {
    if (activity.type === 'suggestion') {
      if (activity.id === 'add_crop') {
        navigation.navigate('Crops');
      } else if (activity.id === 'explore_community') {
        navigation.navigate('Community');
      }
    } else if (activity.cropId) {
      // Navigate to Crops tab first, then to CropDetail
      // This ensures the back button will go to CropsMain
      navigation.navigate('Crops', {
        screen: 'CropDetail',
        params: { cropId: activity.cropId },
        initial: false, // This ensures CropsMain is in the stack
      });
    } else if (activity.farmId) {
      // Navigate to Crops tab for farm management
      navigation.navigate('Crops');
    } else {
      Alert.alert(activity.title, activity.description);
    }
  };

  // Handle alert press
  const handleAlertPress = (alert: Alert) => {
    if (alert.id.startsWith('crop_')) {
      const cropId = alert.id.replace('crop_harvest_', '').replace('pest_alert_', '');
      // Navigate to Crops tab and then to CropDetail
      navigation.navigate('Crops', {
        screen: 'CropDetail',
        params: { cropId },
        initial: false, // This ensures CropsMain is in the stack
      });
    } else if (alert.id.startsWith('iot_')) {
      navigation.navigate('IoT');
    } else if (alert.id === 'market_prices') {
      // Market screen doesn't exist yet, show alert
      Alert.alert('Market Prices', 'Market feature coming soon!');
    } else {
      Alert.alert(alert.title, alert.description);
    }
  };

  // Handle logout
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => dispatch(logoutUser())
        },
      ]
    );
  }, [dispatch]);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to access the app</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.appName}>KrishiVeda</Text>
            <Text style={styles.tagline}>Welcome, {user?.name || 'Farmer'}!</Text>
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Statistics Summary */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Farm Overview</Text>
          {userStats ? (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{userStats.farmCount}</Text>
                <Text style={styles.statLabel}>Farms</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{userStats.totalArea.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Total Area (ha)</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{userStats.cropTypes.length}</Text>
                <Text style={styles.statLabel}>Crop Types</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.loadingText}>
              {isLoading ? 'Loading statistics...' : 'No data available'}
            </Text>
          )}
        </View>

        {/* Recent Farms */}
        {recentFarms.length > 0 && (
          <View style={styles.farmsContainer}>
            <Text style={styles.sectionTitle}>Recent Farms</Text>
            {recentFarms.slice(0, 2).map((farm, index) => (
              <TouchableOpacity 
                key={farm.id || index} 
                style={styles.farmCard}
                onPress={() => navigation.navigate('Crops', {
                  screen: 'FarmDetail',
                  params: { 
                    farmId: farm._id || farm.id,
                    farmData: {
                      id: farm._id || farm.id,
                      name: farm.name,
                      location: farm.location,
                      size: farm.area || farm.size,
                      crops: farm.crops || [],
                      createdAt: farm.createdAt
                    }
                  }
                })}
              >
                <View style={styles.farmIcon}>
                  <Text style={styles.farmIconText}>🌾</Text>
                </View>
                <View style={styles.farmInfo}>
                  <Text style={styles.farmName}>{farm.name}</Text>
                  <Text style={styles.farmLocation}>
                    {farm.location && typeof farm.location === 'object'
                      ? `${farm.location.district}, ${farm.location.province}, ${farm.location.country}`
                      : farm.location}
                  </Text>
                  <Text style={styles.farmArea}>{farm.area} hectares</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Weather Summary Section */}
        <View style={styles.weatherSummary}>
          <View style={styles.weatherInfo}>
            <Text style={styles.temperatureText}>{weatherInfo.temperature}°C</Text>
            <Text style={styles.locationText}>{locationText}</Text>
            <Text style={styles.weatherCondition}>{weatherInfo.condition}</Text>
          </View>
          <View style={styles.weatherDetails}>
            <Text style={styles.weatherDetail}>Humidity: {weatherInfo.humidity}%</Text>
            <Text style={styles.weatherDetail}>Wind: {weatherInfo.windSpeed} km/h</Text>
            <Text style={styles.weatherDetail}>Rain: {weatherInfo.precipitationChance}%</Text>
          </View>
        </View>
        
        {/* Features Grid */}
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresGrid}>
          <FeatureCard 
            title="Weather" 
            icon="☁️" 
            description="Get detailed weather forecasts" 
            onPress={() => navigation.navigate('Weather')}
          />
          <FeatureCard 
            title="Crops" 
            icon="🌾" 
            description="Manage your crop calendar" 
            onPress={() => navigation.navigate('Crops')}
          />
          <FeatureCard 
            title="Community" 
            icon="👥" 
            description="Connect with other farmers" 
            onPress={() => navigation.navigate('Community')}
          />
          <FeatureCard 
            title="IoT Dashboard" 
            icon="🤖" 
            description="Monitor smart farm sensors" 
            onPress={() => navigation.navigate('IoT')}
          />
        </View>
        
        {/* Dynamic Alerts Section */}
        <Text style={styles.sectionTitle}>Alerts & Notifications</Text>
        <View style={styles.alertContainer}>
          {alertsLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : alerts.length > 0 ? (
            alerts.map((alert) => (
              <TouchableOpacity 
                key={alert.id} 
                style={[styles.alertItem, { backgroundColor: alert.color + '20' }]}
                onPress={() => handleAlertPress(alert)}
              >
                <Text style={[styles.alertIcon, { color: alert.color }]}>{alert.icon}</Text>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDescription}>{alert.description}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No alerts at this time</Text>
          )}
        </View>
        
        {/* Dynamic Upcoming Activities Section */}
        <Text style={styles.sectionTitle}>Upcoming Activities</Text>
        <View style={styles.calendarContainer}>
          {activitiesLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : activities.length > 0 ? (
            activities.map((activity) => {
              const activityDate = activity.date;
              const day = activityDate.getDate().toString();
              const month = activityDate.toLocaleDateString('en-US', { month: 'short' });
              const isToday = activityDate.toDateString() === new Date().toDateString();
              const isTomorrow = activityDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              
              return (
                <TouchableOpacity 
                  key={activity.id} 
                  style={[
                    styles.calendarItem,
                    activity.isCompleted && { opacity: 0.6 }
                  ]}
                  onPress={() => handleActivityPress(activity)}
                >
                  <View style={[
                    styles.calendarDate,
                    isToday && { backgroundColor: COLORS.primary + '20' },
                    isTomorrow && { backgroundColor: COLORS.warning + '20' }
                  ]}>
                    <Text style={[
                      styles.calendarDay,
                      (isToday || isTomorrow) && { fontWeight: 'bold' }
                    ]}>{day}</Text>
                    <Text style={styles.calendarMonth}>{month}</Text>
                  </View>
                  <View style={styles.calendarContent}>
                    <Text style={[
                      styles.calendarTitle,
                      activity.isCompleted && { textDecorationLine: 'line-through' }
                    ]}>{activity.title}</Text>
                    <Text style={styles.calendarDescription}>{activity.description}</Text>
                    {(isToday || isTomorrow) && (
                      <Text style={[
                        styles.calendarBadge,
                        { color: isToday ? COLORS.primary : COLORS.warning }
                      ]}>
                        {isToday ? 'Today' : 'Tomorrow'}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.calendarIcon}>{activity.icon}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No scheduled activities</Text>
          )}
        </View>
        
        {/* Add some bottom padding */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

export default HomeScreenDynamic;
