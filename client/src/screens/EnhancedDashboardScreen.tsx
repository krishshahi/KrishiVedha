import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  fetchDashboardData,
  refreshDashboardData,
  clearError,
} from '../store/slices/dashboardSlice';
import { syncUserData } from '../store/slices/authSlice';
import { 
  performFullSync,
  selectIsOnline,
  selectIsSyncing,
  selectSyncNeeded,
  selectPendingChanges,
  selectLastSyncTime,
  selectSyncError,
} from '../store/slices/syncSlice';
import {
  selectUnreadCount,
  selectNotificationPermission,
} from '../store/slices/notificationSlice';

// Phase 2 Components
import OfflineIndicator from '../components/OfflineIndicator';
import SyncStatus from '../components/SyncStatus';
import ErrorBoundary from '../components/ErrorBoundary';

// Services
import { offlineService } from '../services/offlineService';
import { errorHandlingService } from '../services/errorHandlingService';

const { width } = Dimensions.get('window');

const EnhancedDashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Existing selectors
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const {
    userStats,
    recentFarms,
    weatherData,
    communityPosts,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
  } = useAppSelector((state) => state.dashboard);

  // Phase 2 selectors
  const isOnline = useAppSelector(selectIsOnline);
  const isSyncing = useAppSelector(selectIsSyncing);
  const syncNeeded = useAppSelector(selectSyncNeeded);
  const pendingChanges = useAppSelector(selectPendingChanges);
  const lastSyncTime = useAppSelector(selectLastSyncTime);
  const syncError = useAppSelector(selectSyncError);
  const unreadNotifications = useAppSelector(selectUnreadCount);
  const notificationPermission = useAppSelector(selectNotificationPermission);

  // Local state
  const [showSyncStatus, setShowSyncStatus] = useState(false);
  const [offlineData, setOfflineData] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));

  // Load dashboard data with offline support
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadDashboardData();
    }
  }, [isAuthenticated, user?.id]);

  // Monitor health status
  useEffect(() => {
    const determineHealthStatus = () => {
      if (syncError || (!isOnline && !offlineData)) {
        return 'error';
      }
      if (!isOnline || syncNeeded || pendingChanges > 0) {
        return 'warning';
      }
      return 'healthy';
    };

    setHealthStatus(determineHealthStatus());
  }, [isOnline, syncError, syncNeeded, pendingChanges, offlineData]);

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (isOnline) {
        // Load from server
        dispatch(fetchDashboardData(user!.id));
      } else {
        // Load from offline storage
        const cachedData = await offlineService.getOfflineData('dashboard');
        if (cachedData) {
          setOfflineData(cachedData);
        }
      }
    } catch (error) {
      await errorHandlingService.handleError(error, {
        action: 'load_dashboard',
        screen: 'dashboard',
        timestamp: new Date(),
      });
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      if (isOnline) {
        // Online refresh with sync
        dispatch(refreshDashboardData(user!.id));
        dispatch(syncUserData());
        dispatch(performFullSync() as any);
      } else {
        // Offline refresh - just reload cached data
        await loadDashboardData();
      }
    } catch (error) {
      await errorHandlingService.handleError(error, {
        action: 'refresh_dashboard',
        screen: 'dashboard',
        timestamp: new Date(),
      });
    }
  }, [user?.id, isOnline]);

  const handleSyncPress = () => {
    if (isOnline && !isSyncing) {
      dispatch(performFullSync() as any);
    }
  };

  const handleOfflinePress = () => {
    setShowSyncStatus(true);
  };

  const getDataSource = () => {
    if (isOnline) {
      return { data: { userStats, recentFarms, weatherData, communityPosts }, isOffline: false };
    } else {
      return { data: offlineData || { userStats: null, recentFarms: [], weatherData: [], communityPosts: [] }, isOffline: true };
    }
  };

  const { data, isOffline } = getDataSource();

  const renderStatusIndicator = () => {
    const statusConfig = {
      healthy: { icon: 'check-circle', color: '#4CAF50', text: 'All systems operational' },
      warning: { icon: 'alert-circle', color: '#FF9500', text: isOffline ? 'Working offline' : 'Sync pending' },
      error: { icon: 'close-circle', color: '#FF6B6B', text: syncError || 'Connection issues' },
    };

    const config = statusConfig[healthStatus];

    return (
      <TouchableOpacity 
        style={[styles.statusIndicator, { backgroundColor: `${config.color}15` }]}
        onPress={() => setShowSyncStatus(true)}
      >
        <Icon name={config.icon} size={16} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.text}
        </Text>
        <Icon name="chevron-right" size={16} color={config.color} />
      </TouchableOpacity>
    );
  };

  const renderSyncInfo = () => {
    if (!lastSyncTime && !isOffline) return null;

    const lastSync = lastSyncTime ? new Date(lastSyncTime) : null;
    const timeSinceSync = lastSync ? Date.now() - lastSync.getTime() : 0;
    const minutesSinceSync = Math.floor(timeSinceSync / (1000 * 60));

    return (
      <View style={styles.syncInfo}>
        <Icon name="sync" size={14} color="#666" />
        <Text style={styles.syncText}>
          {isOffline 
            ? `Offline mode • ${pendingChanges} pending changes`
            : minutesSinceSync < 1 
              ? 'Synced just now' 
              : `Synced ${minutesSinceSync}m ago`}
        </Text>
      </View>
    );
  };

  const renderNotificationBadge = () => {
    if (unreadNotifications === 0) return null;

    return (
      <View style={styles.notificationBadge}>
        <Icon name="bell" size={18} color="#4ECDC4" />
        {unreadNotifications > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEnhancedCard = (title: string, children: React.ReactNode, actions?: React.ReactNode) => {
    const translateY = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    return (
      <Animated.View 
        style={[
          styles.card, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY }],
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          {actions}
        </View>
        {children}
      </Animated.View>
    );
  };

  const renderOfflineWarning = () => {
    if (isOnline) return null;

    return (
      <View style={styles.offlineWarning}>
        <Icon name="wifi-off" size={20} color="#FF9500" />
        <View style={styles.offlineTextContainer}>
          <Text style={styles.offlineTitle}>You're offline</Text>
          <Text style={styles.offlineSubtitle}>
            Showing cached data • Changes will sync when reconnected
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.offlineAction}
          onPress={handleOfflinePress}
        >
          <Text style={styles.offlineActionText}>View Status</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <View style={styles.container}>
          <Text style={styles.errorText}>Please log in to view dashboard</Text>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Offline Indicator - always show in offline mode or when there are sync issues */}
        <OfflineIndicator 
          position="top" 
          showWhenOnline={syncNeeded || syncError !== null}
          compact={false}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing || isSyncing} 
              onRefresh={onRefresh}
              colors={['#4ECDC4']}
              tintColor="#4ECDC4"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
                {renderSyncInfo()}
              </View>
              {renderNotificationBadge()}
            </View>
            
            {renderStatusIndicator()}
            {renderOfflineWarning()}
          </Animated.View>

          {/* Enhanced User Statistics */}
          {renderEnhancedCard(
            'Farm Statistics',
            data.userStats ? (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Icon name="barn" size={24} color="#4ECDC4" />
                  </View>
                  <Text style={styles.statNumber}>{data.userStats.farmCount}</Text>
                  <Text style={styles.statLabel}>Farms</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Icon name="map" size={24} color="#4ECDC4" />
                  </View>
                  <Text style={styles.statNumber}>{data.userStats.totalArea.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Total Area (ha)</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Icon name="sprout" size={24} color="#4ECDC4" />
                  </View>
                  <Text style={styles.statNumber}>{data.userStats.cropTypes.length}</Text>
                  <Text style={styles.statLabel}>Crop Types</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="chart-line" size={48} color="#E0E0E0" />
                <Text style={styles.emptyText}>
                  {isLoading || isSyncing ? 'Loading statistics...' : 'No statistics available'}
                </Text>
                {!isOnline && (
                  <Text style={styles.offlineHint}>Data will update when reconnected</Text>
                )}
              </View>
            ),
            isOffline && (
              <TouchableOpacity onPress={handleSyncPress} style={styles.cardAction}>
                <Icon name="sync" size={16} color="#4ECDC4" />
              </TouchableOpacity>
            )
          )}

          {/* Enhanced Recent Farms */}
          {renderEnhancedCard(
            'Recent Farms',
            data.recentFarms.length > 0 ? (
              data.recentFarms.map((farm: any, index: number) => (
                <TouchableOpacity key={farm.id || index} style={styles.farmItem}>
                  <View style={styles.farmHeader}>
                    <Icon name="barn" size={20} color="#4ECDC4" />
                    <Text style={styles.farmName}>{farm.name}</Text>
                    {isOffline && <Icon name="wifi-off" size={14} color="#FF9500" />}
                  </View>
                  <Text style={styles.farmDetails}>
                    {farm.location} • {farm.area} ha
                  </Text>
                  {farm.crops && farm.crops.length > 0 && (
                    <Text style={styles.farmCrops}>
                      Crops: {farm.crops.join(', ')}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="barn" size={48} color="#E0E0E0" />
                <Text style={styles.emptyText}>
                  {isLoading || isSyncing ? 'Loading farms...' : 'No farms found'}
                </Text>
              </View>
            )
          )}

          {/* Enhanced Weather Information */}
          {renderEnhancedCard(
            'Weather Update',
            data.weatherData.length > 0 ? (
              <View style={styles.weatherContainer}>
                <Icon name="weather-partly-cloudy" size={32} color="#4ECDC4" />
                <Text style={styles.weatherText}>
                  Latest weather data available ({data.weatherData.length} entries)
                </Text>
                {isOffline && (
                  <Text style={styles.offlineHint}>Cached weather data</Text>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="weather-cloudy" size={48} color="#E0E0E0" />
                <Text style={styles.emptyText}>
                  {isLoading || isSyncing ? 'Loading weather...' : 'No weather data available'}
                </Text>
              </View>
            )
          )}

          {/* Enhanced Community Posts */}
          {renderEnhancedCard(
            'Community Updates',
            data.communityPosts.length > 0 ? (
              data.communityPosts.slice(0, 3).map((post: any, index: number) => (
                <TouchableOpacity key={post._id || index} style={styles.postItem}>
                  <View style={styles.postHeader}>
                    <Icon name="account-group" size={16} color="#4ECDC4" />
                    <Text style={styles.postTitle} numberOfLines={1}>{post.title}</Text>
                  </View>
                  <Text style={styles.postMeta}>
                    By {post.author?.username || 'Unknown'} • {post.category}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="account-group" size={48} color="#E0E0E0" />
                <Text style={styles.emptyText}>
                  {isLoading || isSyncing ? 'Loading posts...' : 'No community posts available'}
                </Text>
              </View>
            )
          )}

          {/* Enhanced Quick Actions */}
          {renderEnhancedCard(
            'Quick Actions',
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="plus-circle" size={24} color="#4ECDC4" />
                <Text style={styles.actionText}>Add Farm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="weather-partly-cloudy" size={24} color="#4ECDC4" />
                <Text style={styles.actionText}>Weather</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="account-group" size={24} color="#4ECDC4" />
                <Text style={styles.actionText}>Community</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowSyncStatus(true)}
              >
                <Icon name="sync" size={24} color="#4ECDC4" />
                <Text style={styles.actionText}>Sync Status</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sync Status Section (if needed) */}
          {(syncNeeded || pendingChanges > 0) && (
            <Animated.View style={[styles.syncPrompt, { opacity: fadeAnim }]}>
              <Icon name="cloud-upload" size={20} color="#4ECDC4" />
              <Text style={styles.syncPromptText}>
                {pendingChanges} changes ready to sync
              </Text>
              <TouchableOpacity 
                style={styles.syncPromptButton}
                onPress={handleSyncPress}
                disabled={!isOnline || isSyncing}
              >
                <Text style={styles.syncPromptButtonText}>
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>

        {/* Sync Status Modal */}
        <Modal
          visible={showSyncStatus}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SyncStatus
            visible={showSyncStatus}
            onClose={() => setShowSyncStatus(false)}
          />
        </Modal>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: 6,
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  syncText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  notificationBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  offlineTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  offlineSubtitle: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 2,
  },
  offlineAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  offlineActionText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardAction: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F8F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  farmItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  farmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  farmDetails: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
    marginBottom: 2,
  },
  farmCrops: {
    fontSize: 12,
    color: '#4ECDC4',
    marginLeft: 28,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  postItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  postMeta: {
    fontSize: 12,
    color: '#666',
    marginLeft: 24,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 72) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  offlineHint: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 50,
  },
  syncPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F7',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  syncPromptText: {
    flex: 1,
    fontSize: 14,
    color: '#4ECDC4',
    marginLeft: 8,
  },
  syncPromptButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncPromptButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});

export default EnhancedDashboardScreen;
