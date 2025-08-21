import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import { communityScreenStyles as styles } from '../styles/CommunityScreen.styles';
import { COLORS } from '../constants/colors';
import apiService from '../services/apiService';

interface ApiPost {
  _id: string;
  author: {
    _id: string;
    email?: string;
    username?: string;
  };
  content: string;
  category: string;
  tags: string[];
  visibility: string;
  likes: Array<{ user: string }>;
  comments: Array<{
    _id: string;
    author: { _id: string; username?: string };
    content: string;
    createdAt: string;
  }>;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Post {
  id: string;
  author: {
    id: string;
    name: string;
  };
  content: string;
  category: string;
  tags: string[];
  timestamp: Date;
  likes: number;
  comments: number;
  isLiked: boolean;
  viewCount: number;
}

const CommunityScreenEnhanced: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'myPosts'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [postTags, setPostTags] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const categories = ['All', 'Tips', 'Questions', 'Success Stories', 'Problems', 'General'];

  // Convert API post to local Post format
  const convertApiPostToPost = (apiPost: ApiPost): Post => {
    return {
      id: apiPost._id,
      author: {
        id: apiPost.author._id,
        name: apiPost.author.username || apiPost.author.email?.split('@')[0] || 'Anonymous',
      },
      content: apiPost.content,
      category: apiPost.category,
      tags: apiPost.tags || [],
      timestamp: new Date(apiPost.createdAt),
      likes: apiPost.likeCount || apiPost.likes?.length || 0,
      comments: apiPost.commentCount || apiPost.comments?.length || 0,
      isLiked: apiPost.isLiked || false,
      viewCount: apiPost.viewCount || 0,
    };
  };

  // Fetch posts from API
  const fetchPosts = useCallback(async (page = 1, category?: string, search?: string) => {
    try {
      setIsLoading(true);
      
      const params: any = {
        limit: 10,
        page,
      };
      
      if (category && category !== 'All') {
        params.category = category;
      }
      
      if (search) {
        params.search = search;
      }
      
      const response = await apiService.getCommunityPosts(params);
      
      if (response && Array.isArray(response)) {
        const convertedPosts = response.map(convertApiPostToPost);
        
        if (page === 1) {
          setPosts(convertedPosts);
        } else {
          setPosts(prev => [...prev, ...convertedPosts]);
        }
        
        setHasMore(response.length === 10);
        return convertedPosts;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to fetch posts. Please try again.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch trending posts
  const fetchTrendingPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTrendingPosts(10);
      
      if (response && Array.isArray(response)) {
        const convertedPosts = response.map(convertApiPostToPost);
        setPosts(convertedPosts);
        return convertedPosts;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      Alert.alert('Error', 'Failed to fetch trending posts.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user's posts
  const fetchMyPosts = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login to view your posts.');
      return [];
    }
    
    try {
      setIsLoading(true);
      const response = await apiService.getCommunityPosts({
        userId: user.id,
        limit: 20,
        page: 1,
      });
      
      if (response && Array.isArray(response)) {
        const convertedPosts = response.map(convertApiPostToPost);
        setPosts(convertedPosts);
        return convertedPosts;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching my posts:', error);
      Alert.alert('Error', 'Failed to fetch your posts.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial load based on active tab
  useEffect(() => {
    if (activeTab === 'feed') {
      fetchPosts(1, selectedCategory);
    } else if (activeTab === 'trending') {
      fetchTrendingPosts();
    } else if (activeTab === 'myPosts') {
      fetchMyPosts();
    }
  }, [activeTab, selectedCategory]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    
    try {
      if (activeTab === 'feed') {
        await fetchPosts(1, selectedCategory, searchQuery);
      } else if (activeTab === 'trending') {
        await fetchTrendingPosts();
      } else if (activeTab === 'myPosts') {
        await fetchMyPosts();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, selectedCategory, searchQuery, fetchPosts, fetchTrendingPosts, fetchMyPosts]);

  // Handle like/unlike post
  const handleLikePost = async (postId: string, isCurrentlyLiked: boolean) => {
    try {
      if (isCurrentlyLiked) {
        await apiService.unlikeCommunityPost(postId);
      } else {
        await apiService.likeCommunityPost(postId);
      }
      
      // Update local state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: !isCurrentlyLiked,
                likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1,
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  // Handle create post
  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      Alert.alert('Error', 'Please enter post content.');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Error', 'Please login to create posts.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const tags = postTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const postData = {
        content: postContent.trim(),
        category: postCategory,
        tags,
        visibility: 'public',
      };
      
      const response = await apiService.createCommunityPost(postData);
      
      if (response) {
        Alert.alert('Success', 'Post created successfully!');
        setShowCreateModal(false);
        setPostContent('');
        setPostTags('');
        setPostCategory('General');
        
        // Refresh feed
        if (activeTab === 'feed') {
          await fetchPosts(1, selectedCategory);
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add comment
  const handleAddComment = async (postId: string) => {
    Alert.prompt(
      'Add Comment',
      'Enter your comment:',
      async (text) => {
        if (text && text.trim()) {
          try {
            await apiService.addPostComment(postId, text.trim());
            
            // Update local state
            setPosts(prevPosts =>
              prevPosts.map(post =>
                post.id === postId
                  ? { ...post, comments: post.comments + 1 }
                  : post
              )
            );
            
            Alert.alert('Success', 'Comment added successfully!');
          } catch (error) {
            console.error('Error adding comment:', error);
            Alert.alert('Error', 'Failed to add comment. Please try again.');
          }
        }
      }
    );
  };

  // Handle search
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim()) {
      setCurrentPage(1);
      await fetchPosts(1, selectedCategory, searchQuery);
    }
  }, [searchQuery, selectedCategory, fetchPosts]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (!isLoading && hasMore && activeTab === 'feed') {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await fetchPosts(nextPage, selectedCategory, searchQuery);
    }
  }, [isLoading, hasMore, currentPage, selectedCategory, searchQuery, activeTab, fetchPosts]);

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  // Render post item
  const renderPost = ({ item: post }: { item: Post }) => (
    <TouchableOpacity style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarPlaceholder}>👤</Text>
        </View>
        <View style={styles.postHeaderInfo}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.postTime}>{formatTimeAgo(post.timestamp)}</Text>
            {post.category && (
              <Text style={[styles.postTime, { marginLeft: 8 }]}>• {post.category}</Text>
            )}
          </View>
        </View>
      </View>
      
      <Text style={styles.postContent}>{post.content}</Text>
      
      {post.tags && post.tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {post.tags.map((tag, index) => (
            <View key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLikePost(post.id, post.isLiked)}
        >
          <Text style={[styles.actionIcon, { color: post.isLiked ? COLORS.primary : COLORS.text.primaryLight }]}>
            {post.isLiked ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionText}>{post.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleAddComment(post.id)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        
        <View style={styles.actionButton}>
          <Text style={styles.actionIcon}>👁️</Text>
          <Text style={styles.actionText}>{post.viewCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render create post modal
  const renderCreatePostModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.postContentInput}
                placeholder="What's on your mind?"
                placeholderTextColor={COLORS.text.primaryLight}
                value={postContent}
                onChangeText={setPostContent}
                multiline
                numberOfLines={5}
              />
              
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.filter(c => c !== 'All').map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      postCategory === category && styles.categoryChipActive
                    ]}
                    onPress={() => setPostCategory(category)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      postCategory === category && styles.categoryChipTextActive
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.inputLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.tagsInput}
                placeholder="e.g., organic, tomatoes, tips"
                placeholderTextColor={COLORS.text.primaryLight}
                value={postTags}
                onChangeText={setPostTags}
              />
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreatePost}
                disabled={isLoading || !postContent.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity 
          style={styles.createPostFloatingButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createPostFloatingButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
          placeholderTextColor={COLORS.text.primaryLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Feed
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trending' && styles.activeTab]}
          onPress={() => setActiveTab('trending')}
        >
          <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
            Trending 🔥
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myPosts' && styles.activeTab]}
          onPress={() => setActiveTab('myPosts')}
        >
          <Text style={[styles.tabText, activeTab === 'myPosts' && styles.activeTabText]}>
            My Posts
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Category Filter (only for feed) */}
      {activeTab === 'feed' && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilterContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryFilter,
                selectedCategory === category && styles.categoryFilterActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryFilterText,
                selectedCategory === category && styles.categoryFilterTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      {/* Posts List */}
      {isLoading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
              <Text style={styles.emptyStateMessage}>
                {activeTab === 'myPosts' 
                  ? "You haven't created any posts yet."
                  : "Be the first to share something with the community!"}
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoading && posts.length > 0 ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
        />
      )}
      
      {renderCreatePostModal()}
    </View>
  );
};

export default CommunityScreenEnhanced;
