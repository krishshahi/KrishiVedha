import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weather Forecast</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Current Weather */}
        <View style={styles.currentWeather}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>Kathmandu</Text>
            <TouchableOpacity style={styles.locationButton}>
              <Text style={styles.locationButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.weatherMainInfo}>
            <Text style={styles.weatherIcon}>☀️</Text>
            <Text style={styles.temperatureText}>28°C</Text>
            <Text style={styles.weatherCondition}>Partly Cloudy</Text>
          </View>
          
          <View style={styles.weatherDetailsRow}>
            <View style={styles.weatherDetailItem}>
              <Text style={styles.weatherDetailIcon}>💧</Text>
              <Text style={styles.weatherDetailTitle}>Humidity</Text>
              <Text style={styles.weatherDetailValue}>65%</Text>
            </View>
            <View style={styles.weatherDetailItem}>
              <Text style={styles.weatherDetailIcon}>💨</Text>
              <Text style={styles.weatherDetailTitle}>Wind</Text>
              <Text style={styles.weatherDetailValue}>5 km/h</Text>
            </View>
            <View style={styles.weatherDetailItem}>
              <Text style={styles.weatherDetailIcon}>☔</Text>
              <Text style={styles.weatherDetailTitle}>Rain</Text>
              <Text style={styles.weatherDetailValue}>0%</Text>
            </View>
          </View>
        </View>
        
        {/* Weather Alerts */}
        <View style={styles.alertContainer}>
          <View style={[styles.alertItem, { backgroundColor: COLORS.warning + '20' }]}>
            <Text style={[styles.alertIcon, { color: COLORS.warning }]}>⚠️</Text>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Rainfall Alert</Text>
              <Text style={styles.alertDescription}>Heavy rainfall expected in your area tomorrow.</Text>
            </View>
            <TouchableOpacity style={styles.alertButton}>
              <Text style={styles.alertButtonText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
        
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
              <ForecastItem time="Now" icon="☀️" temp={28} precipitation={0} />
              <ForecastItem time="12 PM" icon="🌤️" temp={29} precipitation={0} />
              <ForecastItem time="1 PM" icon="🌤️" temp={30} precipitation={10} />
              <ForecastItem time="2 PM" icon="⛅" temp={30} precipitation={20} />
              <ForecastItem time="3 PM" icon="⛅" temp={29} precipitation={30} />
              <ForecastItem time="4 PM" icon="🌦️" temp={28} precipitation={40} />
              <ForecastItem time="5 PM" icon="🌧️" temp={27} precipitation={60} />
              <ForecastItem time="6 PM" icon="🌧️" temp={26} precipitation={70} />
              <ForecastItem time="7 PM" icon="🌧️" temp={25} precipitation={60} />
              <ForecastItem time="8 PM" icon="🌦️" temp={24} precipitation={40} />
            </ScrollView>
          </View>
        )}
        
        {/* Daily Forecast */}
        {activeTab === 'week' && (
          <View style={styles.dailyForecastContainer}>
            <Text style={styles.forecastTitle}>7-Day Forecast</Text>
            <DailyForecast day="Today" icon="☀️" highTemp={30} lowTemp={23} precipitation={0} />
            <DailyForecast day="Wed" icon="🌤️" highTemp={31} lowTemp={24} precipitation={10} />
            <DailyForecast day="Thu" icon="⛅" highTemp={29} lowTemp={23} precipitation={30} />
            <DailyForecast day="Fri" icon="🌧️" highTemp={27} lowTemp={22} precipitation={70} />
            <DailyForecast day="Sat" icon="🌧️" highTemp={26} lowTemp={21} precipitation={80} />
            <DailyForecast day="Sun" icon="🌦️" highTemp={28} lowTemp={22} precipitation={40} />
            <DailyForecast day="Mon" icon="🌤️" highTemp={29} lowTemp={23} precipitation={20} />
          </View>
        )}
        
        {/* Agricultural Weather Impact */}
        <View style={styles.impactContainer}>
          <Text style={styles.forecastTitle}>Impact on Farming</Text>
          <View style={styles.impactItem}>
            <Text style={styles.impactIcon}>🌾</Text>
            <View style={styles.impactContent}>
              <Text style={styles.impactTitle}>Rice Crops</Text>
              <Text style={styles.impactDescription}>Current weather conditions are favorable for rice cultivation. Consider irrigation if no rainfall in next 2 days.</Text>
            </View>
          </View>
          <View style={styles.impactItem}>
            <Text style={styles.impactIcon}>🥔</Text>
            <View style={styles.impactContent}>
              <Text style={styles.impactTitle}>Potato Crops</Text>
              <Text style={styles.impactDescription}>Expected rainfall may increase risk of potato blight. Consider preventive measures.</Text>
            </View>
          </View>
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  impactDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
});

export default WeatherScreen;

