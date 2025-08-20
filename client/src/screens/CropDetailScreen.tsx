import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { styles } from '../styles/CropDetailScreen.styles';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import ImagePicker from '../components/ImagePicker';
import AddActivityModal from '../components/AddActivityModal';
import apiService from '../services/apiService';
import { mlCropAnalysisService } from '../services/mlCropAnalysisService';

// Define the type for the route params
type CropDetailScreenRouteProp = {
  CropDetail: {
    crop: any; // Using any for now, should be replaced with a proper Crop type
  };
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const ProgressBar = ({ progress }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${progress}%` }]} />
    </View>
    <Text style={styles.progressText}>{progress}% Complete</Text>
  </View>
);

const ActivityItem = ({ activity, onEdit, onDelete }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'watering':
        return '💧';
      case 'fertilizing':
        return '🌱';
      case 'pruning':
        return '✂️';
      case 'weeding':
        return '🌿';
      case 'stage_change':
        return '📈';
      case 'harvesting':
        return '🌾';
      case 'planting':
        return '🌱';
      default:
        return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Text style={styles.activityIconText}>{getActivityIcon(activity.type)}</Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
      </View>
      <View style={styles.activityActions}>
        <TouchableOpacity onPress={() => onEdit(activity)} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(activity)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CropDetailScreen = () => {
  const route = useRoute<RouteProp<CropDetailScreenRouteProp, 'CropDetail'>>();
  const { crop } = route.params;
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [mlAnalysis, setMlAnalysis] = useState(null);
  const [analyzingHealth, setAnalyzingHealth] = useState(false);

  // Load activities and ML analysis when component mounts
  useEffect(() => {
    loadActivities();
    performMLAnalysis();
  }, [crop._id]);

  const performMLAnalysis = async () => {
    try {
      setAnalyzingHealth(true);
      console.log('🤖 Starting ML analysis for crop:', crop.name);
      
      const analysis = await mlCropAnalysisService.analyzeCropHealth(
        crop._id || crop.id, 
        {
          name: crop.name,
          variety: crop.variety,
          stage: crop.growthStage || crop.status,
          plantingDate: crop.plantingDate,
          area: crop.area
        }
      );
      
      setMlAnalysis(analysis);
      console.log('✅ ML analysis completed:', analysis.healthScore);
    } catch (error) {
      console.error('❌ ML analysis failed:', error);
    } finally {
      setAnalyzingHealth(false);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 85) return COLORS.success;
    if (score >= 75) return COLORS.primary;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return COLORS.error;
      case 'medium': return COLORS.warning;
      case 'low': return COLORS.success;
      default: return COLORS.text.secondary;
    }
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCropActivities(crop._id || crop.id);
      if (response.success) {
        setActivities(response.data);
      } else {
        Alert.alert('Error', 'Failed to load activities');
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      Alert.alert('Error', 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activity) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteCropActivity(crop._id || crop.id, activity.id || activity._id);
              if (response.success) {
                await loadActivities(); // Reload activities
                Alert.alert('Success', 'Activity deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete activity');
              }
            } catch (error) {
              console.error('Error deleting activity:', error);
              Alert.alert('Error', 'Failed to delete activity');
            }
          }
        }
      ]
    );
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setShowAddActivity(true);
  };

  const handleAddActivity = () => {
    setEditingActivity(null);
    setShowAddActivity(true);
  };

  if (!crop) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No crop data available.</Text>
      </View>
    );
  }

  const plantingDate = new Date(crop.plantingDate).toLocaleDateString();
  const harvestDate = new Date(crop.expectedHarvestDate).toLocaleDateString();
  
  // Calculate progress
  const calculateProgress = (plantingDate: string, expectedHarvestDate: string): number => {
    const today = new Date();
    const planting = new Date(plantingDate);
    const harvest = new Date(expectedHarvestDate);
    
    if (today < planting) return 0;
    if (today > harvest) return 100;
    
    const totalDays = Math.ceil((harvest.getTime() - planting.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today.getTime() - planting.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.max(0, Math.floor((elapsedDays / totalDays) * 100)));
  };
  
  const progress = calculateProgress(crop.plantingDate, crop.expectedHarvestDate);

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>{crop.name} ({crop.variety})</Text>
          <Text style={styles.headerSubtitle}>{crop.status}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Growth Progress</Text>
          <ProgressBar progress={progress} />
          <Text style={styles.growthStageText}>Current Stage: {crop.growthStage || 'Growing'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          <DetailRow label="Planting Date" value={plantingDate} />
          <DetailRow label="Expected Harvest" value={harvestDate} />
          <DetailRow label="Growth Stage" value={crop.growthStage} />
          <DetailRow label="Area" value={`${crop.area.value} ${crop.area.unit}`} />
          {crop.notes && <DetailRow label="Notes" value={crop.notes} />}
        </View>

        {/* AI Health Analysis Section */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="analytics" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>AI Health Analysis</Text>
            <TouchableOpacity
              onPress={performMLAnalysis}
              style={{ marginLeft: 'auto', padding: 4 }}
            >
              <Ionicons name="refresh" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {analyzingHealth ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Ionicons name="cpu" size={32} color={COLORS.primary} style={{ marginBottom: 12 }} />
              <Text style={{ color: COLORS.text.primary, marginBottom: 8 }}>Analyzing crop health...</Text>
              <Text style={{ color: COLORS.text.secondary, textAlign: 'center', fontSize: 12 }}>
                Using ML model: {mlAnalysis?.modelUsed || 'CropHealthNet v2.1'}
              </Text>
            </View>
          ) : mlAnalysis ? (
            <>
              {/* Health Score */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
                padding: 16,
                backgroundColor: getHealthColor(mlAnalysis.healthScore) + '15',
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: getHealthColor(mlAnalysis.healthScore)
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text.primary, marginBottom: 4 }}>
                    Health Score: {mlAnalysis.healthScore}/100
                  </Text>
                  <Text style={{ fontSize: 14, color: getHealthColor(mlAnalysis.healthScore), textTransform: 'capitalize' }}>
                    Status: {mlAnalysis.status} • {mlAnalysis.confidence}% confident
                  </Text>
                </View>
                <View style={{
                  backgroundColor: getHealthColor(mlAnalysis.healthScore),
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    {mlAnalysis.healthScore >= 85 ? '✓' : mlAnalysis.healthScore >= 60 ? '!' : '⚠'}
                  </Text>
                </View>
              </View>

              {/* Growth Prediction */}
              {mlAnalysis.growthPrediction && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text.primary, marginBottom: 8 }}>
                    Growth Prediction
                  </Text>
                  <Text style={{ color: COLORS.text.secondary, marginBottom: 4 }}>
                    Next Stage: {mlAnalysis.growthPrediction.nextStage} in {mlAnalysis.growthPrediction.daysToNextStage} days
                  </Text>
                  <Text style={{ color: COLORS.text.secondary, marginBottom: 4 }}>
                    Expected Harvest: {mlAnalysis.growthPrediction.expectedHarvestDate}
                  </Text>
                  <Text style={{ color: COLORS.text.secondary }}>
                    Yield Prediction: {mlAnalysis.growthPrediction.yieldPrediction.estimated} {mlAnalysis.growthPrediction.yieldPrediction.unit}
                  </Text>
                </View>
              )}

              {/* Disease Risks */}
              {mlAnalysis.diseases && mlAnalysis.diseases.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text.primary, marginBottom: 8 }}>
                    Disease Risks
                  </Text>
                  {mlAnalysis.diseases.slice(0, 3).map((disease, index) => (
                    <View key={index} style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 4
                    }}>
                      <Text style={{ color: COLORS.text.primary }}>{disease.name}</Text>
                      <Text style={{
                        color: disease.severity === 'high' ? COLORS.error : disease.severity === 'medium' ? COLORS.warning : COLORS.success,
                        fontSize: 12,
                        textTransform: 'capitalize'
                      }}>
                        {Math.round(disease.probability * 100)}% ({disease.severity})
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Top Recommendations */}
              {mlAnalysis.recommendations && mlAnalysis.recommendations.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text.primary, marginBottom: 8 }}>
                    AI Recommendations
                  </Text>
                  {mlAnalysis.recommendations.slice(0, 2).map((rec, index) => (
                    <View key={index} style={{
                      backgroundColor: COLORS.background,
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: getPriorityColor(rec.priority)
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text.primary, flex: 1 }}>
                          {rec.title}
                        </Text>
                        <Text style={{
                          fontSize: 12,
                          color: getPriorityColor(rec.priority),
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          {rec.priority}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: COLORS.text.secondary, marginBottom: 4 }}>
                        {rec.description}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '500' }}>
                        Action: {rec.action}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <TouchableOpacity
              onPress={performMLAnalysis}
              style={{
                alignItems: 'center',
                padding: 20,
                borderWidth: 2,
                borderColor: COLORS.primary,
                borderRadius: 8,
                borderStyle: 'dashed'
              }}
            >
              <Ionicons name="analytics" size={32} color={COLORS.primary} style={{ marginBottom: 8 }} />
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Run AI Health Analysis</Text>
              <Text style={{ color: COLORS.text.secondary, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                Get ML-powered insights about your crop's health
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Crop Images Section */}
        <View style={styles.card}>
          <ImagePicker
            cropId={crop._id || crop.id}
            maxImages={8}
            onImagesUpdated={(images) => {
              console.log('Crop images updated:', images.length);
            }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading activities...</Text>
          ) : activities.length > 0 ? (
            activities.map((activity, index) => (
              <ActivityItem
                key={activity.id || activity._id || index}
                activity={activity}
                onEdit={handleEditActivity}
                onDelete={handleDeleteActivity}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No activities recorded yet.</Text>
          )}
          <TouchableOpacity style={styles.addButton} onPress={handleAddActivity}>
            <Text style={styles.addButtonText}>+ Log New Activity</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddActivityModal
        visible={showAddActivity}
        onClose={() => {
          setShowAddActivity(false);
          setEditingActivity(null);
        }}
        onActivityAdded={loadActivities}
        cropId={crop._id || crop.id}
        activity={editingActivity}
      />
    </>
  );
};

export default CropDetailScreen;

