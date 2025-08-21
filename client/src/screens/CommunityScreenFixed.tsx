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
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import { COLORS } from '../constants/colors';
import apiService from '../services/apiService';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';

const { width: screenWidth } = Dimensions.get('window');

// Define styles directly in the component
const statusBarHeight = Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 15 : statusBarHeight + 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  
  // Floating Action Button
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary || '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 999,
  },
  
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#333',
  },
  
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary || '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  searchButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  
  activeTab: {
    borderBottomColor: COLORS.primary || '#4CAF50',
  },
  
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  
  activeTabText: {
    color: COLORS.primary || '#4CAF50',
    fontWeight: '600',
  },
  
  // Category Filter
  categoryContainer: {
    backgroundColor: '#fff',
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 12,
  },
  
  categoryFilter: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  categoryFilterActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
    borderWidth: 1.5,
  },
  
  categoryText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    lineHeight: 14,
    textAlignVertical: 'center',
  },
  
  categoryTextActive: {
    color: '#1b5e20',
    fontWeight: '700',
  },
  
  // Post Card
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 2,
    marginBottom: 6,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // Posts list container
  postsListContainer: {
    flex: 1,
    paddingTop: 0,
  },
  
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  
  avatarText: {
    fontSize: 20,
  },
  
  postHeaderInfo: {
    flex: 1,
  },
  
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  postTime: {
    fontSize: 12,
    color: '#999',
  },
  
  postCategory: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  
  postContent: {
    fontSize: 14,
    lineHeight: 21,
    color: '#333',
    marginBottom: 12,
  },
  
  // Post Images
  postImagesContainer: {
    marginVertical: 12,
    marginHorizontal: -4,
  },
  
  postImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
  },
  
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  
  tagChip: {
    backgroundColor: `${COLORS.primary}15` || '#4CAF5015',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 6,
  },
  
  tagText: {
    fontSize: 12,
    color: COLORS.primary || '#4CAF50',
    fontWeight: '500',
  },
  
  // Post Actions
  postActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  
  actionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  
  actionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 30,
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  modalClose: {
    fontSize: 24,
    color: '#999',
    padding: 4,
  },
  
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  
  submitButton: {
    backgroundColor: COLORS.primary || '#4CAF50',
    marginLeft: 8,
  },
  
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Form Elements
  textInput: {
    minHeight: 120,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  
  tagInput: {
    height: 40,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  
  // Image Upload
  imageUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  uploadIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  
  uploadText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  
  imageCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  
  imagePreviewContainer: {
    marginVertical: 12,
  },
  
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

// Interfaces remain the same
interface ApiPost {
  _id: string;
  author: {
    _id: string;
    email?: string;
    username?: string;
    name?: string;
    profilePicture?: string;
  };
  content: string;
  category: string;
  tags: string[];
  visibility: string;
  images?: Array<{ url: string; publicId?: string }>;
  likes: Array<{ user: string; _id: string }>;
  comments: Array<{
    _id: string;
    author: { _id: string; username?: string; name?: string };
    content: string;
    createdAt: string;
    likes?: string[];
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
    avatar?: string;
  };
  content: string;
  category: string;
  tags: string[];
  images?: string[];
  timestamp: Date;
  likes: number;
  comments: Comment[];
  commentsCount: number;
  isLiked: boolean;
  viewCount: number;
}

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
  };
  content: string;
  timestamp: Date;
  likes: number;
}

const CommunityScreenFixed: React.FC = () => {
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
  const [postImages, setPostImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const categories = ['All', 'Tips', 'Questions', 'Success Stories', 'Problems', 'General'];

  // Convert API post to local Post format
  const convertApiPostToPost = (apiPost: ApiPost): Post => {
    const comments: Comment[] = apiPost.comments?.map(comment => ({
      id: comment._id,
      author: {
        id: comment.author._id,
        name: comment.author.username || comment.author.name || 'Anonymous',
      },
      content: comment.content,
      timestamp: new Date(comment.createdAt),
      likes: comment.likes?.length || 0,
    })) || [];

    return {
      id: apiPost._id,
      author: {
        id: apiPost.author._id,
        name: apiPost.author.username || apiPost.author.name || apiPost.author.email?.split('@')[0] || 'Anonymous',
        avatar: apiPost.author.profilePicture,
      },
      content: apiPost.content,
      category: apiPost.category,
      tags: apiPost.tags || [],
      images: apiPost.images?.map(img => img.url) || [],
      timestamp: new Date(apiPost.createdAt),
      likes: apiPost.likeCount || apiPost.likes?.length || 0,
      comments: comments,
      commentsCount: comments.length,
      isLiked: apiPost.isLiked || false,
      viewCount: apiPost.viewCount || 0,
    };
  };

  // Pick image from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setPostImages([...postImages, ...newImages].slice(0, 5));
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPostImages([...postImages, result.assets[0].uri].slice(0, 5));
    }
  };

  // Remove image from selection
  const removeImage = (index: number) => {
    setPostImages(postImages.filter((_, i) => i !== index));
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
    
    try {
      setUploadingImages(true);
      
      const tags = postTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Upload images if any
      const uploadedImages = [];
      if (postImages.length > 0) {
        for (const imageUri of postImages) {
          try {
            // For now, we'll pass the local URIs
            // In production, you'd upload to a server here
            uploadedImages.push({ url: imageUri });
          } catch (err) {
            console.error('Error uploading image:', err);
          }
        }
      }
      
      const postData = {
        content: postContent.trim(),
        category: postCategory,
        tags,
        visibility: 'public',
        images: uploadedImages,
      };
      
      const response = await apiService.createCommunityPost(postData);
      
      if (response) {
        Alert.alert('Success', 'Post created successfully!');
        setShowCreateModal(false);
        setPostContent('');
        setPostTags('');
        setPostCategory('General');
        setPostImages([]);
        
        if (activeTab === 'feed') {
          await fetchPosts(1, selectedCategory);
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

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
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.avatar}>
          {post.author.avatar ? (
            <Image source={{ uri: post.author.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>👤</Text>
          )}
        </TouchableOpacity>
        <View style={styles.postHeaderInfo}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <View style={styles.postMeta}>
            <Text style={styles.postTime}>{formatTimeAgo(post.timestamp)}</Text>
            {post.category && (
              <Text style={styles.postCategory}>• {post.category}</Text>
            )}
          </View>
        </View>
      </View>
      
      <Text style={styles.postContent}>{post.content}</Text>
      
      {post.images && post.images.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.postImagesContainer}
        >
          {post.images.map((imageUrl, index) => (
            <Image 
              key={index} 
              source={{ uri: imageUrl }} 
              style={styles.postImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}
      
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
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
          <Text style={[styles.actionIcon, { color: post.isLiked ? '#e74c3c' : '#666' }]}>
            {post.isLiked ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionText}>{post.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // Navigate to post detail for comments
            navigation.navigate('PostDetail' as never, { 
              postId: post.id,
              postData: post 
            } as never);
          }}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={async () => {
            try {
              const shareContent = {
                message: `Check out this post: ${post.content.substring(0, 100)}...`,
              };
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync('', shareContent);
              } else {
                Alert.alert('Sharing not available', 'Sharing is not available on this device');
              }
            } catch (error) {
              console.error('Error sharing:', error);
            }
          }}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        
        <View style={styles.actionButton}>
          <Text style={styles.actionIcon}>👁️</Text>
          <Text style={styles.actionText}>{post.viewCount}</Text>
        </View>
      </View>
    </View>
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
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.textInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#999"
                value={postContent}
                onChangeText={setPostContent}
                multiline
                numberOfLines={5}
              />
              
              {postImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
                  {postImages.map((imageUri, index) => (
                    <View key={index} style={styles.imagePreviewWrapper}>
                      <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Text style={styles.removeImageText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              
              <View style={styles.imageUploadContainer}>
                <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage}>
                  <Text style={styles.uploadIcon}>🖼️</Text>
                  <Text style={styles.uploadText}>Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.imageUploadButton} onPress={takePhoto}>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadText}>Camera</Text>
                </TouchableOpacity>
                
                <Text style={styles.imageCount}>{postImages.length}/5</Text>
              </View>
              
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.filter(c => c !== 'All').map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryFilter,
                      postCategory === category && styles.categoryFilterActive
                    ]}
                    onPress={() => setPostCategory(category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      postCategory === category && styles.categoryTextActive
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.inputLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.tagInput}
                placeholder="e.g., organic, tomatoes, tips"
                placeholderTextColor="#999"
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
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleCreatePost}
                disabled={uploadingImages || !postContent.trim()}
              >
                {uploadingImages ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
        </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>
      
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
      
      {activeTab === 'feed' && (
        <View style={styles.categoryContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center' }}
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
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.postsListContainer}>
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
            contentContainerStyle={{ paddingTop: 2, paddingBottom: 80 }}
            style={{ backgroundColor: '#f5f5f5' }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyTitle}>No Posts Yet</Text>
                <Text style={styles.emptyMessage}>
                  {activeTab === 'myPosts' 
                    ? "You haven't created any posts yet."
                    : "Be the first to share something with the community!"}
                </Text>
              </View>
            }
          />
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      
        {renderCreatePostModal()}
      </View>
    </SafeAreaView>
  );
};

export default CommunityScreenFixed;
