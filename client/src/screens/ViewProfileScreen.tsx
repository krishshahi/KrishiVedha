import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useAppSelector } from '../store/hooks';
import DropDownPicker from 'react-native-dropdown-picker';
import { COLORS } from '../constants/colors';
import { profileScreenStyles as styles } from '../styles/ProfileScreen.styles';
import { StackNavigationProp } from '@react-navigation/stack';
import locationData from '../data/locations.json';

type ViewProfileScreenNavigationProp = StackNavigationProp<any, 'ViewProfile'>;

interface ViewProfileScreenProps {
  navigation: ViewProfileScreenNavigationProp;
}

const ViewProfileScreen: React.FC<ViewProfileScreenProps> = ({ navigation }) => {
  const { user } = useAppSelector((state) => state.auth);

  const countries = locationData.countries.map(c => ({ label: c.name, value: c.name }));
  const provinces = locationData.countries
    .find(c => c.name === user?.location?.country)?.states
    .map(s => ({ label: s.name, value: s.name })) || [];
  const districts = locationData.countries
    .find(c => c.name === user?.location?.country)?.states
    .find(s => s.name === user?.location?.province)?.districts
    .map(d => ({ label: d.name, value: d.name })) || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.editForm}>
          {/* Personal Information Section */}
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.name || 'Not provided'}
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.email || 'Not provided'}
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.phone || 'Not provided'}
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Type</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.role || 'Not provided'}
              editable={false}
            />
          </View>
          
          {/* Location Section */}
          <Text style={styles.sectionTitle}>Location Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.location?.country || 'Not provided'}
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Province/State</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.location?.province || 'Not provided'}
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>District</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.location?.district || 'Not provided'}
              editable={false}
            />
          </View>
          
          {/* Preferences Section */}
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Language</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.preferences?.language === 'en' ? 'English' : 
                     user?.preferences?.language === 'ne' ? 'नेपाली (Nepali)' :
                     user?.preferences?.language === 'hi' ? 'हिंदी (Hindi)' : 'English'}
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Measurement Units</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.preferences?.measurementUnit === 'metric' ? 'Metric (kg, km, °C)' : 'Imperial (lbs, miles, °F)'}
              editable={false}
            />
          </View>
          
          {/* Account Status Section */}
          <Text style={styles.sectionTitle}>Account Status</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Verification Status</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.isVerified ? '✓ Verified' : '⚠ Not Verified'}
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Member Since</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Login</Text>
            <TextInput
              style={styles.inputDisabled}
              value={user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Not available'}
              editable={false}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewProfileScreen;