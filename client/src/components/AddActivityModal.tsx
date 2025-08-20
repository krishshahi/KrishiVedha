import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/colors';
import apiService from '../services/apiService';

interface AddActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onActivityAdded: () => void;
  cropId: string;
  activity?: any; // For editing existing activity
}

const AddActivityModal: React.FC<AddActivityModalProps> = ({
  visible,
  onClose,
  onActivityAdded,
  cropId,
  activity
}) => {
  const [activityType, setActivityType] = useState('watering');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const activityTypes = [
    { label: 'Watering', value: 'watering' },
    { label: 'Fertilizing', value: 'fertilizing' },
    { label: 'Pruning', value: 'pruning' },
    { label: 'Weeding', value: 'weeding' },
    { label: 'Stage Change', value: 'stage_change' },
    { label: 'Harvesting', value: 'harvesting' },
    { label: 'Planting', value: 'planting' },
    { label: 'Other', value: 'other' }
  ];

  useEffect(() => {
    if (activity) {
      // Editing existing activity
      setActivityType(activity.type);
      setTitle(activity.title);
      setDescription(activity.description);
      setDate(new Date(activity.date));
    } else {
      // Adding new activity
      resetForm();
    }
  }, [activity, visible]);

  const resetForm = () => {
    setActivityType('watering');
    setTitle('');
    setDescription('');
    setDate(new Date());
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the activity');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description for the activity');
      return;
    }

    try {
      setLoading(true);
      const activityData = {
        type: activityType,
        title: title.trim(),
        description: description.trim(),
        date: date.toISOString()
      };

      let response;
      if (activity) {
        // Update existing activity
        response = await apiService.updateCropActivity(cropId, activity.id || activity._id, activityData);
      } else {
        // Add new activity
        response = await apiService.addCropActivity(cropId, activityData);
      }

      if (response.success) {
        Alert.alert('Success', activity ? 'Activity updated successfully' : 'Activity added successfully');
        onActivityAdded();
        onClose();
      } else {
        Alert.alert('Error', response.message || 'Failed to save activity');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Error', 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activity ? 'Edit Activity' : 'Add New Activity'}
          </Text>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Activity Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={activityType}
                onValueChange={(itemValue) => setActivityType(itemValue)}
                style={styles.picker}
              >
                {activityTypes.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter activity title"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the activity in detail"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateDisplayText}>
                {date.toLocaleDateString()}
              </Text>
              <Text style={styles.dateNote}>
                Currently set to today's date
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : (activity ? 'Update Activity' : 'Add Activity')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dateDisplay: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
  },
  dateDisplayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  dateNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default AddActivityModal;
