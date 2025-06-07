import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';
import { styles } from '../styles/HomeScreen.styles';

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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>KrishiVeda</Text>
        <Text style={styles.tagline}>Smart farming for Nepal</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Weather Summary Section */}
        <View style={styles.weatherSummary}>
          <View style={styles.weatherInfo}>
            <Text style={styles.temperatureText}>28°C</Text>
            <Text style={styles.locationText}>Kathmandu</Text>
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

