import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { styles } from '../styles/HomeScreen.styles';
import { fetchDashboardData, refreshDashboardData } from '../store/slices/dashboardSlice';
import { logoutUser, syncUserData } from '../store/slices/authSlice';

interface FeatureCardProps {
  title: string;
  icon: string;
  description: string;
  onPress: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, icon, description, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.featureCard}
      onPress={onPress}
    >
      <View style={styles.featureIconContainer}>
        {/* Replace with actual icon component when available */}
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
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

  // Load dashboard data on component mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(fetchDashboardData(user.id));
    }
  }, [isAuthenticated, user?.id, dispatch]);


  // Handle refresh
  const onRefresh = useCallback(() => {
    if (user?.id) {
      dispatch(refreshDashboardData(user.id));
    }
  }, [user?.id, dispatch]);

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

  // Dynamic alerts (would come from an alerts slice in a real app)
  const alerts = useMemo(() => {
    // This would typically come from a backend API or alerts slice
    const dynamicAlerts = [];
    
    // Add weather-based alert if high precipitation expected
    if (weatherInfo.precipitationChance > 70) {
      dynamicAlerts.push({
        id: 'weather_rain',
        type: 'warning',
        icon: '🌧️',
        title: 'Heavy Rain Alert',
        description: `${weatherInfo.precipitationChance}% chance of rain expected. Protect your crops.`,
        color: COLORS.warning,
      });
    }

    // Add temperature alert for extreme heat
    if (parseInt(weatherInfo.temperature) > 35) {
      dynamicAlerts.push({
        id: 'weather_heat',
        type: 'danger',
        icon: '🔥',
        title: 'High Temperature Alert',
        description: `Temperature expected to reach ${weatherInfo.temperature}°C. Ensure adequate irrigation.`,
        color: COLORS.danger,
      });
    }

    // Default alert if no weather alerts
    if (dynamicAlerts.length === 0) {
      dynamicAlerts.push({
        id: 'default_info',
        type: 'info',
        icon: '🌱',
        title: 'Growing Season',
        description: 'Perfect conditions for crop growth. Keep monitoring your fields.',
        color: COLORS.success,
      });
    }

    return dynamicAlerts;
  }, [weatherInfo]);

  // Dynamic upcoming activities (would come from crop calendar/schedule)
  const upcomingActivities = useMemo(() => {
    const activities = [];
    const today = new Date();
    
    // This would typically come from a crop calendar API or database
    // For now, we'll generate some activities based on current date and user farms
    if (recentFarms.length > 0) {
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      activities.push({
        id: 'irrigation_check',
        date: nextWeek,
        title: 'Irrigation Check',
        description: `Check irrigation systems in ${recentFarms[0]?.name || 'your farm'}`,
        icon: '💧',
      });

      const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      activities.push({
        id: 'fertilizer_application',
        date: nextMonth,
        title: 'Fertilizer Application',
        description: 'Apply organic fertilizer to boost crop growth',
        icon: '🌿',
      });
    } else {
      // Default activity if no farms
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      activities.push({
        id: 'setup_farm',
        date: nextWeek,
        title: 'Set up your first farm',
        description: 'Add your farm details to get personalized recommendations',
        icon: '🏡',
      });
    }

    return activities;
  }, [recentFarms]);

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
              <View key={farm.id || index} style={styles.farmCard}>
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
              </View>
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
        <Text style={styles.sectionTitle}>Alerts</Text>
        <View style={styles.alertContainer}>
          {alerts.map((alert) => (
            <View key={alert.id} style={[styles.alertItem, { backgroundColor: alert.color + '20' }]}>
              <Text style={[styles.alertIcon, { color: alert.color }]}>{alert.icon}</Text>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDescription}>{alert.description}</Text>
              </View>
            </View>
          ))}
        </View>
        
        {/* Dynamic Upcoming Activities Section */}
        <Text style={styles.sectionTitle}>Upcoming Activities</Text>
        <View style={styles.calendarContainer}>
          {upcomingActivities.map((activity) => {
            const activityDate = activity.date;
            const day = activityDate.getDate().toString();
            const month = activityDate.toLocaleDateString('en-US', { month: 'short' });
            
            return (
              <View key={activity.id} style={styles.calendarItem}>
                <View style={styles.calendarDate}>
                  <Text style={styles.calendarDay}>{day}</Text>
                  <Text style={styles.calendarMonth}>{month}</Text>
                </View>
                <View style={styles.calendarContent}>
                  <Text style={styles.calendarTitle}>{activity.title}</Text>
                  <Text style={styles.calendarDescription}>{activity.description}</Text>
                </View>
                <Text style={styles.calendarIcon}>{activity.icon}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};


export default HomeScreen;

