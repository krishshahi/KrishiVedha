import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import { CropInfo } from '../types/crop.types';
import { cropCardStyles as styles } from '../styles/CropCard.styles';

interface CropCardProps {
  crop: CropInfo;
  onPress?: () => void;
  showDetails?: boolean;
}

const CropCard: React.FC<CropCardProps> = ({ crop, onPress, showDetails = false }) => {
  const getSeasonText = (months: number[]): string => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return months.map(m => monthNames[m - 1]).join(', ');
  };

  const getWaterRequirementIcon = (requirement: string): keyof typeof Ionicons.glyphMap => {
    switch (requirement.toLowerCase()) {
      case 'high':
        return 'water';
      case 'medium':
        return 'partly-sunny';
      case 'low':
        return 'sunny';
      default:
        return 'water-outline';
    }
  };

  const getWaterColor = (requirement: string): string => {
    switch (requirement.toLowerCase()) {
      case 'high':
        return '#2196F3';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#FFC107';
      default:
        return COLORS.text.primaryLight;
    }
  };

  const stages = ['Planting', 'Irrigation', 'Fertilization', 'Pest Control', 'Harvesting'];

  const getCurrentStage = (crop: CropInfo): string => {
    const currentStageIndex = Math.floor((crop.growthDuration / stages.length) * (Math.random() * stages.length));
    return stages[currentStageIndex];
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.cropInfo}>
          <Text style={styles.cropName}>{crop.name}</Text>
          <Text style={styles.cropNameEn}>{crop.nameEn}</Text>
        </View>
        <View style={styles.waterIndicator}>
          <Ionicons 
            name={getWaterRequirementIcon(crop.waterRequirement)} 
            size={24} 
            color={getWaterColor(crop.waterRequirement)} 
          />
          <Text style={[styles.waterText, { color: getWaterColor(crop.waterRequirement) }]}>
            {crop.waterRequirement === 'High' ? 'High' : 
             crop.waterRequirement === 'Medium' ? 'Medium' : 'Low'}
          </Text>
        </View>
      </View>
      
      <View style={styles.seasonContainer}>
        <View style={styles.seasonItem}>
          <Ionicons name="leaf" size={16} color={COLORS.success} />
          <Text style={styles.seasonLabel}>Plant:</Text>
          <Text style={styles.seasonText}>{getSeasonText(crop.plantingMonths)}</Text>
        </View>
        <View style={styles.seasonItem}>
          <Ionicons name="basket" size={16} color={COLORS.warning} />
          <Text style={styles.seasonLabel}>Harvest:</Text>
          <Text style={styles.seasonText}>{getSeasonText(crop.harvestMonths)}</Text>
        </View>
      </View>
      
      <View style={styles.durationContainer}>
        <Ionicons name="time" size={16} color={COLORS.text.primaryLight} />
        <Text style={styles.durationText}>{crop.growthDuration} days</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.stageText}>Current Stage: {getCurrentStage(crop)}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>
      </View>

      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Variety:</Text>
            <Text style={styles.detailValue}>{crop.variety}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Soil:</Text>
            <Text style={styles.detailValue}>{crop.soilType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fertilizer:</Text>
            <Text style={styles.detailValue}>{crop.fertilizer}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Spacing:</Text>
            <Text style={styles.detailValue}>{crop.spacing}</Text>
          </View>
          
          {crop.tips && crop.tips.length > 0 && (
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsHeader}>Tips:</Text>
              {crop.tips.slice(0, 2).map((tip: string, index: number) => (
                <Text key={index} style={styles.tipText}>• {tip}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </CardComponent>
  );
};


export default CropCard;

// Notification system placeholder for future implementation
const notifyUser = (message: string) => {
  // Code to send notifications to users will be implemented here
  console.log(`Notification: ${message}`);
};

// Example notification call
notifyUser('Remember to fertilize your crops this week!');

