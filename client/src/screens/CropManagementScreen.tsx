import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  TextInput,
  ActivityIndicator,
  FlatList,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import apiService from '../services/apiService';
import { mlCropAnalysisService } from '../services/mlCropAnalysisService';
import { styles } from '../styles/CropManagementScreen.styles';
import { COLORS } from '../constants/colors';


function CropManagementScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isOffline, setIsOffline] = useState(false);
  const [cropImages, setCropImages] = useState({});
  const [cropAnalysis, setCropAnalysis] = useState({});
  const [analyzingCrops, setAnalyzingCrops] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchFarms();
  }, []);

  // Refresh farms and crops when screen comes into focus (after adding a farm or crop)
  useFocusEffect(
    React.useCallback(() => {
      console.log('📍 CropManagementScreen focused, refreshing farms and crops...');
      // Always refresh when screen comes into focus
      fetchFarms();
    }, [])
  );

  async function fetchFarms() {
    try {
      setLoading(true);
      setError(null);
      setIsOffline(false);

      console.log('🚜 Fetching farms from API...');
      
      // Try to fetch farms from the API first
      let farmData;
      try {
        farmData = await apiService.getFarms();
        console.log('✅ Successfully fetched farms:', farmData.length, 'farms');
      } catch (apiError) {
        console.warn('⚠️ API farms fetch failed, using fallback:', apiError);
        // Fallback to user farms data
        farmData = user?.farms || [];
        setIsOffline(true);
      }
      
      setFarms(farmData);

      // Fetch all crops for all farms
      await fetchCropsForFarms(farmData);
    } catch (err) {
      console.error('Error fetching farms or crops:', err);
      setError('Unable to connect to server. Showing demo data.');
      setIsOffline(true);
    } finally {
      // Always stop loading regardless of data
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchCropsForFarms(farmData) {
    try {
      console.log('🌾 Fetching crops for', farmData.length, 'farms...');
      const allCrops = [];
      
      // Use Promise.all for parallel fetching
      const fetchPromises = farmData.map(async (farm) => {
        try {
          const farmId = farm._id || farm.id;
          console.log(`🔍 Fetching crops for farm: ${farm.name} (${farmId})`);
          
          // 🔒 SECURITY: Only pass farmId, let server filter by authenticated user
          const farmCrops = await apiService.getCrops(farmId);
          console.log(`✅ Found ${farmCrops.length} crops for farm ${farm.name}`);
          
          // Debug: Log crop ownership info
          if (farmCrops.length > 0) {
            console.log(`🔍 Crops for farm ${farm.name}:`, farmCrops.map(c => ({
              id: c._id || c.id,
              name: c.name,
              owner: c.owner?._id || c.owner?.id || c.owner,
              farmId: c.farmId || c.farm?._id || c.farm?.id
            })));
          }
          
          return farmCrops;
        } catch (farmError) {
          console.warn(`⚠️ Network error for farm ${farm.id}:`, farmError);
          if (farmError.response?.status === 401) {
            console.error('🔒 Authentication failed - redirecting to login');
            // Handle authentication error if needed
          }
          // Return empty array when network fails
          return [];
        }
      });
      
      // Wait for all farm requests
      const results = await Promise.allSettled(fetchPromises);
      
      // Collect all crops from successful requests
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          console.log(`📦 Adding ${result.value.length} crops from farm ${farmData[index].name}`);
          allCrops.push(...result.value);
        } else {
          console.error(`❌ Failed to get crops for farm ${farmData[index].name}:`, result.reason);
        }
      });
      
      console.log(`🌾 Total crops fetched: ${allCrops.length}`);
      setCrops(allCrops);
      
      // Load crop images and perform ML analysis after crops are loaded
      if (allCrops.length > 0) {
        loadCropImages(allCrops);
        performBatchMLAnalysis(allCrops);
      }
    } catch (error) {
      console.error('Error fetching crops:', error);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchFarms();
  };

  const navigateToAddCrop = (farm = null) => {
    if (farm) {
      navigation.navigate('AddCrop', { selectedFarm: farm });
    } else {
      navigation.navigate('AddCrop');
    }
  };
  const navigateToAddFarm = () => navigation.navigate('AddFarm');
  const navigateToCropDetail = (crop) => navigation.navigate('CropDetail', { crop });

  const getFilteredAndSortedFarms = () => {
    let filteredFarms = farms;
    
    // Apply search filter
    if (searchQuery) {
      filteredFarms = farms.filter(farm => 
        farm.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      const farmsWithCrops = filteredFarms.filter(farm => {
        const farmCrops = crops.filter(crop => crop.farmId === farm.id);
        return farmCrops.some(crop => crop.status === selectedFilter);
      });
      filteredFarms = farmsWithCrops;
    }
    
    // Sort farms
    filteredFarms.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'cropCount') {
        const aCropCount = crops.filter(crop => crop.farmId === a.id).length;
        const bCropCount = crops.filter(crop => crop.farmId === b.id).length;
        return bCropCount - aCropCount;
      }
      return 0;
    });
    
    return filteredFarms;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'planted': return COLORS.success;
      case 'growing': return COLORS.info;
      case 'flowering': return COLORS.warning;
      case 'ready': return COLORS.primary;
      default: return COLORS.text.secondary;
    }
  };

  const getCropProgress = (crop) => {
    if (crop.plantingDate && crop.expectedHarvestDate) {
      const now = new Date();
      const plantingDate = new Date(crop.plantingDate);
      const harvestDate = new Date(crop.expectedHarvestDate);
      
      const totalDuration = harvestDate - plantingDate;
      const elapsed = now - plantingDate;
      
      return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }
    return 0;
  };

  const filteredFarms = getFilteredAndSortedFarms();
  const totalCrops = crops.length;
  const activeCrops = crops.filter(crop => crop.status === 'growing' || crop.status === 'planted').length;

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Ionicons name="leaf" size={24} color={COLORS.success} />
        <Text style={styles.statNumber}>{totalCrops}</Text>
        <Text style={styles.statLabel}>Total Crops</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="trending-up" size={24} color={COLORS.info} />
        <Text style={styles.statNumber}>{activeCrops}</Text>
        <Text style={styles.statLabel}>Active</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="business" size={24} color={COLORS.primary} />
        <Text style={styles.statNumber}>{farms.length}</Text>
        <Text style={styles.statLabel}>Farms</Text>
      </View>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.controlsContainer}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search farms..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.text.secondary}
        />
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {['all', 'planted', 'growing', 'flowering', 'ready'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter && styles.filterChipTextActive
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const handleDeleteCrop = async (crop) => {
    Alert.alert(
      'Delete Crop',
      `Are you sure you want to delete ${crop.name} (${crop.variety})? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteCrop(crop._id || crop.id);
              console.log('✅ Crop deleted successfully');
              // Refresh the farms and crops data
              fetchFarms();
              Alert.alert('Success', 'Crop deleted successfully!');
            } catch (error) {
              console.error('Error deleting crop:', error);
              Alert.alert('Error', 'Failed to delete crop. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteFarm = async (farm) => {
    // Check if farm has crops
    const farmCrops = crops.filter(crop => {
      const cropFarmId = crop.farmId || (crop.farm && crop.farm._id) || (crop.farm && crop.farm.id);
      return cropFarmId === farm.id || cropFarmId === farm._id;
    });

    if (farmCrops.length > 0) {
      Alert.alert(
        'Cannot Delete Farm',
        `This farm has ${farmCrops.length} crop(s). Please delete all crops first before deleting the farm.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Farm',
      `Are you sure you want to delete "${farm.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const farmId = farm._id || farm.id;
              console.log('🗑️ Attempting to delete farm:', farmId, farm.name);
              
              await apiService.deleteFarm(farmId);
              console.log('✅ Farm deleted successfully:', farmId);
              
              // Add a small delay to ensure backend processing is complete
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Refresh the farms and crops data
              await fetchFarms();
              Alert.alert('Success', 'Farm deleted successfully!');
            } catch (error) {
              console.error('❌ Error deleting farm:', error);
              console.error('Farm ID attempted:', farm._id || farm.id);
              console.error('Full error:', error.message || error);
              
              Alert.alert(
                'Error', 
                `Failed to delete farm. ${error.message || 'Please try again.'}`
              );
            }
          }
        }
      ]
    );
  };

  // Load crop images for all crops
  const loadCropImages = async (cropsData) => {
    const imagePromises = cropsData.map(async (crop) => {
      const cropId = crop._id || crop.id;
      try {
        const response = await apiService.getCropImages(cropId);
        if (response.success && response.data && response.data.length > 0) {
          return { [cropId]: response.data[0] }; // Get first image
        }
        // Successfully got response but no images
        return { [cropId]: null };
      } catch (error) {
        // Only log if it's not a 404 (which is expected for crops with no images)
        if (error.response?.status !== 404) {
          console.warn(`Could not load images for crop ${cropId}:`, error.message);
        }
        return { [cropId]: null };
      }
    });

    try {
      const results = await Promise.all(imagePromises);
      const imageMap = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setCropImages(imageMap);
      console.log('📷 Loaded crop images:', Object.keys(imageMap).filter(k => imageMap[k]).length, 'crops have images');
    } catch (error) {
      console.error('Error loading crop images:', error);
    }
  };

  // Perform ML analysis for all crops
  const performBatchMLAnalysis = async (cropsData) => {
    if (!cropsData || cropsData.length === 0) return;
    
    setAnalyzingCrops(true);
    console.log('🤖 Starting ML analysis for', cropsData.length, 'crops...');
    
    try {
      const analysisPromises = cropsData.map(async (crop) => {
        const cropId = crop._id || crop.id;
        try {
          const analysis = await mlCropAnalysisService.analyzeCropHealth({
            cropType: crop.name,
            variety: crop.variety,
            plantingDate: crop.plantingDate,
            currentStatus: crop.status,
            location: crop.location || 'Unknown',
            soilType: crop.soilType || 'Loam',
            weatherConditions: 'Moderate'
          });
          return { [cropId]: analysis };
        } catch (error) {
          console.warn(`ML analysis failed for crop ${cropId}:`, error.message);
          return { [cropId]: null };
        }
      });
      
      const results = await Promise.all(analysisPromises);
      const analysisMap = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setCropAnalysis(analysisMap);
      
      const successfulAnalyses = Object.values(analysisMap).filter(a => a !== null).length;
      console.log('🤖 ML analysis completed:', successfulAnalyses, 'successful analyses');
    } catch (error) {
      console.error('Error during batch ML analysis:', error);
    } finally {
      setAnalyzingCrops(false);
    }
  };

  // Get health score color for UI
  const getHealthScoreColor = (score) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const renderCropCard = (crop) => {
    const progress = getCropProgress(crop);
    const cropId = crop._id || crop.id;
    const cropImage = cropImages[cropId];
    const analysis = cropAnalysis[cropId];
    
    return (
      <TouchableOpacity 
        key={cropId} 
        style={styles.cropCard}
        onPress={() => navigateToCropDetail(crop)}
      >
        <View style={styles.cropCardHeader}>
          {cropImage && (
            <View style={styles.cropImageContainer}>
              <Image
                source={{ uri: apiService.getImageUrl(cropImage.url) }}
                style={styles.cropCardImage}
                resizeMode="cover"
              />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.cropName}>{crop.name}</Text>
            <Text style={styles.cropVariety}>{crop.variety}</Text>
            {/* AI Health Score */}
            {analysis && analysis.healthScore && (
              <View style={styles.healthScoreContainer}>
                <Ionicons 
                  name="pulse" 
                  size={12} 
                  color={getHealthScoreColor(analysis.healthScore.overall)} 
                />
                <Text style={[
                  styles.healthScoreText,
                  { color: getHealthScoreColor(analysis.healthScore.overall) }
                ]}>
                  AI Health: {Math.round(analysis.healthScore.overall)}%
                </Text>
              </View>
            )}
          </View>
          <View style={styles.cropCardActions}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(crop.status) + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(crop.status) }
              ]}>
                {crop.status || 'Unknown'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteCropButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteCrop(crop);
              }}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cropProgress}>
          <View style={styles.progressBarContainer}>
            <View style={[
              styles.progressBar,
              { width: `${progress}%`, backgroundColor: getStatusColor(crop.status) }
            ]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
        
        {/* ML Analysis Insights */}
        {analysis && (
          <View style={styles.mlInsightsContainer}>
            {/* Disease Risk Alert */}
            {analysis.diseaseAnalysis && analysis.diseaseAnalysis.length > 0 && (
              <View style={styles.diseaseAlert}>
                <Ionicons 
                  name="warning" 
                  size={12} 
                  color={analysis.diseaseAnalysis[0].probability > 0.5 ? COLORS.error : COLORS.warning} 
                />
                <Text style={[
                  styles.diseaseAlertText,
                  { color: analysis.diseaseAnalysis[0].probability > 0.5 ? COLORS.error : COLORS.warning }
                ]}>
                  {analysis.diseaseAnalysis[0].name}: {Math.round(analysis.diseaseAnalysis[0].probability * 100)}%
                </Text>
              </View>
            )}
            
            {/* Growth Prediction */}
            {analysis.growthPrediction && analysis.growthPrediction.nextStage && (
              <View style={styles.growthPrediction}>
                <Ionicons name="trending-up" size={12} color={COLORS.info} />
                <Text style={styles.growthPredictionText}>
                  Next: {analysis.growthPrediction.nextStage}
                </Text>
              </View>
            )}
            
            {/* Top Recommendation */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <View style={styles.topRecommendation}>
                <Ionicons 
                  name={analysis.recommendations[0].priority === 'High' ? 'alert-circle' : 'information-circle'} 
                  size={12} 
                  color={analysis.recommendations[0].priority === 'High' ? COLORS.error : COLORS.primary} 
                />
                <Text style={styles.recommendationText} numberOfLines={1}>
                  {analysis.recommendations[0].action}
                </Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.cropDates}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar" size={14} color={COLORS.text.secondary} />
            <Text style={styles.dateText}>
              Planted: {crop.plantingDate ? new Date(crop.plantingDate).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="time" size={14} color={COLORS.text.secondary} />
            <Text style={styles.dateText}>
              Harvest: {crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFarmCard = (farm) => {
    // Debug logging to understand data structure
    console.log('🔍 Debugging farm:', farm.id, farm.name);
    console.log('🔍 All crops:', crops.map(c => ({ id: c._id || c.id, name: c.name, farmId: c.farmId, farm: c.farm })));
    
    const farmCrops = crops.filter(crop => {
      // Handle both farmId and farm._id cases
      const cropFarmId = crop.farmId || (crop.farm && crop.farm._id) || (crop.farm && crop.farm.id);
      return cropFarmId === farm.id || cropFarmId === farm._id;
    });
    console.log('🔍 Farm crops for', farm.name, ':', farmCrops.length);
    
    const activeFarmCrops = farmCrops.filter(crop => crop.status === 'growing' || crop.status === 'planted').length;
    
    return (
      <View key={farm._id || farm.id} style={styles.farmCard}>
        <View style={styles.farmHeader}>
          <View style={styles.farmHeaderLeft}>
            <Ionicons name="business" size={24} color={COLORS.primary} />
            <View style={styles.farmInfo}>
              <Text style={styles.farmName}>{farm.name}</Text>
              <Text style={styles.farmSubtitle}>
                {farmCrops.length} crops • {activeFarmCrops} active
              </Text>
            </View>
          </View>
          <View style={styles.farmHeaderRight}>
            <TouchableOpacity 
              style={styles.addCropButton}
              onPress={() => navigateToAddCrop(farm)}
            >
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteFarmButton}
              onPress={() => handleDeleteFarm(farm)}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        {farmCrops.length === 0 ? (
          <View style={styles.emptyCropsState}>
            <Ionicons name="leaf-outline" size={48} color={COLORS.text.secondary} />
            <Text style={styles.emptyCropsText}>No crops planted yet</Text>
            <TouchableOpacity 
              style={styles.addFirstCropButton}
              onPress={() => navigateToAddCrop(farm)}
            >
              <Text style={styles.addFirstCropText}>Plant your first crop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cropsContainer}>
            {farmCrops.map(crop => renderCropCard(crop))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Crop Management</Text>
          <View style={styles.headerSubtitleContainer}>
            <Text style={styles.headerSubtitle}>
              {isOffline ? 'Offline Mode - Demo Data' : 'Monitor and manage your crops'}
            </Text>
            {analyzingCrops && (
              <View style={styles.offlineIndicator}>
                <ActivityIndicator size={12} color={COLORS.primary} />
                <Text style={[styles.offlineText, { color: COLORS.primary }]}>AI Analyzing...</Text>
              </View>
            )}
            {isOffline && (
              <View style={styles.offlineIndicator}>
                <Ionicons name="cloud-offline" size={16} color={COLORS.warning} />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.headerAction} onPress={navigateToAddFarm}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your farms...</Text>
          </View>
        )}

        {/* Main Content */}
        {!loading && (
          <>
            {/* Stats Cards */}
            {renderStatsCard()}

            {/* Farm Overview */}
            {filteredFarms.map(farm => renderFarmCard(farm))}

            {/* Search and Filters */}
            {farms.length > 0 && renderSearchAndFilters()}

            {/* Empty State */}
            {farms.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="leaf-outline" size={80} color={COLORS.text.secondary} />
                <Text style={styles.emptyStateTitle}>No Farms Yet</Text>
                <Text style={styles.emptyStateMessage}>
                  Start your agricultural journey by adding your first farm
                </Text>
                <TouchableOpacity style={styles.primaryButton} onPress={navigateToAddFarm}>
                  <Ionicons name="add" size={20} color={COLORS.background} />
                  <Text style={styles.primaryButtonText}>Add Your First Farm</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Farm Cards */
              <View style={styles.farmsContainer}>
                {filteredFarms.map(farm => renderFarmCard(farm))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default CropManagementScreen;
