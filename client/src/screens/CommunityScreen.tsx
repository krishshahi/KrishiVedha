import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { communityScreenStyles as styles } from '../styles/CommunityScreen.styles';
import { COLORS } from '../constants/colors';
import apiService from '../services/apiService';
import { 
  fetchCommunityPosts, 
  createCommunityPost, 
  loadMorePosts,
  setCurrentCategory,
  clearError,
  updatePostLikes
} from '../store/slices/communitySlice';

interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  image?: string;
  timestamp: Date;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface Expert {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  avatar?: string;
}

interface ExpertAdvice {
  id: string;
  expert: Expert;
  question: string;
  answer: string;
  timestamp: Date;
}

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  unit: string;
  location: string;
  seller: {
    id: string;
    name: string;
  };
  category: string;
  type: 'sell' | 'rent';
  images: string[];
  timestamp: Date;
}

const CommunityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { posts: reduxPosts, isLoading, error, pagination } = useAppSelector((state) => state.community);
  
  const [activeTab, setActiveTab] = useState<'feed' | 'experts' | 'marketplace' | 'myPosts'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [expertAdvice, setExpertAdvice] = useState<ExpertAdvice[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [expertQuestion, setExpertQuestion] = useState('');
  const [categories] = useState(['All', 'Tips', 'Questions', 'Success Stories', 'Problems']);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Initialize data on component mount
  useEffect(() => {
    loadCommunityData();
    initializeMockData(); // Keep mock data for now
  }, []);

  // Load community data from Redux
  const loadCommunityData = useCallback(() => {
    console.log('Loading community data, user:', user);
    if (user?.id) {
      dispatch(fetchCommunityPosts({ limit: 10, page: 1 }));
    } else {
      console.log('No user found, using mock data only');
    }
  }, [dispatch, user?.id]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const initializeMockData = () => {
    // Mock posts
    const mockPosts: Post[] = [
      {
        id: '1',
        author: { id: '1', name: 'Ram Bahadur' },
        content: 'Great harvest this season! My tomatoes are growing beautifully. Any tips for pest control?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        likes: 12,
        comments: 5,
        isLiked: false,
      },
      {
        id: '2',
        author: { id: '2', name: 'Sita Sharma' },
        content: 'Weather has been unpredictable lately. How is everyone managing irrigation?',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        likes: 8,
        comments: 3,
        isLiked: true,
      },
      {
        id: '3',
        author: { id: '3', name: 'Krishna Patel' },
        content: 'Just started growing organic vegetables. Would love to connect with other organic farmers!',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        likes: 15,
        comments: 7,
        isLiked: false,
      },
    ];

    // Mock experts
    const mockExperts: Expert[] = [
      {
        id: '1',
        name: 'Dr. Rajesh Kumar',
        specialty: 'Crop Disease Specialist',
        rating: 4.8,
      },
      {
        id: '2',
        name: 'Prof. Maya Singh',
        specialty: 'Organic Farming Expert',
        rating: 4.9,
      },
      {
        id: '3',
        name: 'Eng. Suresh Thapa',
        specialty: 'Irrigation & Water Management',
        rating: 4.7,
      },
    ];

    // Mock expert advice
    const mockExpertAdvice: ExpertAdvice[] = [
      {
        id: '1',
        expert: mockExperts[0],
        question: 'My tomato plants have yellow spots on leaves. What could be the problem?',
        answer: 'This appears to be early blight, a common fungal disease. Remove affected leaves immediately and apply copper-based fungicide. Ensure good air circulation and avoid overhead watering.',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        id: '2',
        expert: mockExperts[1],
        question: 'How can I improve soil fertility naturally?',
        answer: 'Use compost, green manures, and crop rotation. Add organic matter like cow dung or chicken manure. Consider planting nitrogen-fixing legumes like beans or peas.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    ];

    // Mock marketplace items
    const mockMarketplaceItems: MarketplaceItem[] = [
      {
        id: '1',
        title: 'Fresh Organic Tomatoes',
        description: 'High quality organic tomatoes, perfect for cooking and salads.',
        price: 120,
        unit: 'per kg',
        location: 'Kathmandu, Nepal',
        seller: {
          id: '1',
          name: 'Ram Bahadur'
        },
        category: 'produce',
        type: 'sell',
        images: [], // Empty images array to test placeholder
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: '2',
        title: 'Tractor for Rent',
        description: 'Well-maintained tractor available for daily/weekly rent. Perfect for plowing and harvesting.',
        price: 2500,
        unit: 'per day',
        location: 'Pokhara, Nepal',
        seller: {
          id: '2',
          name: 'Sita Sharma'
        },
        category: 'equipment',
        type: 'rent',
        images: [],
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        id: '3',
        title: 'Hybrid Corn Seeds',
        description: 'High yielding hybrid corn seeds. Disease resistant and drought tolerant.',
        price: 450,
        unit: 'per kg',
        location: 'Chitwan, Nepal',
        seller: {
          id: '3',
          name: 'Krishna Patel'
        },
        category: 'seeds',
        type: 'sell',
        images: [],
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    setPosts(mockPosts);
    setExperts(mockExperts);
    setExpertAdvice(mockExpertAdvice);
    setMarketplaceItems(mockMarketplaceItems);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Load fresh data from API via Redux
      try {
        await dispatch(fetchCommunityPosts({ limit: 10, page: 1 })).unwrap();
        console.log('Successfully loaded posts from API');
      } catch (apiError) {
        console.log('API failed, using mock data:', apiError);
      }
      
      // Refresh mock data
      initializeMockData();
      
      Alert.alert('Success', 'Community feed refreshed!');
    } catch (error: any) {
      console.error('Failed to refresh:', error);
      // Still show mock data if API fails
      initializeMockData();
      Alert.alert('Notice', 'Showing local data. Please check your connection.');
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Sync Redux posts with local state when Redux state changes
  useEffect(() => {
    if (reduxPosts && reduxPosts.length > 0) {
      console.log('🔄 Processing Redux posts:', reduxPosts.length);
      console.log('🔍 First post structure:', reduxPosts[0]);
      
      try {
        // Convert Redux posts to local Post format
        const convertedPosts: Post[] = reduxPosts.map((post, index) => {
          // Handle case where post might be an object with different structure
          if (typeof post !== 'object' || post === null) {
            console.warn(`⚠️ Post ${index} is not an object:`, post);
            return null;
          }
          
          const postData = post as any;
          
          // Debug log for problematic posts
          if (postData.author && typeof postData.author === 'object' && !postData.author.name && !postData.author.username) {
            console.warn('⚠️ Post has object author without name/username:', postData.author);
          }
          
          // Better author name extraction with more fallbacks
          let authorName = 'Unknown User';
          if (typeof postData.authorName === 'string' && postData.authorName.trim()) {
            authorName = postData.authorName.trim();
          } else if (postData.author) {
            if (typeof postData.author === 'string' && postData.author.trim()) {
              authorName = postData.author.trim();
            } else if (typeof postData.author === 'object' && postData.author !== null) {
              authorName = postData.author.name || postData.author.username || postData.author.displayName || 'Unknown User';
            }
          }
          
          // Better author ID extraction
          let authorId = '0';
          if (typeof postData.authorId === 'string' && postData.authorId.trim()) {
            authorId = postData.authorId.trim();
          } else if (postData.author && typeof postData.author === 'object' && postData.author !== null) {
            authorId = postData.author.id || postData.author._id || postData.author.userId || '0';
          }
          
          // Handle content
          let content = '';
          if (typeof postData.content === 'string') {
            content = postData.content;
          } else if (typeof postData.title === 'string') {
            content = postData.title;
          } else if (typeof postData.message === 'string') {
            content = postData.message;
          }
          
          // Handle timestamp
          let timestamp = new Date();
          try {
            if (postData.createdAt) {
              timestamp = new Date(postData.createdAt);
            } else if (postData.updatedAt) {
              timestamp = new Date(postData.updatedAt);
            } else if (postData.date) {
              timestamp = new Date(postData.date);
            }
          } catch (dateError) {
            console.warn('Date parsing error:', dateError);
            timestamp = new Date();
          }
          
          // Handle likes
          let likes = 0;
          if (typeof postData.likes === 'number') {
            likes = postData.likes;
          } else if (Array.isArray(postData.likes)) {
            likes = postData.likes.length;
          }
          
          // Handle comments
          let commentsCount = 0;
          if (typeof postData.comments === 'number') {
            commentsCount = postData.comments;
          } else if (Array.isArray(postData.comments)) {
            commentsCount = postData.comments.length;
          } else if (Array.isArray(postData.replies)) {
            commentsCount = postData.replies.length;
          }
          
          const convertedPost = {
            id: String(postData.id || postData._id || `temp-${Date.now()}-${index}`),
            author: {
              id: String(authorId),
              name: String(authorName)
            },
            content: String(content),
            timestamp: timestamp,
            likes: likes,
            comments: commentsCount,
            isLiked: false // Would need to check if current user liked this post
          };
          
          console.log(`✅ Converted post ${index}:`, convertedPost);
          return convertedPost;
        }).filter(post => post !== null) as Post[];
        
        console.log(`🔄 Successfully converted ${convertedPosts.length} posts`);
        
        // Only add posts that don't already exist (avoid duplicates with mock data)
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(p => p.id));
          const newPosts = convertedPosts.filter(p => !existingIds.has(p.id));
          if (newPosts.length > 0) {
            console.log(`📝 Adding ${newPosts.length} new posts`);
            return [...newPosts, ...prevPosts];
          }
          console.log('ℹ️ No new posts to add');
          return prevPosts;
        });
      } catch (error) {
        console.error('❌ Error processing Redux posts:', error);
        // Don't update posts if there's an error
      }
    }
  }, [reduxPosts]);

  const handleLikePost = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      Alert.alert('Error', 'Please enter some content for your post.');
      return;
    }

    if (!user?.id || !user?.name) {
      Alert.alert('Error', 'Please log in to create posts.');
      return;
    }

    try {
      // Create post data for Redux/API
      const postData = {
        content: postContent.trim(),
        title: postContent.trim().slice(0, 100), // Use first 100 chars as title
        authorId: user.id,
        authorName: user.name,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        location: user.location?.district || 'Unknown',
        tags: [],
        images: [],
      };

      // Dispatch to Redux store (will also call API)
      await dispatch(createCommunityPost(postData)).unwrap();

      // Also add to local state for immediate feedback
      const newPost: Post = {
        id: Date.now().toString(),
        author: { id: user.id, name: user.name },
        content: postContent.trim(),
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        isLiked: false,
      };

      setPosts(prevPosts => [newPost, ...prevPosts]);
      setPostContent('');
      Alert.alert('Success', 'Your post has been shared with the community!');
      
      // Refresh the feed to get latest posts
      setTimeout(() => {
        loadCommunityData();
      }, 1000);
      
    } catch (error: any) {
      console.error('Failed to create post:', error);
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
    }
  };

  const handleSubmitQuestion = () => {
    if (!expertQuestion.trim()) {
      Alert.alert('Error', 'Please enter your question.');
      return;
    }

    Alert.alert(
      'Question Submitted',
      'Your question has been sent to our experts. You will receive an answer within 24 hours.',
      [{ text: 'OK', onPress: () => setExpertQuestion('') }]
    );
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const handlePostPress = (post: Post) => {
    // Show detailed post information
    const postDetails = [
      `Author: ${post.author.name}`,
      `Posted: ${formatTimeAgo(post.timestamp)}`,
      `Likes: ${post.likes}`,
      `Comments: ${post.comments}`,
      '',
      `Content: ${post.content}`
    ].join('\n');
    
    Alert.alert(
      'Post Details',
      postDetails,
      [
        {
          text: post.isLiked ? 'Unlike' : 'Like',
          onPress: () => handleLikePost(post.id)
        },
        {
          text: 'Add Comment',
          onPress: () => Alert.alert('Comment', 'Comment functionality will be available soon!')
        },
        {
          text: 'Close',
          style: 'cancel'
        }
      ]
    );
    // TODO: Implement navigation to PostDetail screen
    // navigation.navigate('PostDetail', { post });
  };

  const renderPost = (post: Post) => {
    // Safety check to ensure post is valid
    if (!post || typeof post !== 'object') {
      console.warn('⚠️ Invalid post object:', post);
      return null;
    }
    
    // Ensure all required fields are strings/numbers
    const safePost = {
      id: String(post.id || 'unknown'),
      author: {
        id: String(post.author?.id || '0'),
        name: String(post.author?.name || 'Unknown User')
      },
      content: String(post.content || ''),
      timestamp: post.timestamp instanceof Date ? post.timestamp : new Date(),
      likes: Number(post.likes) || 0,
      comments: Number(post.comments) || 0,
      isLiked: Boolean(post.isLiked),
      image: post.image
    };
    
    return (
      <TouchableOpacity style={styles.postCard} onPress={() => handlePostPress(safePost)}>
        <View style={styles.postHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarPlaceholder}>👤</Text>
          </View>
          <View style={styles.postHeaderInfo}>
            <Text style={styles.authorName}>{safePost.author.name}</Text>
            <Text style={styles.postTime}>{formatTimeAgo(safePost.timestamp)}</Text>
          </View>
        </View>
        
        <Text style={styles.postContent}>{safePost.content}</Text>
        
        {safePost.image && (
          <View style={styles.postImageContainer}>
            <Text style={styles.postImagePlaceholder}>🖼️</Text>
          </View>
        )}
        
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleLikePost(safePost.id);
            }}
          >
            <Text style={[styles.actionIcon, { color: safePost.isLiked ? COLORS.primary : COLORS.text.primaryLight }]}>
              {safePost.isLiked ? '❤️' : '🤍'}
            </Text>
            <Text style={styles.actionText}>{safePost.likes}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handlePostPress(safePost);
            }}
          >
            <Text style={[styles.actionIcon, { color: COLORS.text.primaryLight }]}>💬</Text>
            <Text style={styles.actionText}>{safePost.comments}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              Alert.alert('Share', 'Share functionality coming soon!');
            }}
          >
            <Text style={[styles.actionIcon, { color: COLORS.text.primaryLight }]}>📤</Text>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExpert = (expert: Expert) => (
    <View style={styles.expertCard}>
      <View style={styles.expertAvatarContainer}>
        <Text style={styles.expertAvatarPlaceholder}>👨‍🌾</Text>
      </View>
      <View style={styles.expertInfo}>
        <Text style={styles.expertName}>{expert.name}</Text>
        <Text style={styles.expertSpecialty}>{expert.specialty}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingStars}>⭐</Text>
          <Text style={styles.ratingValue}>{expert.rating}/5.0</Text>
        </View>
      </View>
    </View>
  );

  const renderExpertAdvice = (advice: ExpertAdvice) => (
    <View style={styles.expertAdviceCard}>
      <View style={styles.expertAdviceHeader}>
        <View style={styles.expertAvatarSmall}>
          <Text style={styles.expertAvatarPlaceholderSmall}>👨‍🌾</Text>
        </View>
        <View>
          <Text style={styles.expertAdviceName}>{advice.expert.name}</Text>
          <Text style={styles.expertAdviceTime}>{formatTimeAgo(advice.timestamp)}</Text>
        </View>
      </View>
      
      <View style={styles.questionContainer}>
        <Text style={styles.questionLabel}>Q:</Text>
        <Text style={styles.questionText}>{advice.question}</Text>
      </View>
      
      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>A:</Text>
        <Text style={styles.answerText}>{advice.answer}</Text>
      </View>
    </View>
  );

  const renderFeedTab = () => (
    <View style={styles.feedContainer}>
      {/* Create Post */}
      <View style={styles.createPostContainer}>
        <View style={styles.createPostHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarPlaceholder}>👤</Text>
          </View>
          <TextInput
            style={styles.postInput}
            placeholder="Share your farming experience..."
            placeholderTextColor={COLORS.text.primaryLight}
            value={postContent}
            onChangeText={setPostContent}
            multiline
          />
        </View>
        
        <View style={styles.createPostActions}>
          <TouchableOpacity style={styles.createPostAction}>
            <Text style={[styles.actionIcon, { color: COLORS.text.primaryLight }]}>📷</Text>
            <Text style={styles.actionText}>Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.createPostAction}>
            <Text style={[styles.actionIcon, { color: COLORS.text.primaryLight }]}>📍</Text>
            <Text style={styles.actionText}>Location</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.postButton} onPress={handleCreatePost}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Posts Feed */}
      {posts.length > 0 ? (
        posts.map((post, index) => {
          // Safety check for each post
          if (!post || typeof post !== 'object' || !post.id) {
            console.warn(`⚠️ Skipping invalid post at index ${index}:`, post);
            return null;
          }
          
          const renderedPost = renderPost(post);
          if (!renderedPost) {
            return null;
          }
          
          return (
            <React.Fragment key={String(post.id) || `post-${index}`}>
              {renderedPost}
            </React.Fragment>
          );
        }).filter(Boolean) // Remove null entries
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>📝</Text>
          <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
          <Text style={styles.emptyStateMessage}>
            Be the first to share something with the community!
          </Text>
        </View>
      )}
    </View>
  );

  const renderExpertsTab = () => (
    <View style={styles.expertsContainer}>
      {/* Ask Expert */}
      <Text style={styles.sectionTitle}>Ask an Expert</Text>
      <View style={styles.askExpertContainer}>
        <TextInput
          style={styles.expertQuestionInput}
          placeholder="Ask your farming question here..."
          placeholderTextColor={COLORS.text.primaryLight}
          value={expertQuestion}
          onChangeText={setExpertQuestion}
          multiline
        />
        <TouchableOpacity style={styles.submitQuestionButton} onPress={handleSubmitQuestion}>
          <Text style={styles.submitQuestionButtonText}>Submit Question</Text>
        </TouchableOpacity>
      </View>
      
      {/* Expert Advice */}
      <Text style={styles.sectionTitle}>Recent Expert Advice</Text>
      {expertAdvice.map((advice, index) => (
        <React.Fragment key={advice.id || `advice-${index}`}>
          {renderExpertAdvice(advice)}
        </React.Fragment>
      ))}
      
      {/* Available Experts */}
      <Text style={styles.sectionTitle}>Available Experts</Text>
      {experts.map((expert, index) => (
        <React.Fragment key={expert.id || `expert-${index}`}>
          {renderExpert(expert)}
        </React.Fragment>
      ))}
    </View>
  );

  const renderMarketplaceItem = (item: MarketplaceItem) => (
    <TouchableOpacity 
      style={styles.marketplaceCard}
      onPress={() => {
        Alert.alert(
          item.title,
          `${item.description}\n\nPrice: ₹${item.price} ${item.unit}\nLocation: ${item.location}\nSeller: ${item.seller.name}\nType: ${item.type}\nCategory: ${item.category}\n\nPosted: ${formatTimeAgo(item.timestamp)}`,
          [
            {
              text: 'Contact Seller',
              onPress: () => Alert.alert('Contact', `Contact ${item.seller.name} for this ${item.type} listing.`)
            },
            {
              text: 'Close',
              style: 'cancel'
            }
          ]
        );
      }}
    >
      <View style={styles.marketplaceImageContainer}>
        <Text style={styles.marketplaceImagePlaceholder}>🛒</Text>
      </View>
      
      <View style={styles.marketplaceItemInfo}>
        <Text style={styles.marketplaceItemTitle}>{item.title}</Text>
        <Text style={styles.marketplaceItemPrice}>₹{item.price} {item.unit}</Text>
        <Text style={styles.marketplaceItemLocation}>📍 {item.location}</Text>
        <Text style={styles.marketplaceItemSeller}>👤 {item.seller.name}</Text>
        
        <View style={styles.marketplaceItemMeta}>
          <View style={[styles.marketplaceItemTypeTag, 
            item.type === 'rent' ? styles.rentTag : styles.sellTag]}>
            <Text style={styles.marketplaceItemTypeText}>{item.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.marketplaceItemTime}>{formatTimeAgo(item.timestamp)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMarketplaceTab = () => (
    <View style={styles.marketplaceContainer}>
      <Text style={styles.sectionTitle}>Agricultural Marketplace</Text>
      
      {marketplaceItems.length > 0 ? (
        marketplaceItems.map((item, index) => (
          <React.Fragment key={item.id || `marketplace-${index}`}>
            {renderMarketplaceItem(item)}
          </React.Fragment>
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>🛒</Text>
          <Text style={styles.emptyStateTitle}>No Marketplace Items</Text>
          <Text style={styles.emptyStateMessage}>
            Be the first to list something for sale or rent!
          </Text>
        </View>
      )}
    </View>
  );

  const renderMyPostsTab = () => (
    <View style={styles.myPostsContainer}>
      {posts.filter(post => post.author.id === user?.id).length > 0 ? (
        <ScrollView>
          {posts
            .filter(post => post.author.id === user?.id)
            .map((post, index) => (
              <React.Fragment key={post.id || `my-post-${index}`}>
                {renderPost(post)}
              </React.Fragment>
            ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>📝</Text>
          <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
          <Text style={styles.emptyStateMessage}>
            You haven't shared any posts yet.{'\n'}
            Start sharing your farming experiences with the community!
          </Text>
          <TouchableOpacity 
            style={styles.createFirstPostButton}
            onPress={() => setActiveTab('feed')}
          >
            <Text style={styles.createFirstPostButtonText}>Create Your First Post</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
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
          style={[styles.tab, activeTab === 'experts' && styles.activeTab]}
          onPress={() => setActiveTab('experts')}
        >
          <Text style={[styles.tabText, activeTab === 'experts' && styles.activeTabText]}>
            Experts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'marketplace' && styles.activeTab]}
          onPress={() => setActiveTab('marketplace')}
        >
          <Text style={[styles.tabText, activeTab === 'marketplace' && styles.activeTabText]}>
            Market
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
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'feed' && renderFeedTab()}
        {activeTab === 'experts' && renderExpertsTab()}
        {activeTab === 'marketplace' && renderMarketplaceTab()}
        {activeTab === 'myPosts' && renderMyPostsTab()}
      </ScrollView>
    </View>
  );
};

export default CommunityScreen;
