import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { loadStoredAuth } from '../store/slices/authSlice';
import { COLORS } from '../constants/colors';
import AuthNavigator from './AuthNavigator';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

// Import detailed screens
import HomeScreen from '../screens/HomeScreen';
import WeatherScreen from '../screens/WeatherScreen';
import CropManagementScreen from '../screens/CropManagementScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ViewProfileScreen from '../screens/ViewProfileScreen';
import AddCropScreen from '../screens/AddCropScreen';
import CropDetailScreen from '../screens/CropDetailScreen';
import AddFarmScreen from '../screens/AddFarmScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import IoTDashboardScreen from '../screens/IoTDashboardScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Loading component
const LoadingScreen = () => (
  <View style={loadingStyles.container}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={loadingStyles.text}>Loading...</Text>
  </View>
);

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.primary, // Use a string color value
  },
});

// Stack navigators for each main screen
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.textWhite,
    }}
  >
    <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const WeatherStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.textWhite,
    }}
  >
    <Stack.Screen name="WeatherMain" component={WeatherScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const CropsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.textWhite,
    }}
  >
    <Stack.Screen name="CropsMain" component={CropManagementScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddFarm" component={AddFarmScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddCrop" component={AddCropScreen} options={{ title: 'Add New Crop' }} />
    <Stack.Screen name="CropDetail" component={CropDetailScreen} options={{ title: 'Crop Details' }} />
  </Stack.Navigator>
);


const CommunityStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.textWhite,
    }}
  >
    <Stack.Screen name="CommunityMain" component={CommunityScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post Details' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.textWhite,
    }}
  >
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ViewProfile" component={ViewProfileScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const IoTStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.textWhite,
    }}
  >
    <Stack.Screen name="IoTMain" component={IoTDashboardScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Weather') {
            iconName = focused ? 'cloud' : 'cloud-outline';
          } else if (route.name === 'Crops') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'IoT') {
            iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          paddingBottom: Math.max(insets.bottom, 5),
          height: 60 + Math.max(insets.bottom, 5),
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen
        name="Weather"
        component={WeatherStack}
        options={{
          title: 'Weather',
        }}
      />
      <Tab.Screen
        name="Crops"
        component={CropsStack}
        options={{
          title: 'Crops',
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStack}
        options={{
          title: 'Community',
        }}
      />
      <Tab.Screen
        name="IoT"
        component={IoTStack}
        options={{
          title: 'IoT Dashboard',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator that handles authentication
function AppNavigator(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  
  // Load stored authentication on app start
  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);
  
  // Show loading if we're checking stored auth
  if (isLoading) {
    return (
      <Stack.Navigator>
        <Stack.Screen 
          name="Loading" 
          component={LoadingScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }
  
  // Return appropriate navigator based on auth state
  return isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />;
}

export default AppNavigator;
