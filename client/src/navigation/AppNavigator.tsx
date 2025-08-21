import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { loadStoredAuth } from '../store/slices/authSlice';
import { useDynamicTheme } from '../config/dynamicTheme';
import { useDynamicI18n } from '../config/dynamicI18n';
import AuthNavigator from './AuthNavigator';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

// Import detailed screens
import HomeScreen from '../screens/HomeScreen';
import WeatherScreen from '../screens/WeatherScreen';
import CropManagementScreen from '../screens/CropManagementScreen';
import CommunityScreen from '../screens/CommunityScreen';
import CommunityScreenFixed from '../screens/CommunityScreenFixed';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ViewProfileScreen from '../screens/ViewProfileScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddCropScreen from '../screens/AddCropScreen';
import CropDetailScreen from '../screens/CropDetailScreen';
import AddFarmScreen from '../screens/AddFarmScreen';
import FarmDetailScreen from '../screens/FarmDetailScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import IoTDashboardScreen from '../screens/IoTDashboardScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dynamic Loading component
const LoadingScreen = () => {
  const theme = useDynamicTheme();
  const { t } = useDynamicI18n();
  
  const loadingStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    text: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.text.primary,
    },
  });
  
  return (
    <View style={loadingStyles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={loadingStyles.text}>{t('common.loading')}</Text>
    </View>
  );
};

// Stack navigators for each main screen
const HomeStack = () => {
  const theme = useDynamicTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.text.primaryWhite,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

const WeatherStack = () => {
  const theme = useDynamicTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.text.primaryWhite,
      }}
    >
      <Stack.Screen name="WeatherMain" component={WeatherScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

const CropsStack = () => {
  const theme = useDynamicTheme();
  const { t } = useDynamicI18n();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.text.primaryWhite,
        headerBackTitle: 'Back',
        headerBackTitleVisible: true,
      }}
    >
      <Stack.Screen name="CropsMain" component={CropManagementScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddFarm" component={AddFarmScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddCrop" component={AddCropScreen} options={{ title: t('crop.addCrop') }} />
      <Stack.Screen 
        name="CropDetail" 
        component={CropDetailScreen} 
        options={({ route }) => ({ 
          title: 'Crop Details',
          headerShown: true,
        })} 
      />
      <Stack.Screen 
        name="FarmDetail" 
        component={FarmDetailScreen} 
        options={({ route }) => ({ 
          headerShown: false,  // Hide the default header since we have a custom one
        })} 
      />
    </Stack.Navigator>
  );
};


const CommunityStack = () => {
  const theme = useDynamicTheme();
  const { t } = useDynamicI18n();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.text.primaryWhite,
      }}
    >
      <Stack.Screen name="CommunityMain" component={CommunityScreenFixed} options={{ headerShown: false }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: t('community.posts') }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  const theme = useDynamicTheme();
  const { t } = useDynamicI18n();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.text.primaryWhite,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ViewProfile" component={ViewProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings.title') }} />
    </Stack.Navigator>
  );
};

const IoTStack = () => {
  const theme = useDynamicTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.text.primaryWhite,
      }}
    >
      <Stack.Screen name="IoTMain" component={IoTDashboardScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator with Dynamic Theme
const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const theme = useDynamicTheme();
  const { t } = useDynamicI18n();
  
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
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
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
          title: t('navigation.home'),
        }}
      />
      <Tab.Screen
        name="Weather"
        component={WeatherStack}
        options={{
          title: t('navigation.weather'),
        }}
      />
      <Tab.Screen
        name="Crops"
        component={CropsStack}
        options={{
          title: t('navigation.crops'),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStack}
        options={{
          title: t('navigation.community'),
        }}
      />
      <Tab.Screen
        name="IoT"
        component={IoTStack}
        options={{
          title: t('navigation.iot'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: t('navigation.profile'),
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
