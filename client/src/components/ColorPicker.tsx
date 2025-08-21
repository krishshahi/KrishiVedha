import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ColorPickerProps {
  visible: boolean;
  currentColor: string;
  onColorSelect: (color: string) => void;
  onClose: () => void;
  title?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  visible,
  currentColor,
  onColorSelect,
  onClose,
  title = 'Choose Color',
}) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [customColor, setCustomColor] = useState('');

  // Predefined color palettes
  const colorPalettes = {
    'Material': [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7',
      '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
      '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    ],
    'Pastel': [
      '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9',
      '#BAE1FF', '#FFB3FF', '#E0BBE4', '#FEC8D8',
      '#FFDFD3', '#D4F1F4', '#75E6DA', '#95E1D3',
      '#F38181', '#FCE38A', '#95E1D3', '#EAFFD0',
    ],
    'Vibrant': [
      '#FF006E', '#FB5607', '#FFBE0B', '#8338EC',
      '#3A86FF', '#06FFB4', '#119DA4', '#FF1744',
      '#D500F9', '#00E676', '#FFEA00', '#FF3D00',
      '#00B0FF', '#76FF03', '#FFC400', '#FF6D00',
    ],
    'Earth': [
      '#8D5524', '#C68642', '#E0AC69', '#F1C27D',
      '#FFDBAC', '#6F4E37', '#A0826D', '#B9935A',
      '#C8AD7F', '#D2B48C', '#704214', '#8B4513',
      '#A0522D', '#CD853F', '#DEB887', '#D2691E',
    ],
    'Nature': [
      '#228B22', '#32CD32', '#00FF00', '#7CFC00',
      '#7FFF00', '#ADFF2F', '#9ACD32', '#556B2F',
      '#6B8E23', '#808000', '#008000', '#006400',
      '#2E8B57', '#3CB371', '#20B2AA', '#00FA9A',
    ],
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleApply = () => {
    onColorSelect(selectedColor);
    onClose();
  };

  const handleCustomColorSubmit = () => {
    // Validate hex color
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(customColor)) {
      setSelectedColor(customColor);
      setCustomColor('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Current Color Preview */}
          <View style={styles.previewSection}>
            <View style={styles.previewContainer}>
              <View style={[styles.colorPreview, { backgroundColor: currentColor }]}>
                <Text style={styles.previewLabel}>Current</Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#666" style={styles.arrow} />
              <View style={[styles.colorPreview, { backgroundColor: selectedColor }]}>
                <Text style={styles.previewLabel}>New</Text>
              </View>
            </View>
            <Text style={styles.colorCode}>{selectedColor.toUpperCase()}</Text>
          </View>

          {/* Color Palettes */}
          <ScrollView style={styles.palettesContainer} showsVerticalScrollIndicator={false}>
            {Object.entries(colorPalettes).map(([paletteName, colors]) => (
              <View key={paletteName} style={styles.paletteSection}>
                <Text style={styles.paletteName}>{paletteName}</Text>
                <View style={styles.colorGrid}>
                  {colors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorItem,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColorItem,
                      ]}
                      onPress={() => handleColorSelect(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={20} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Custom Color Input */}
            <View style={styles.customColorSection}>
              <Text style={styles.paletteName}>Custom Color</Text>
              <View style={styles.customColorInput}>
                <TextInput
                  style={styles.hexInput}
                  placeholder="#000000"
                  value={customColor}
                  onChangeText={setCustomColor}
                  onSubmitEditing={handleCustomColorSubmit}
                  autoCapitalize="characters"
                  maxLength={7}
                />
                <TouchableOpacity
                  style={styles.customColorButton}
                  onPress={handleCustomColorSubmit}
                >
                  <Text style={styles.customColorButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Colors */}
            <View style={styles.paletteSection}>
              <Text style={styles.paletteName}>Recent Colors</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.recentColors}>
                  {['#4CAF50', '#2196F3', '#FF5722', '#FFC107', '#9C27B0'].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.recentColorItem,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColorItem,
                      ]}
                      onPress={() => handleColorSelect(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: selectedColor }]}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply Color</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  closeButton: {
    padding: 4,
  },
  previewSection: {
    padding: 20,
    alignItems: 'center',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  arrow: {
    marginHorizontal: 20,
  },
  colorCode: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  palettesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  paletteSection: {
    marginBottom: 24,
  },
  paletteName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  colorItem: {
    width: 48,
    height: 48,
    borderRadius: 8,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedColorItem: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  customColorSection: {
    marginBottom: 24,
  },
  customColorInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hexInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
  },
  customColorButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  customColorButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recentColors: {
    flexDirection: 'row',
  },
  recentColorItem: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default ColorPicker;
