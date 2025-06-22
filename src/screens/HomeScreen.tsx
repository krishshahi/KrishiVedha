import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';
import { styles } from '../styles/HomeScreen.styles';
import { fetchDashboardData, refreshDashboardData } from '../store/slices/dashboardSlice';
import { logoutUser } from '../store/slices/authSlice';

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
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
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
                  <Text style={styles.farmLocation}>{farm.location}</Text>
                  <Text style={styles.farmArea}>{farm.area} hectares</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Weather Summary Section */}
        <View style={styles.weatherSummary}>
          <View style={styles.weatherInfo}>
            <Text style={styles.temperatureText}>28°C</Text>
            <Text style={styles.locationText}>{user?.location || 'Your Location'}</Text>
            <Text style={styles.weatherCondition}>Partly Cloudy</Text>
          </View>
          <View style={styles.weatherDetails}>
            <Text style={styles.weatherDetail}>Humidity: 65%</Text>
            <Text style={styles.weatherDetail}>Wind: 5 km/h</Text>
            <Text style={styles.weatherDetail}>Rain: 0%</Text>
          </View>
        </View>
        
        {/* Features Grid */}
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresGrid}>
          <FeatureCard 
            title="Weather" 
            icon="☁️" 
            description="Get detailed weather forecasts" 
            onPress={() => {}}
          />
          <FeatureCard 
            title="Crops" 
            icon="🌾" 
            description="Manage your crop calendar" 
            onPress={() => {}}
          />
          <FeatureCard 
            title="Knowledge" 
            icon="📚" 
            description="Learn farming techniques" 
            onPress={() => {}}
          />
          <FeatureCard 
            title="Community" 
            icon="👥" 
            description="Connect with other farmers" 
            onPress={() => {}}
          />
        </View>
        
        {/* Alerts Section */}
        <Text style={styles.sectionTitle}>Alerts</Text>
        <View style={styles.alertContainer}>
          <View style={[styles.alertItem, { backgroundColor: COLORS.warning + '20' }]}>
            <Text style={[styles.alertIcon, { color: COLORS.warning }]}>⚠️</Text>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Rainfall Alert</Text>
              <Text style={styles.alertDescription}>Heavy rainfall expected in your area tomorrow.</Text>
            </View>
          </View>
        </View>
        
        {/* Crop Calendar Section */}
        <Text style={styles.sectionTitle}>Upcoming Activities</Text>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarItem}>
            <View style={styles.calendarDate}>
              <Text style={styles.calendarDay}>15</Text>
              <Text style={styles.calendarMonth}>Jun</Text>
            </View>
            <View style={styles.calendarContent}>
              <Text style={styles.calendarTitle}>Rice Planting</Text>
              <Text style={styles.calendarDescription}>Start planting rice in Field 1</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};


export default HomeScreen;

