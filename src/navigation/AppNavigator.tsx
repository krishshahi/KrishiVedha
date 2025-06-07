import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

// Import detailed screens
import HomeScreen from '../screens/HomeScreen';
import WeatherScreen from '../screens/WeatherScreen';
import CropManagementScreen from '../screens/CropManagementScreen';
import KnowledgeBaseScreen from '../screens/KnowledgeBaseScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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
    <Stack.Screen name="KnowledgeBase" component={KnowledgeBaseScreen} options={{ title: 'ज्ञान आधार' }} />
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
  </Stack.Navigator>
);

function AppNavigator(): React.JSX.Element {
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
          title: 'होम', // Home in Nepali
        }}
      />
      <Tab.Screen
        name="Weather"
        component={WeatherStack}
        options={{
          title: 'मौसम', // Weather in Nepali
        }}
      />
      <Tab.Screen
        name="Crops"
        component={CropsStack}
        options={{
          title: 'बाली', // Crops in Nepali
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStack}
        options={{
          title: 'समुदाय', // Community in Nepali
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: 'प्रोफाइल', // Profile in Nepali
        }}
      />
    </Tab.Navigator>
  );
}

export default AppNavigator;
