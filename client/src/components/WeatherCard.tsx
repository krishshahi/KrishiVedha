import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { WeatherData } from '../types/weather.types';
import { styles } from '../styles/WeatherCard.styles';

interface WeatherCardProps {
  weather: WeatherData;
  onPress?: () => void;
  showDetails?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, onPress, showDetails = false }) => {
  const getWeatherIcon = (condition: string): keyof typeof Ionicons.glyphMap => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return 'sunny';
      case 'clouds':
        return 'cloudy';
      case 'rain':
        return 'rainy';
      case 'snow':
        return 'snow';
      case 'thunderstorm':
        return 'thunderstorm';
      default:
        return 'partly-sunny';
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>{weather.location.name}</Text>
          <Text style={styles.descriptionText}>{String(weather.current.condition)}</Text>
        </View>
        <Ionicons 
          name={getWeatherIcon(String(weather.current.condition))} 
          size={40} 
          color={COLORS.primary} 
        />
      </View>
      
      <View style={styles.temperatureContainer}>
        <Text style={styles.temperatureText}>{weather.current.temp_c}°C</Text>
        <Text style={styles.feelsLikeText}>
          महसुस {weather.current.feelslike_c}°C
        </Text>
      </View>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="water" size={16} color={COLORS.text.primaryLight} />
              <Text style={styles.detailText}>{weather.current.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="leaf" size={16} color={COLORS.text.primaryLight} />
              <Text style={styles.detailText}>{weather.current.wind_kph} km/h</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="eye" size={16} color={COLORS.text.primaryLight} />
              <Text style={styles.detailText}>{weather.current.vis_km} km</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer" size={16} color={COLORS.text.primaryLight} />
              <Text style={styles.detailText}>{weather.current.pressure_mb} hPa</Text>
            </View>
          </View>
        </View>
      )}
      
      <Text style={styles.updateTime}>
        अपडेट: {new Date(weather.current.last_updated).toLocaleTimeString('ne-NP')}
      </Text>
    </CardComponent>
  );
};

export default WeatherCard;

