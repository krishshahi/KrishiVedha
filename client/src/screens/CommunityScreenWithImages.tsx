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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import { communityScreenStyles as styles } from '../styles/CommunityScreenEnhanced.styles';
import { COLORS } from '../constants/colors';
import apiService from '../services/apiService';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';

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

const CommunityScreenWithImages: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'myPosts'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostDetailModal, setShowPostDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [postTags, setPostTags] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [commentText, setCommentText] = useState('');
  
  const categories = ['All', 'Tips', 'Questions', 'Success Stories', 'Problems', 'General'];

  // Request permissions for camera and gallery
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
        Alert.alert('Permission Needed', 'Camera and gallery permissions are required to upload images.');
      }
    })();
  }, []);

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
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setPostImages([...postImages, ...newImages].slice(0, 5)); // Max 5 images
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPostImages([...postImages, result.assets[0].uri].slice(0, 5));
    }
  };

  // Remove image from selection
  const removeImage = (index: number) => {
    setPostImages(postImages.filter((_, i) => i !== index));
  };

  // Upload images to server
  const uploadImages = async (images: string[]): Promise<string[]> => {
    if (images.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const imageUri of images) {
        const formData = new FormData();
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);
        
        const response = await apiService.uploadImage(formData);
        if (response?.data?.url) {
          uploadedUrls.push(response.data.url);
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      Alert.alert('Error', 'Failed to upload images. Please try again.');
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  // Share post externally
  const sharePost = async (post: Post) => {
    try {
      const shareContent = `${post.author.name} shared:\n\n${post.content}\n\n#KrishiVedha #Farming`;
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync('', {
          message: shareContent,
        });
      } else {
        Alert.alert('Share', shareContent);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
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

  // View post details
  const viewPostDetails = async (post: Post) => {
    try {
      // Fetch full post details with comments
      const fullPost = await apiService.getCommunityPostById(post.id);
      const convertedPost = convertApiPostToPost(fullPost);
      setSelectedPost(convertedPost);
      setShowPostDetailModal(true);
    } catch (error) {
      console.error('Error fetching post details:', error);
      Alert.alert('Error', 'Failed to load post details.');
    }
  };

  // View user profile
  const viewUserProfile = (userId: string, userName: string) => {
    // Navigate to user profile screen
    navigation.navigate('UserProfile', { userId, userName });
  };

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
      
      // Update selected post if viewing details
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => prev ? {
          ...prev,
          isLiked: !isCurrentlyLiked,
          likes: isCurrentlyLiked ? prev.likes - 1 : prev.likes + 1,
        } : null);
      }
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
      
      // Upload images first if any
      let imageUrls: string[] = [];
      if (postImages.length > 0) {
        imageUrls = await uploadImages(postImages);
      }
      
      const tags = postTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const postData = {
        content: postContent.trim(),
        category: postCategory,
        tags,
        visibility: 'public',
        images: imageUrls.map(url => ({ url })),
      };
      
      const response = await apiService.createCommunityPost(postData);
      
      if (response) {
        Alert.alert('Success', 'Post created successfully!');
        setShowCreateModal(false);
        setPostContent('');
        setPostTags('');
        setPostCategory('General');
        setPostImages([]);
        
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
    if (!commentText.trim()) return;
    
    try {
      await apiService.addPostComment(postId, commentText.trim());
      
      // Refresh post details
      const fullPost = await apiService.getCommunityPostById(postId);
      const convertedPost = convertApiPostToPost(fullPost);
      setSelectedPost(convertedPost);
      
      // Update posts list
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post
        )
      );
      
      setCommentText('');
      Alert.alert('Success', 'Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
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
    <TouchableOpacity style={styles.postCard} onPress={() => viewPostDetails(post)}>
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => viewUserProfile(post.author.id, post.author.name)}
        >
          {post.author.avatar ? (
            <Image source={{ uri: post.author.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarPlaceholder}>👤</Text>
          )}
        </TouchableOpacity>
        <View style={styles.postHeaderInfo}>
          <TouchableOpacity onPress={() => viewUserProfile(post.author.id, post.author.name)}>
            <Text style={styles.authorName}>{post.author.name}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.postTime}>{formatTimeAgo(post.timestamp)}</Text>
            {post.category && (
              <Text style={[styles.postTime, { marginLeft: 8 }]}>• {post.category}</Text>
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
              source={{ uri: apiService.getImageUrl(imageUrl) }}
              style={styles.postImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}
      
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
          onPress={() => viewPostDetails(post)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => sharePost(post)}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
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
              
              {/* Image Preview */}
              {postImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
                  {postImages.map((imageUri, index) => (
                    <View key={index} style={styles.imagePreviewWrapper}>
                      <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Text style={styles.removeImageButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              
              {/* Image Upload Buttons */}
              <View style={styles.imageUploadButtons}>
                <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage}>
                  <Text style={styles.imageUploadButtonIcon}>🖼️</Text>
                  <Text style={styles.imageUploadButtonText}>Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.imageUploadButton} onPress={takePhoto}>
                  <Text style={styles.imageUploadButtonIcon}>📷</Text>
                  <Text style={styles.imageUploadButtonText}>Camera</Text>
                </TouchableOpacity>
                
                <Text style={styles.imageCount}>{postImages.length}/5 images</Text>
              </View>
              
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
                disabled={isLoading || uploadingImages || !postContent.trim()}
              >
                {(isLoading || uploadingImages) ? (
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

  // Render post detail modal
  const renderPostDetailModal = () => (
    <Modal
      visible={showPostDetailModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowPostDetailModal(false)}
    >
      <View style={styles.postDetailContainer}>
        <View style={styles.postDetailHeader}>
          <TouchableOpacity onPress={() => setShowPostDetailModal(false)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.postDetailTitle}>Post Details</Text>
          <TouchableOpacity onPress={() => selectedPost && sharePost(selectedPost)}>
            <Text style={styles.shareButton}>Share</Text>
          </TouchableOpacity>
        </View>
        
        {selectedPost && (
          <ScrollView style={styles.postDetailContent}>
            {/* Post Content */}
            <View style={styles.postDetailPost}>
              <View style={styles.postHeader}>
                <TouchableOpacity 
                  style={styles.avatarContainer}
                  onPress={() => viewUserProfile(selectedPost.author.id, selectedPost.author.name)}
                >
                  {selectedPost.author.avatar ? (
                    <Image source={{ uri: selectedPost.author.avatar }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarPlaceholder}>👤</Text>
                  )}
                </TouchableOpacity>
                <View style={styles.postHeaderInfo}>
                  <Text style={styles.authorName}>{selectedPost.author.name}</Text>
                  <Text style={styles.postTime}>
                    {formatTimeAgo(selectedPost.timestamp)} • {selectedPost.category}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.postDetailContentText}>{selectedPost.content}</Text>
              
              {selectedPost.images && selectedPost.images.length > 0 && (
                <ScrollView 
                  horizontal 
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.postDetailImages}
                >
                  {selectedPost.images.map((imageUrl, index) => (
                    <Image 
                      key={index}
                      source={{ uri: apiService.getImageUrl(imageUrl) }}
                      style={styles.postDetailImage}
                      resizeMode="contain"
                    />
                  ))}
                </ScrollView>
              )}
              
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <View style={styles.postDetailTags}>
                  {selectedPost.tags.map((tag, index) => (
                    <View key={index} style={styles.tagChip}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              <View style={styles.postDetailStats}>
                <TouchableOpacity 
                  style={styles.postDetailStatButton}
                  onPress={() => handleLikePost(selectedPost.id, selectedPost.isLiked)}
                >
                  <Text style={[styles.actionIcon, { color: selectedPost.isLiked ? COLORS.primary : COLORS.text.primaryLight }]}>
                    {selectedPost.isLiked ? '❤️' : '🤍'}
                  </Text>
                  <Text style={styles.postDetailStatText}>{selectedPost.likes} likes</Text>
                </TouchableOpacity>
                
                <View style={styles.postDetailStatButton}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.postDetailStatText}>{selectedPost.commentsCount} comments</Text>
                </View>
                
                <View style={styles.postDetailStatButton}>
                  <Text style={styles.actionIcon}>👁️</Text>
                  <Text style={styles.postDetailStatText}>{selectedPost.viewCount} views</Text>
                </View>
              </View>
            </View>
            
            {/* Comments Section */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsSectionTitle}>Comments</Text>
              
              {selectedPost.comments && selectedPost.comments.length > 0 ? (
                selectedPost.comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                      <Text style={styles.commentTime}>{formatTimeAgo(comment.timestamp)}</Text>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
              )}
              
              {/* Add Comment Input */}
              <View style={styles.addCommentContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor={COLORS.text.primaryLight}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity 
                  style={styles.sendCommentButton}
                  onPress={() => handleAddComment(selectedPost.id)}
                  disabled={!commentText.trim()}
                >
                  <Text style={styles.sendCommentButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
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
      {renderPostDetailModal()}
    </View>
  );
};

export default CommunityScreenWithImages;
