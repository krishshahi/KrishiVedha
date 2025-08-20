import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  fetchDashboardData,
  refreshDashboardData,
  clearError,
} from '../store/slices/dashboardSlice';
import { syncUserData, logoutUser } from '../store/slices/authSlice';

const DashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
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

  // Load dashboard data on component mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(fetchDashboardData(user.id));
    }
  }, [isAuthenticated, user?.id, dispatch]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    if (user?.id) {
      dispatch(refreshDashboardData(user.id));
      dispatch(syncUserData()); // Also sync user data
    }
  }, [user?.id, dispatch]);

  // Handle error clearing
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Error',
        error,
        [
          { text: 'Dismiss', onPress: handleClearError },
          { text: 'Retry', onPress: onRefresh },
        ],
        { cancelable: true, onDismiss: handleClearError }
      );
    }
  }, [error, handleClearError, onRefresh]);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to view dashboard</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
        {lastUpdated && (
          <Text style={styles.lastUpdatedText}>
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* User Statistics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Farm Statistics</Text>
        {userStats ? (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.farmCount}</Text>
              <Text style={styles.statLabel}>Farms</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.totalArea.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Total Area (ha)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.cropTypes.length}</Text>
              <Text style={styles.statLabel}>Crop Types</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.loadingText}>
            {isLoading ? 'Loading statistics...' : 'No statistics available'}
          </Text>
        )}
      </View>

      {/* Recent Farms */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Farms</Text>
        {recentFarms.length > 0 ? (
          recentFarms.map((farm, index) => (
            <TouchableOpacity key={farm.id || index} style={styles.farmItem}>
              <Text style={styles.farmName}>{farm.name}</Text>
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
          <Text style={styles.emptyText}>
            {isLoading ? 'Loading farms...' : 'No farms found'}
          </Text>
        )}
      </View>

      {/* Weather Information */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weather Update</Text>
        {weatherData.length > 0 ? (
          <View style={styles.weatherContainer}>
            <Text style={styles.weatherText}>
              Latest weather data available ({weatherData.length} entries)
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>
            {isLoading ? 'Loading weather...' : 'No weather data available'}
          </Text>
        )}
      </View>

      {/* Community Posts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Community Updates</Text>
        {communityPosts.length > 0 ? (
          communityPosts.slice(0, 3).map((post, index) => (
            <TouchableOpacity key={post._id || index} style={styles.postItem}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postMeta}>
                By {post.author?.username || 'Unknown'} • {post.category}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>
            {isLoading ? 'Loading posts...' : 'No community posts available'}
          </Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>Add Farm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>View Weather</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>Community</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#4CAF50',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  lastUpdatedText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  farmItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  farmName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  farmDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  farmCrops: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  weatherContainer: {
    padding: 10,
  },
  weatherText: {
    fontSize: 14,
    color: '#333',
  },
  postItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  postTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  postMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    margin: 5,
  },
  actionText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    padding: 20,
  },
});

export default DashboardScreen;

