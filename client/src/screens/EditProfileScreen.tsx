import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, Platform, Animated, Dimensions } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import DropDownPicker from 'react-native-dropdown-picker';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';
import { profileScreenStyles as styles } from '../styles/ProfileScreen.styles';
import { User, UserPreferences } from '../types/user.types';
import { updateUserProfile, syncUserData } from '../store/slices/authSlice';
import { fetchDashboardData } from '../store/slices/dashboardSlice';
import { StackNavigationProp } from '@react-navigation/stack';
import locationData from '../data/locations.json';

type EditProfileScreenNavigationProp = StackNavigationProp<any, 'EditProfile'>;

interface EditProfileScreenProps {
  navigation: EditProfileScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.location?.country || 'Nepal');
  const [province, setProvince] = useState(user?.location?.province || '');
  const [district, setDistrict] = useState(user?.location?.district || '');
  const [language, setLanguage] = useState(user?.preferences?.language || 'en');
  const [measurementUnit, setMeasurementUnit] = useState(user?.preferences?.measurementUnit || 'metric');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.95);

  const [openCountry, setOpenCountry] = useState(false);
  const [openProvince, setOpenProvince] = useState(false);
  const [openDistrict, setOpenDistrict] = useState(false);
  const [openLanguage, setOpenLanguage] = useState(false);
  const [openMeasurement, setOpenMeasurement] = useState(false);

  const countries = locationData.countries.map(c => ({ label: c.name, value: c.name }));
  const provinces = locationData.countries
    .find(c => c.name === country)?.states
    .map(s => ({ label: s.name, value: s.name })) || [];
  const districts = locationData.countries
    .find(c => c.name === country)?.states
    .find(s => s.name === province)?.districts
    .map(d => ({ label: d.name, value: d.name })) || [];
    
  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'नेपाली (Nepali)', value: 'ne' },
    { label: 'हिंदी (Hindi)', value: 'hi' }
  ];
  
  const measurementOptions = [
    { label: 'Metric (kg, km, °C)', value: 'metric' },
    { label: 'Imperial (lbs, miles, °F)', value: 'imperial' }
  ];

  // Initialize form fields when user data changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCountry(user.location?.country || 'Nepal');
      setProvince(user.location?.province || '');
      setDistrict(user.location?.district || '');
      setLanguage(user.preferences?.language || 'en');
      setMeasurementUnit(user.preferences?.measurementUnit || 'metric');
    }
    
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user]);

  const handleCancelEdit = () => {
    // Reset all form fields to original values
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setCountry(user?.location?.country || 'Nepal');
    setProvince(user?.location?.province || '');
    setDistrict(user?.location?.district || '');
    setLanguage(user?.preferences?.language || 'en');
    setMeasurementUnit(user?.preferences?.measurementUnit || 'metric');
    setIsEditing(false);
    
    // Close all dropdowns
    setOpenCountry(false);
    setOpenProvince(false);
    setOpenDistrict(false);
    setOpenLanguage(false);
    setOpenMeasurement(false);
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    setIsLoading(true);
    const updatedUser: Partial<User> = {
      name,
      phone,
      location: {
        ...user.location,
        district,
        province,
        country,
      },
      preferences: {
        language: 'en' as const,
        measurementUnit: 'metric' as const,
        notificationsEnabled: true,
        weatherAlerts: true,
        cropReminders: true,
        communityUpdates: true,
        theme: 'system' as const,
        ...(user.preferences || {}),
        language: language as 'en' | 'ne' | 'hi',
        measurementUnit: measurementUnit as 'metric' | 'imperial',
      },
    };

    dispatch(updateUserProfile(updatedUser))
      .unwrap()
      .then(() => {
        dispatch(syncUserData());
        if (user?.id) {
          dispatch(fetchDashboardData(user.id));
        }
        Alert.alert('Success', 'Profile updated successfully.');
        setIsEditing(false);
        
        // Close all dropdowns
        setOpenCountry(false);
        setOpenProvince(false);
        setOpenDistrict(false);
      })
      .catch((error) => {
        console.error('Failed to update profile:', error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <KeyboardAvoidingView 
      style={modernStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Modern Header with Gradient */}
      <Animated.View 
        style={[
          modernStyles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={modernStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={modernStyles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={modernStyles.headerTitle}>
          {isEditing ? '✏️ Edit Profile' : '👤 Personal Information'}
        </Text>
        {!isEditing && (
          <TouchableOpacity 
            style={modernStyles.editIconButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={modernStyles.editIcon}>✏️</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Profile Avatar Section */}
      <Animated.View 
        style={[
          modernStyles.avatarSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={modernStyles.avatarContainer}>
          <Text style={modernStyles.avatarPlaceholder}>👨‍🌾</Text>
          {isEditing && (
            <TouchableOpacity style={modernStyles.avatarEditButton}>
              <Text style={modernStyles.avatarEditIcon}>📷</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={modernStyles.userName}>{user?.name || 'User'}</Text>
        <Text style={modernStyles.userRole}>{user?.role || 'Farmer'}</Text>
      </Animated.View>

      <ScrollView 
        style={modernStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={modernStyles.scrollContent}
      >
        <Animated.View 
          style={[
            modernStyles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Personal Information Section */}
          <View style={modernStyles.sectionContainer}>
            <View style={modernStyles.sectionTitleContainer}>
              <Text style={modernStyles.sectionTitleText}>👤 Personal Information</Text>
            </View>

            <View style={modernStyles.inputGroup}>
              <Text style={modernStyles.label}>Full Name</Text>
              <View style={modernStyles.inputContainer}>
                <Text style={modernStyles.inputIcon}>👤</Text>
                <TextInput
                  style={[modernStyles.input, !isEditing && modernStyles.inputDisabled]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.text.primaryLight}
                  editable={isEditing}
                />
              </View>
            </View>

            <View style={modernStyles.inputGroup}>
              <Text style={modernStyles.label}>Phone Number</Text>
              <View style={modernStyles.inputContainer}>
                <Text style={modernStyles.inputIcon}>📱</Text>
                <TextInput
                  style={[modernStyles.input, !isEditing && modernStyles.inputDisabled]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor={COLORS.text.primaryLight}
                  keyboardType="phone-pad"
                  editable={isEditing}
                />
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={modernStyles.sectionContainer}>
            <View style={modernStyles.sectionTitleContainer}>
              <Text style={modernStyles.sectionTitleText}>📍 Location</Text>
            </View>

            <View style={modernStyles.inputGroup}>
              <Text style={modernStyles.label}>Country</Text>
              <View style={modernStyles.dropdownContainer}>
                <DropDownPicker
                  open={openCountry}
                  value={country}
                  items={countries}
                  setOpen={setOpenCountry}
                  setValue={setCountry}
                  setItems={() => {}}
                  onSelectItem={(item) => {
                    if (item.value !== country) {
                      setProvince('');
                      setDistrict('');
                    }
                  }}
                  listMode="MODAL"
                  disabled={!isEditing}
                  style={modernStyles.dropdown}
                  dropDownContainerStyle={modernStyles.dropdownList}
                  textStyle={modernStyles.dropdownText}
                  placeholder="Select Country"
                />
              </View>
            </View>

            <View style={modernStyles.inputGroup}>
              <Text style={modernStyles.label}>Province/State</Text>
              <View style={modernStyles.dropdownContainer}>
                <DropDownPicker
                  open={openProvince}
                  value={province}
                  items={provinces}
                  setOpen={setOpenProvince}
                  setValue={setProvince}
                  setItems={() => {}}
                  onSelectItem={(item) => {
                    if (item.value !== province) {
                      setDistrict('');
                    }
                  }}
                  disabled={!country || !isEditing}
                  listMode="MODAL"
                  style={modernStyles.dropdown}
                  dropDownContainerStyle={modernStyles.dropdownList}
                  textStyle={modernStyles.dropdownText}
                  placeholder="Select Province"
                />
              </View>
            </View>

            <View style={modernStyles.inputGroup}>
              <Text style={modernStyles.label}>District</Text>
              <View style={modernStyles.dropdownContainer}>
                <DropDownPicker
                  open={openDistrict}
                  value={district}
                  items={districts}
                  setOpen={setOpenDistrict}
                  setValue={setDistrict}
                  setItems={() => {}}
                  disabled={!province || !isEditing}
                  listMode="MODAL"
                  style={modernStyles.dropdown}
                  dropDownContainerStyle={modernStyles.dropdownList}
                  textStyle={modernStyles.dropdownText}
                  placeholder="Select District"
                />
              </View>
            </View>
          </View>

          {/* Preferences Section */}
          <View style={modernStyles.sectionContainer}>
            <View style={modernStyles.sectionTitleContainer}>
              <Text style={modernStyles.sectionTitleText}>⚙️ Preferences</Text>
            </View>

            <View style={modernStyles.inputGroup}>
              <Text style={modernStyles.label}>Language</Text>
              <View style={modernStyles.dropdownContainer}>
                <DropDownPicker
                  open={openLanguage}
                  value={language}
                  items={languageOptions}
                  setOpen={setOpenLanguage}
                  setValue={setLanguage}
                  setItems={() => {}}
                  listMode="MODAL"
                  disabled={!isEditing}
                  style={modernStyles.dropdown}
                  dropDownContainerStyle={modernStyles.dropdownList}
                  textStyle={modernStyles.dropdownText}
                  placeholder="Select Language"
                />
              </View>
            </View>

            <View style={modernStyles.inputGroup}>
              <Text style={modernStyles.label}>Measurement Units</Text>
              <View style={modernStyles.dropdownContainer}>
                <DropDownPicker
                  open={openMeasurement}
                  value={measurementUnit}
                  items={measurementOptions}
                  setOpen={setOpenMeasurement}
                  setValue={setMeasurementUnit}
                  setItems={() => {}}
                  listMode="MODAL"
                  disabled={!isEditing}
                  style={modernStyles.dropdown}
                  dropDownContainerStyle={modernStyles.dropdownList}
                  textStyle={modernStyles.dropdownText}
                  placeholder="Select Units"
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modern Action Buttons */}
      <Animated.View 
        style={[
          modernStyles.actionContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {isEditing ? (
          <View style={modernStyles.editButtonsContainer}>
            <TouchableOpacity
              style={modernStyles.cancelButton}
              onPress={handleCancelEdit}
              disabled={isLoading}
            >
              <Text style={modernStyles.cancelButtonIcon}>✕</Text>
              <Text style={modernStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[modernStyles.saveButton, isLoading && modernStyles.saveButtonDisabled]}
              onPress={handleSaveChanges}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={modernStyles.saveButtonIcon}>✓</Text>
                  <Text style={modernStyles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={modernStyles.editProfileButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={modernStyles.editProfileButtonIcon}>✏️</Text>
            <Text style={modernStyles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const modernStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  editIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 18,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarPlaceholder: {
    fontSize: 80,
    width: 120,
    height: 120,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatarEditIcon: {
    fontSize: 16,
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: '#7f8c8d',
    textTransform: 'capitalize',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginVertical: 10,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  sectionTitleContainer: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 15,
    minHeight: 50,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#6c757d',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 12,
  },
  inputDisabled: {
    color: '#6c757d',
    backgroundColor: '#f1f3f4',
  },
  dropdownContainer: {
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    borderRadius: 12,
    minHeight: 50,
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderColor: '#e9ecef',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cancelButtonIcon: {
    fontSize: 16,
    color: '#7f8c8d',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  saveButtonDisabled: {
    backgroundColor: '#bdc3c7',
    elevation: 2,
  },
  saveButtonIcon: {
    fontSize: 16,
    color: 'white',
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  editProfileButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  editProfileButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default EditProfileScreen;
