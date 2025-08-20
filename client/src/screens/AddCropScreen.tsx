import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/AddCropScreen.styles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import apiService from '../services/apiService';
import { COLORS } from '../constants/colors';
import cropsData from '../../crops.json';
import ImagePicker from '../components/ImagePicker';

function AddCropScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAppSelector((state) => state.auth);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [cropName, setCropName] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedCropData, setSelectedCropData] = useState(null);
  const [availableVarieties, setAvailableVarieties] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cropImages, setCropImages] = useState([]);

  useEffect(() => {
    const { selectedFarm } = route.params || {};

    const fetchFarms = async () => {
      try {
        setLoading(true);
        const farmData = await apiService.getFarms();
        setFarms(farmData);

        // Pre-select the farm if provided
        if (selectedFarm) {
          setSelectedFarmId(selectedFarm._id || selectedFarm.id);
        }
      } catch (error) {
        console.error('Error fetching farms:', error);
        Alert.alert('Error', 'Failed to load farms. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [route.params]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const generateDays = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i.toString());
    }
    return days;
  };

  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 1; i <= currentYear + 1; i++) {
      years.push(i.toString());
    }
    return years;
  };

  const handleCropChange = (itemValue) => {
    setCropName(itemValue);
    setCropVariety(''); // Reset variety when crop changes
    
    if (itemValue) {
      const cropData = cropsData.find(crop => crop.crop === itemValue);
      setSelectedCropData(cropData);
      setAvailableVarieties(cropData ? cropData.varieties : []);
    } else {
      setSelectedCropData(null);
      setAvailableVarieties([]);
    }
  };

  const handleAddCrop = async () => {
    if (!cropName || !cropVariety || !selectedMonth || !selectedDay || !selectedYear || !selectedFarmId) {
      Alert.alert('Missing Information', 'Please fill in all fields to continue.');
      return;
    }

    const monthIndex = months.indexOf(selectedMonth);
    const plantingDateObj = new Date(parseInt(selectedYear), monthIndex, parseInt(selectedDay));
    
    if (isNaN(plantingDateObj.getTime())) {
      Alert.alert('Invalid Date', 'Please select a valid planting date.');
      return;
    }
    
    const formattedDate = `${selectedMonth} ${selectedDay}, ${selectedYear}`;
    const expectedHarvestDate = calculateExpectedHarvestDate(plantingDateObj, selectedCropData);
    
    const cropData = {
      name: cropName,
      variety: cropVariety,
      plantingDate: plantingDateObj.toISOString(),
      expectedHarvestDate: expectedHarvestDate.toISOString(),
      status: 'planted',
      growthStage: 'seedling',
      area: { value: 1, unit: 'acres' },
      notes: `${cropName} (${cropVariety}) planted on ${formattedDate}`,
      ownerId: user?.id || '',
      farmId: selectedFarmId
    };

    try {
      setIsSubmitting(true);
      console.log('Sending crop data:', cropData);
      
      // Use apiService instead of hardcoded fetch
      const createdCrop = await apiService.createCrop(cropData);
      console.log('Crop created successfully:', createdCrop);
      
      Alert.alert(
        'Success! 🌱',
        'Your crop has been planted successfully!',
        [{ text: 'Great!', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating crop:', error);
      Alert.alert(
        'Connection Error', 
        'Please check your internet connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateExpectedHarvestDate = (plantingDate, cropData) => {
    const harvestDate = new Date(plantingDate);
    
    if (cropData && cropData.plantation_to_harvest_duration) {
      const duration = cropData.plantation_to_harvest_duration;
      
      if (duration.includes('days')) {
        const days = parseInt(duration.split('-')[1] || duration.split(' ')[0]);
        harvestDate.setDate(harvestDate.getDate() + days);
      } else if (duration.includes('months')) {
        const months = parseInt(duration.split('-')[1] || duration.split(' ')[0]);
        harvestDate.setMonth(harvestDate.getMonth() + months);
      } else if (duration.includes('years')) {
        const years = parseInt(duration.split('-')[1] || duration.split(' ')[0]);
        harvestDate.setFullYear(harvestDate.getFullYear() + years);
      }
    }
    
    return harvestDate;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Crop</Text>
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Select Farm</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedFarmId}
            onValueChange={(itemValue) => setSelectedFarmId(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Farm" value="" />
            {farms.map((farm) => (
              <Picker.Item key={farm._id || farm.id} label={farm.name} value={farm._id || farm.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Crop Name</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={cropName}
            onValueChange={handleCropChange}
            style={styles.picker}
          >
            <Picker.Item label="Select Crop" value="" />
            {cropsData.map((crop) => (
              <Picker.Item key={crop.id} label={crop.crop} value={crop.crop} />
            ))}
          </Picker>
        </View>
        {selectedCropData && (
          <Text style={styles.helpText}>
            Growing Duration: {selectedCropData.plantation_to_harvest_duration}
          </Text>
        )}

        <Text style={styles.label}>Variety</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={cropVariety}
            onValueChange={(itemValue) => setCropVariety(itemValue)}
            style={styles.picker}
            enabled={availableVarieties.length > 0}
          >
            <Picker.Item label={cropName ? "Select Variety" : "Select a crop first"} value="" />
            {availableVarieties.map((variety, index) => (
              <Picker.Item key={index} label={variety} value={variety} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Planting Date</Text>
        <View style={styles.datePickerContainer}>
          <Text style={styles.label}>Month</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Month" value="" />
              {months.map((month, index) => (
                <Picker.Item key={index} label={month} value={month} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Day</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedDay}
              onValueChange={(itemValue) => setSelectedDay(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Day" value="" />
              {generateDays().map((day) => (
                <Picker.Item key={day} label={day} value={day} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Year</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedYear}
              onValueChange={(itemValue) => setSelectedYear(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Year" value="" />
              {generateYears().map((year) => (
                <Picker.Item key={year} label={year} value={year} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Image Upload Section */}
        <Text style={styles.label}>Crop Photos (Optional)</Text>
        <View style={styles.imagePickerContainer}>
          <ImagePicker
            maxImages={3}
            onImagesUpdated={(images) => {
              setCropImages(images);
              console.log('Selected images for new crop:', images.length);
            }}
            style={{ marginVertical: 0 }}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleAddCrop}>
            <Text style={styles.buttonText}>Add Crop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default AddCropScreen;

