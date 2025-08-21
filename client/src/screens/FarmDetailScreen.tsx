import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import apiService from '../services/apiService';
import { useAppSelector } from '../store/hooks';

interface Crop {
  id: string;
  name: string;
  variety: string;
  plantingDate: string;
  status: string;
  area: number;
}

interface FarmDetails {
  id: string;
  name: string;
  location: string;
  size: number;
  crops: Crop[];
  createdAt: string;
}

const FarmDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { farmId, farmData } = route.params as { farmId: string; farmData?: any };
  
  const [farm, setFarm] = useState<FarmDetails | null>(null);
  const [farmCrops, setFarmCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAppSelector((state) => state.auth);

  // Fetch crops for the farm
  const fetchFarmCrops = async (farmName?: string) => {
    try {
      console.log('Fetching crops for farm:', farmId, 'Farm name:', farmName || farm?.name);
      const cropsResponse = await apiService.getCrops();
      
      if (cropsResponse && Array.isArray(cropsResponse)) {
        console.log('Total crops from API:', cropsResponse.length);
        console.log('Sample crop:', cropsResponse[0]);
        
        // Filter crops that belong to this farm
        const farmSpecificCrops = cropsResponse
          .filter((crop: any) => {
            // Debug: log each crop's farm field
            if (crop.farm || crop.farmId || crop.farmName) {
              console.log('Crop farm field:', crop.farm || crop.farmId || crop.farmName, 'Looking for:', farmId);
            }
            
            // Check if crop belongs to this farm by various possible field names
            const belongsToFarm = crop.farmId === farmId || 
                   crop.farm === farmId || 
                   crop.farm?._id === farmId ||
                   crop.farmName === (farmName || farm?.name) ||
                   (crop.farm && typeof crop.farm === 'object' && crop.farm.name === (farmName || farm?.name));
            
            if (belongsToFarm) {
              console.log('Found matching crop:', crop.name || crop.cropName);
            }
            
            return belongsToFarm;
          })
          .map((crop: any) => ({
            id: crop._id || crop.id,
            name: crop.name || crop.cropName || 'Unknown Crop',
            variety: crop.variety || '',
            plantingDate: crop.plantingDate || crop.datePlanted || '',
            status: crop.status || 'Active',
            area: typeof crop.area === 'object' ? crop.area.value : (crop.area || 0),
          }));
        
        console.log(`Found ${farmSpecificCrops.length} crops for farm ${farmId}`);
        setFarmCrops(farmSpecificCrops);
        
        // Update farm with crops
        setFarm(prevFarm => prevFarm ? { ...prevFarm, crops: farmSpecificCrops } : prevFarm);
      }
    } catch (error) {
      console.error('Error fetching farm crops:', error);
    }
  };

  useEffect(() => {
    if (farmData) {
      // Use passed farm data
      const farmDetails: FarmDetails = {
        id: farmData.id || farmId,
        name: farmData.name || 'Unnamed Farm',
        location: typeof farmData.location === 'object' 
          ? `${farmData.location.district || ''}, ${farmData.location.province || ''}, ${farmData.location.country || ''}`.replace(/^, |, $/, '')
          : farmData.location || 'Unknown Location',
        size: farmData.size || 0,
        crops: [],  // Will be populated separately
        createdAt: farmData.createdAt || new Date().toISOString(),
      };
      setFarm(farmDetails);
      setIsLoading(false);
      // Fetch crops after setting farm data, passing farm name
      fetchFarmCrops(farmDetails.name);
    } else {
      fetchFarmDetails();
    }
  }, [farmId, farmData]);

  const fetchFarmDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch farm details from API
      const response = await apiService.getFarms();
      
      if (response && Array.isArray(response)) {
        const farmDetail = response.find((f: any) => f._id === farmId);
        
        if (farmDetail) {
          const farmDetails: FarmDetails = {
            id: farmDetail._id,
            name: farmDetail.name || 'Unnamed Farm',
            location: farmDetail.location || 'Unknown Location',
            size: farmDetail.size || farmDetail.area || 0,
            crops: farmDetail.crops?.map((crop: any) => ({
              id: crop._id || crop.id,
              name: crop.name || crop.cropName || 'Unknown Crop',
              variety: crop.variety || '',
              plantingDate: crop.plantingDate || crop.datePlanted || '',
              status: crop.status || 'Active',
              area: typeof crop.area === 'object' ? crop.area.value : (crop.area || 0),
            })) || [],
            createdAt: farmDetail.createdAt || new Date().toISOString(),
          };
          
          setFarm(farmDetails);
          // Also fetch crops after setting farm, passing farm name
          fetchFarmCrops(farmDetails.name);
        } else {
          // Create a placeholder farm if not found
          const placeholderFarm: FarmDetails = {
            id: farmId,
            name: 'Farm Details',
            location: 'Location not available',
            size: 0,
            crops: [],
            createdAt: new Date().toISOString(),
          };
          setFarm(placeholderFarm);
          console.log('Farm not found in response, using placeholder');
          // Still try to fetch crops even if farm not found
          fetchFarmCrops();
        }
      }
    } catch (error) {
      console.error('Error fetching farm details:', error);
      Alert.alert('Error', 'Failed to load farm details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFarmDetails();
    setRefreshing(false);
  };

  const navigateToCropDetail = (crop: Crop) => {
    navigation.navigate('Crops', {
      screen: 'CropDetail',
      params: { cropId: crop.id, cropData: crop },
    });
  };

  const navigateToAddCrop = () => {
    navigation.navigate('Crops', {
      screen: 'AddCrop',
      params: { farmId: farm?.id },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading farm details...</Text>
      </View>
    );
  }

  if (!farm) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Farm not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFarmDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header with Back Button */}
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            // Navigate to the Crops tab, specifically to the CropsMain screen
            navigation.navigate('Crops', {
              screen: 'CropsMain'
            });
          }}
        >
          <Text style={styles.backButtonText}>← Crops</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farm Details</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.headerCard}>
        <Text style={styles.farmName}>{farm.name}</Text>
        <View style={styles.farmInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Location:</Text>
            <Text style={styles.infoValue}>{farm.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📏 Size:</Text>
            <Text style={styles.infoValue}>{farm.size} acres</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🌱 Total Crops:</Text>
            <Text style={styles.infoValue}>{farm.crops.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Crops</Text>
          <TouchableOpacity style={styles.addButton} onPress={navigateToAddCrop}>
            <Text style={styles.addButtonText}>+ Add Crop</Text>
          </TouchableOpacity>
        </View>

        {farm.crops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌾</Text>
            <Text style={styles.emptyTitle}>No Crops Yet</Text>
            <Text style={styles.emptyMessage}>
              Start by adding your first crop to this farm
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={navigateToAddCrop}>
              <Text style={styles.primaryButtonText}>Add First Crop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cropsGrid}>
            {farm.crops.map((crop) => (
              <TouchableOpacity
                key={crop.id}
                style={styles.cropCard}
                onPress={() => navigateToCropDetail(crop)}
              >
                <Text style={styles.cropIcon}>🌱</Text>
                <Text style={styles.cropName}>{crop.name}</Text>
                {crop.variety && (
                  <Text style={styles.cropVariety}>{crop.variety}</Text>
                )}
                <View style={styles.cropStatus}>
                  <View style={[styles.statusDot, { backgroundColor: crop.status === 'Active' ? '#4CAF50' : '#FFC107' }]} />
                  <Text style={styles.statusText}>{crop.status}</Text>
                </View>
                <Text style={styles.cropArea}>{crop.area} acres</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary || '#4CAF50',
    paddingTop: 44, // Account for status bar
    paddingBottom: 12,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 60, // Same width as back button for centering
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary || '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  farmName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  farmInfo: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: COLORS.primary || '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary || '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cropsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  cropCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 15,
    margin: '1%',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cropIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cropVariety: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  cropStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  cropArea: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default FarmDetailScreen;
