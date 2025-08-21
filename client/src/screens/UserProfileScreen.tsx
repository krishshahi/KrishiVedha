import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import apiService from '../services/apiService';
import { COLORS } from '../constants/colors';

interface UserProfileProps {
  userId?: string;
  userName?: string;
}

const UserProfileScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  // Get params from navigation
  const { userId, userName } = route.params as UserProfileProps || {};
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    joinedDate: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  
  const isOwnProfile = currentUser?.id === userId;
  
  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      // Fetch user details
      const userData = await apiService.getUserById(userId);
      setUserProfile(userData);
      
      // Fetch user's posts
      const posts = await apiService.getCommunityPosts({
        userId: userId,
        limit: 20,
        page: 1,
      });
      setUserPosts(posts || []);
      
      // Calculate stats
      let totalLikes = 0;
      let totalComments = 0;
      
      if (posts && Array.isArray(posts)) {
        posts.forEach(post => {
          totalLikes += post.likeCount || post.likes?.length || 0;
          totalComments += post.commentCount || post.comments?.length || 0;
        });
      }
      
      setUserStats({
        totalPosts: posts?.length || 0,
        totalLikes,
        totalComments,
        joinedDate: userData.createdAt || '',
      });
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUserProfile();
  }, [userId]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorTitle}>User Not Found</Text>
        <Text style={styles.errorMessage}>
          The user you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {isOwnProfile && (
          <TouchableOpacity style={styles.headerEditButton}>
            <Text style={styles.headerEditIcon}>✏️</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {userProfile.profilePicture ? (
            <Image 
              source={{ uri: apiService.getImageUrl(userProfile.profilePicture) }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {(userProfile.name || userName || 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.userName}>
          {userProfile.name || userName || 'Anonymous User'}
        </Text>
        
        {userProfile.email && (
          <Text style={styles.userEmail}>{userProfile.email}</Text>
        )}
        
        {userProfile.location && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{userProfile.location}</Text>
          </View>
        )}
        
        <Text style={styles.joinedDate}>
          Joined {formatDate(userStats.joinedDate)}
        </Text>
      </View>
      
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userStats.totalPosts}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userStats.totalLikes}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userStats.totalComments}</Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}
        >
          <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
            About
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      {activeTab === 'posts' ? (
        <View style={styles.postsContainer}>
          {userPosts.length > 0 ? (
            userPosts.map((post: any) => (
              <View key={post._id} style={styles.postCard}>
                <Text style={styles.postContent} numberOfLines={3}>
                  {post.content}
                </Text>
                
                {post.images && post.images.length > 0 && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.postImagesContainer}
                  >
                    {post.images.slice(0, 3).map((image: any, index: number) => (
                      <Image 
                        key={index}
                        source={{ uri: apiService.getImageUrl(image.url) }}
                        style={styles.postImage}
                      />
                    ))}
                    {post.images.length > 3 && (
                      <View style={styles.moreImagesOverlay}>
                        <Text style={styles.moreImagesText}>+{post.images.length - 3}</Text>
                      </View>
                    )}
                  </ScrollView>
                )}
                
                <View style={styles.postFooter}>
                  <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
                  <View style={styles.postStats}>
                    <Text style={styles.postStat}>
                      ❤️ {post.likeCount || post.likes?.length || 0}
                    </Text>
                    <Text style={styles.postStat}>
                      💬 {post.commentCount || post.comments?.length || 0}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateText}>
                {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.aboutContainer}>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Email</Text>
            <Text style={styles.aboutValue}>{userProfile.email || 'Not provided'}</Text>
          </View>
          
          {userProfile.phone && (
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Phone</Text>
              <Text style={styles.aboutValue}>{userProfile.phone}</Text>
            </View>
          )}
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Location</Text>
            <Text style={styles.aboutValue}>{userProfile.location || 'Not provided'}</Text>
          </View>
          
          {userProfile.farmCount !== undefined && (
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Farms</Text>
              <Text style={styles.aboutValue}>{userProfile.farmCount} farms</Text>
            </View>
          )}
          
          {userProfile.totalArea !== undefined && (
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Total Area</Text>
              <Text style={styles.aboutValue}>{userProfile.totalArea} hectares</Text>
            </View>
          )}
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Member Since</Text>
            <Text style={styles.aboutValue}>{formatDate(userProfile.createdAt)}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background.primary,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBackButton: {
    padding: 8,
  },
  headerBackIcon: {
    fontSize: 24,
    color: COLORS.text.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  headerEditButton: {
    padding: 8,
  },
  headerEditIcon: {
    fontSize: 20,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  joinedDate: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  postsContainer: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postContent: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  postImagesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  postImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  moreImagesOverlay: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  postStat: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  aboutContainer: {
    padding: 16,
  },
  aboutItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  aboutLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  aboutValue: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
};

export default UserProfileScreen;
