import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { styles } from '../styles/AddFarmScreen.styles';
import apiService from '../services/apiService';
import { RootState } from '../store';

const AddFarmScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Basic Information
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState('acres');
  const [description, setDescription] = useState('');
  
  // Farm Details
  const [soilType, setSoilType] = useState('');
  const [irrigationType, setIrrigationType] = useState('');
  const [farmType, setFarmType] = useState('crop');
  const [waterSource, setWaterSource] = useState('');
  const [isOrganic, setIsOrganic] = useState(false);
  const [elevation, setElevation] = useState('');
  const [climate, setClimate] = useState('');
  
  // Contact & Additional Info
  const [contactPerson, setContactPerson] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  
  // State
  const [activeSection, setActiveSection] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const soilTypes = [
    'Clay',
    'Sandy',
    'Loamy',
    'Silty',
    'Peaty',
    'Chalky',
    'Black Cotton',
    'Red Soil',
    'Alluvial',
    'Laterite'
  ];

  const irrigationTypes = [
    'Drip Irrigation',
    'Sprinkler',
    'Flood Irrigation',
    'Rain-fed',
    'Canal Irrigation',
    'Tube Well',
    'River/Stream',
    'Mixed System'
  ];

  const farmTypes = [
    { label: 'Crop Farming', value: 'crop' },
    { label: 'Livestock', value: 'livestock' },
    { label: 'Mixed Farming', value: 'mixed' },
    { label: 'Dairy', value: 'dairy' },
    { label: 'Poultry', value: 'poultry' },
    { label: 'Aquaculture', value: 'aquaculture' }
  ];

  const waterSources = [
    'Bore Well',
    'Open Well',
    'River',
    'Canal',
    'Pond/Tank',
    'Rainwater Harvesting',
    'Municipal Supply',
    'Multiple Sources'
  ];

  const climateTypes = [
    'Tropical',
    'Sub-tropical',
    'Temperate',
    'Arid',
    'Semi-arid',
    'Humid',
    'Monsoon'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    // Basic Information (Required)
    if (!farmName.trim()) newErrors.farmName = 'Farm name is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!size.trim()) newErrors.size = 'Farm size is required';
    else if (isNaN(parseFloat(size)) || parseFloat(size) <= 0) {
      newErrors.size = 'Please enter a valid size';
    }
    
    // Farm Details (Some Required)
    if (!soilType.trim()) newErrors.soilType = 'Soil type is required for better crop recommendations';
    if (!irrigationType.trim()) newErrors.irrigationType = 'Irrigation method is required';
    
    // Contact Information (Optional but validated if provided)
    if (phoneNumber && !/^[0-9+\-\s()]+$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    if (establishedYear && (isNaN(parseInt(establishedYear)) || parseInt(establishedYear) < 1900 || parseInt(establishedYear) > new Date().getFullYear())) {
      newErrors.establishedYear = 'Please enter a valid year';
    }
    if (elevation && (isNaN(parseFloat(elevation)) || parseFloat(elevation) < 0)) {
      newErrors.elevation = 'Please enter a valid elevation';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentSection = () => {
    const newErrors = {};
    
    if (activeSection === 'basic') {
      if (!farmName.trim()) newErrors.farmName = 'Farm name is required';
      if (!location.trim()) newErrors.location = 'Location is required';
      if (!size.trim()) newErrors.size = 'Farm size is required';
      else if (isNaN(parseFloat(size)) || parseFloat(size) <= 0) {
        newErrors.size = 'Please enter a valid size';
      }
    } else if (activeSection === 'details') {
      if (!soilType.trim()) newErrors.soilType = 'Soil type is required for better crop recommendations';
      if (!irrigationType.trim()) newErrors.irrigationType = 'Irrigation method is required';
      if (elevation && (isNaN(parseFloat(elevation)) || parseFloat(elevation) < 0)) {
        newErrors.elevation = 'Please enter a valid elevation';
      }
    } else if (activeSection === 'contact') {
      if (phoneNumber && !/^[0-9+\-\s()]+$/.test(phoneNumber)) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      }
      if (establishedYear && (isNaN(parseInt(establishedYear)) || parseInt(establishedYear) < 1900 || parseInt(establishedYear) > new Date().getFullYear())) {
        newErrors.establishedYear = 'Please enter a valid year';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCompletionStatus = () => {
    const basic = farmName.trim() && location.trim() && size.trim() && !isNaN(parseFloat(size)) && parseFloat(size) > 0;
    const details = soilType.trim() && irrigationType.trim();
    const contact = true; // Contact section is optional
    
    return { basic, details, contact };
  };

  const handleAddFarm = async () => {
    if (!user) {
      Alert.alert('Authentication Error', 'Please log in to add a farm');
      return;
    }

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    try {
      setLoading(true);

      // Map the farm data to match the ApiFarm interface
      const farmData = {
        userId: user.id,
        name: farmName.trim(),
        location: location.trim(),
        area: parseFloat(size),
        crops: [],
        soilType: soilType || undefined,
        irrigationMethod: irrigationType || undefined,
        notes: description.trim() || undefined,
        // Additional fields for enhanced data
        farmType: farmType,
        waterSource: waterSource || undefined,
        isOrganic: isOrganic,
        elevation: elevation ? parseFloat(elevation) : undefined,
        climate: climate || undefined,
        contactPerson: contactPerson.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        establishedYear: establishedYear ? parseInt(establishedYear) : undefined,
        sizeUnit: sizeUnit,
      };

      console.log('Creating farm via API:', farmData);
      
      // Create farm using API service
      const createdFarm = await apiService.createFarm(farmData);
      console.log('Farm created successfully:', createdFarm);

      Alert.alert(
        'Success',
        'Farm has been added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding farm:', error);
      Alert.alert(
        'Error', 
        'Failed to add farm. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textWhite} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Farm</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Section Navigation */}
        <View style={styles.sectionNavigation}>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'basic' && styles.sectionTabActive]}
            onPress={() => setActiveSection('basic')}
          >
            <Ionicons 
              name="information-circle" 
              size={20} 
              color={activeSection === 'basic' ? COLORS.primary : COLORS.text.secondary} 
            />
            <Text style={[styles.sectionTabText, activeSection === 'basic' && styles.sectionTabTextActive]}>
              Basic Info
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'details' && styles.sectionTabActive]}
            onPress={() => setActiveSection('details')}
          >
            <Ionicons 
              name="leaf" 
              size={20} 
              color={activeSection === 'details' ? COLORS.primary : COLORS.text.secondary} 
            />
            <Text style={[styles.sectionTabText, activeSection === 'details' && styles.sectionTabTextActive]}>
              Farm Details
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'contact' && styles.sectionTabActive]}
            onPress={() => setActiveSection('contact')}
          >
            <Ionicons 
              name="person" 
              size={20} 
              color={activeSection === 'contact' ? COLORS.primary : COLORS.text.secondary} 
            />
            <Text style={[styles.sectionTabText, activeSection === 'contact' && styles.sectionTabTextActive]}>
              Contact
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Basic Information Section */}
          {activeSection === 'basic' && (
            <>
              {/* Farm Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Farm Name *</Text>
                <TextInput
                  style={[styles.input, errors.farmName && styles.inputError]}
                  value={farmName}
                  onChangeText={(text) => {
                    setFarmName(text);
                    if (errors.farmName) setErrors(prev => ({...prev, farmName: null}));
                  }}
                  placeholder="Enter farm name"
                  placeholderTextColor={COLORS.text.secondary}
                />
                {errors.farmName && <Text style={styles.errorText}>{errors.farmName}</Text>}
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location *</Text>
                <TextInput
                  style={[styles.input, errors.location && styles.inputError]}
                  value={location}
                  onChangeText={(text) => {
                    setLocation(text);
                    if (errors.location) setErrors(prev => ({...prev, location: null}));
                  }}
                  placeholder="Enter location (City, District)"
                  placeholderTextColor={COLORS.text.secondary}
                />
                {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
              </View>

              {/* Farm Size */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Farm Size *</Text>
                <View style={styles.sizeContainer}>
                  <TextInput
                    style={[styles.input, styles.sizeInput, errors.size && styles.inputError]}
                    value={size}
                    onChangeText={(text) => {
                      setSize(text);
                      if (errors.size) setErrors(prev => ({...prev, size: null}));
                    }}
                    placeholder="0.0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={COLORS.text.secondary}
                  />
                  <View style={styles.unitPicker}>
                    <Picker
                      selectedValue={sizeUnit}
                      onValueChange={setSizeUnit}
                      style={styles.picker}
                    >
                      <Picker.Item label="Acres" value="acres" />
                      <Picker.Item label="Hectares" value="hectares" />
                      <Picker.Item label="Sq. Meters" value="sqmeters" />
                    </Picker>
                  </View>
                </View>
                {errors.size && <Text style={styles.errorText}>{errors.size}</Text>}
              </View>

              {/* Farm Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Farm Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={farmType}
                    onValueChange={setFarmType}
                    style={styles.picker}
                  >
                    {farmTypes.map((type) => (
                      <Picker.Item key={type.value} label={type.label} value={type.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter farm description (optional)"
                  placeholderTextColor={COLORS.text.secondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </>
          )}

          {/* Farm Details Section */}
          {activeSection === 'details' && (
            <>
              {/* Soil Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Soil Type *</Text>
                <View style={[styles.pickerContainer, errors.soilType && styles.inputError]}>
                  <Picker
                    selectedValue={soilType}
                    onValueChange={(value) => {
                      setSoilType(value);
                      if (errors.soilType) setErrors(prev => ({...prev, soilType: null}));
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select soil type" value="" />
                    {soilTypes.map((type) => (
                      <Picker.Item key={type} label={type} value={type} />
                    ))}
                  </Picker>
                </View>
                {errors.soilType && <Text style={styles.errorText}>{errors.soilType}</Text>}
              </View>

              {/* Irrigation Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Irrigation Method *</Text>
                <View style={[styles.pickerContainer, errors.irrigationType && styles.inputError]}>
                  <Picker
                    selectedValue={irrigationType}
                    onValueChange={(value) => {
                      setIrrigationType(value);
                      if (errors.irrigationType) setErrors(prev => ({...prev, irrigationType: null}));
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select irrigation method" value="" />
                    {irrigationTypes.map((type) => (
                      <Picker.Item key={type} label={type} value={type} />
                    ))}
                  </Picker>
                </View>
                {errors.irrigationType && <Text style={styles.errorText}>{errors.irrigationType}</Text>}
              </View>

              {/* Water Source */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Water Source</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={waterSource}
                    onValueChange={setWaterSource}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select water source" value="" />
                    {waterSources.map((source) => (
                      <Picker.Item key={source} label={source} value={source} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Climate Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Climate Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={climate}
                    onValueChange={setClimate}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select climate type" value="" />
                    {climateTypes.map((type) => (
                      <Picker.Item key={type} label={type} value={type} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Elevation */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Elevation (meters above sea level)</Text>
                <TextInput
                  style={[styles.input, errors.elevation && styles.inputError]}
                  value={elevation}
                  onChangeText={(text) => {
                    setElevation(text);
                    if (errors.elevation) setErrors(prev => ({...prev, elevation: null}));
                  }}
                  placeholder="Enter elevation (optional)"
                  keyboardType="decimal-pad"
                  placeholderTextColor={COLORS.text.secondary}
                />
                {errors.elevation && <Text style={styles.errorText}>{errors.elevation}</Text>}
              </View>

              {/* Organic Farming Toggle */}
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Organic Farming</Text>
                  <Switch
                    value={isOrganic}
                    onValueChange={setIsOrganic}
                    trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
                    thumbColor={isOrganic ? COLORS.primary : COLORS.text.secondary}
                  />
                </View>
                <Text style={styles.helperText}>
                  {isOrganic ? 'This farm follows organic farming practices' : 'Enable if this farm follows organic practices'}
                </Text>
              </View>
            </>
          )}

          {/* Contact Information Section */}
          {activeSection === 'contact' && (
            <>
              {/* Contact Person */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Person</Text>
                <TextInput
                  style={styles.input}
                  value={contactPerson}
                  onChangeText={setContactPerson}
                  placeholder="Enter contact person name (optional)"
                  placeholderTextColor={COLORS.text.secondary}
                />
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, errors.phoneNumber && styles.inputError]}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (errors.phoneNumber) setErrors(prev => ({...prev, phoneNumber: null}));
                  }}
                  placeholder="Enter phone number (optional)"
                  keyboardType="phone-pad"
                  placeholderTextColor={COLORS.text.secondary}
                />
                {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
              </View>

              {/* Established Year */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Established Year</Text>
                <TextInput
                  style={[styles.input, errors.establishedYear && styles.inputError]}
                  value={establishedYear}
                  onChangeText={(text) => {
                    setEstablishedYear(text);
                    if (errors.establishedYear) setErrors(prev => ({...prev, establishedYear: null}));
                  }}
                  placeholder="Enter year (optional)"
                  keyboardType="numeric"
                  maxLength={4}
                  placeholderTextColor={COLORS.text.secondary}
                />
                {errors.establishedYear && <Text style={styles.errorText}>{errors.establishedYear}</Text>}
              </View>

              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Farm Summary</Text>
                <View style={styles.summaryItem}>
                  <Ionicons name="business" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.summaryText}>{farmName || 'Farm Name'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="location" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.summaryText}>{location || 'Location'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="resize" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.summaryText}>{size ? `${size} ${sizeUnit}` : 'Size'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="leaf" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.summaryText}>{farmTypes.find(t => t.value === farmType)?.label || 'Farm Type'}</Text>
                </View>
                {isOrganic && (
                  <View style={styles.summaryItem}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={[styles.summaryText, { color: COLORS.success }]}>Organic Certified</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleAddFarm}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Farm'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddFarmScreen;
