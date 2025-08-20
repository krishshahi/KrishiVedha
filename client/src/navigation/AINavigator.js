import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

// Import all screens
import AIDashboardScreen from '../screens/AIDashboardScreen';
import YieldPredictionScreen from '../screens/YieldPredictionScreen';
import DiseaseDetectionScreen from '../screens/DiseaseDetectionScreen';
import ResourceOptimizationScreen from '../screens/ResourceOptimizationScreen';
import MarketInsightsScreen from '../screens/MarketInsightsScreen';

// Import existing screens (assuming they exist)
import HomeScreen from '../screens/HomeScreen';
// import FarmsScreen from '../screens/FarmsScreen'; // File doesn't exist
// import CropsScreen from '../screens/CropsScreen'; // File doesn't exist
import WeatherScreen from '../screens/WeatherScreen';
// import SettingsScreen from '../screens/SettingsScreen'; // File doesn't exist

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// AI Stack Navigator
const AIStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: ({ current }) => ({
        cardStyle: {
          opacity: current.progress,
        },
      }),
    }}
  >
    <Stack.Screen name="AIDashboard" component={AIDashboardScreen} />
    <Stack.Screen name="YieldPrediction" component={YieldPredictionScreen} />
    <Stack.Screen name="DiseaseDetection" component={DiseaseDetectionScreen} />
    <Stack.Screen name="ResourceOptimization" component={ResourceOptimizationScreen} />
    <Stack.Screen name="MarketInsights" component={MarketInsightsScreen} />
  </Stack.Navigator>
);

// Main Stack Navigator
const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="AIStack" component={AIStack} />
  </Stack.Navigator>
);

// Enhanced Tab Navigator with AI integration
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        let gradientColors = ['#4CAF50', '#45a049'];

        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Farms':
            iconName = 'agriculture';
            gradientColors = ['#2196F3', '#1976D2'];
            break;
          case 'AI':
            iconName = 'psychology';
            gradientColors = ['#9C27B0', '#7B1FA2'];
            break;
          case 'Crops':
            iconName = 'eco';
            gradientColors = ['#FF9800', '#F57C00'];
            break;
          case 'Weather':
            iconName = 'wb-sunny';
            gradientColors = ['#FFC107', '#FFA000'];
            break;
          case 'Settings':
            iconName = 'settings';
            gradientColors = ['#607D8B', '#455A64'];
            break;
          default:
            iconName = 'help';
        }

        if (focused && route.name === 'AI') {
          return (
            <LinearGradient
              colors={gradientColors}
              style={{
                borderRadius: 20,
                padding: 8,
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}
            >
              <Icon name={iconName} size={size} color="#fff" />
            </LinearGradient>
          );
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4CAF50',
      tabBarInactiveTintColor: '#8E8E93',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        height: 70,
        paddingBottom: 10,
        paddingTop: 10,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{
        tabBarLabel: 'Home',
      }}
    />
    <Tab.Screen 
      name="AI" 
      component={AIStack}
      options={{
        tabBarLabel: 'AI Analytics',
        tabBarActiveTintColor: '#9C27B0',
      }}
    />
    <Tab.Screen 
      name="Weather" 
      component={WeatherScreen}
      options={{
        tabBarLabel: 'Weather',
      }}
    />
    {/* Commented out non-existent screens */}
    {/* <Tab.Screen name="Farms" component={FarmsScreen} /> */}
    {/* <Tab.Screen name="Crops" component={CropsScreen} /> */}
    {/* <Tab.Screen name="Settings" component={SettingsScreen} /> */}
  </Tab.Navigator>
);

export default MainStack;
