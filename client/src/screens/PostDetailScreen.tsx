import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  ScrollView,
  StyleSheet
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import { COLORS } from '../constants/colors';
import apiService from '../services/apiService';

interface PostComment {
  id: string;
  author: {
    id: string;
    name: string;
  };
  content: string;
  createdAt: string;
}

interface PostDetails {
  id: string;
  author: {
    name: string;
  };
  content: string;
  category: string;
  likes: number;
  comments: PostComment[];
  createdAt: string;
}

const PostDetailScreen = () => {
  const route = useRoute();
  const { postId, postData } = route.params as { postId: string; postData?: any };
  
  const [post, setPost] = useState<PostDetails | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const { user } = useAppSelector(state => state.auth);

  // Fetch post details and comments
  useEffect(() => {
    if (postData) {
      // Use the passed post data directly
      const postDetails: PostDetails = {
        id: postData.id,
        author: { 
          name: postData.author?.name || 'Community Member' 
        },
        content: postData.content || 'No content available',
        category: postData.category || 'General',
        likes: postData.likes || 0,
        comments: [],
        createdAt: postData.timestamp || new Date().toISOString(),
      };
      
      setPost(postDetails);
      
      // Set comments if available
      if (postData.comments && Array.isArray(postData.comments)) {
        const formattedComments: PostComment[] = postData.comments.map((comment: any) => ({
          id: comment.id || Date.now().toString(),
          author: {
            id: comment.author?.id || 'unknown',
            name: comment.author?.name || 'Anonymous',
          },
          content: comment.content || '',
          createdAt: comment.timestamp || new Date().toISOString(),
        }));
        setComments(formattedComments);
      }
      
      setIsLoading(false);
    } else {
      // Fetch from API if no post data was passed
      fetchPostDetails();
    }
  }, [postId, postData]);

  const fetchPostDetails = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch the specific post details
      const response = await apiService.getCommunityPosts({ postId });
      
      if (response && response.length > 0) {
        const postData = response[0];
        
        // Convert API response to PostDetails format
        const postDetails: PostDetails = {
          id: postData._id || postId,
          author: { 
            name: postData.author?.username || 
                  postData.author?.name || 
                  postData.author?.email?.split('@')[0] || 
                  'Community Member' 
          },
          content: postData.content || 'No content available',
          category: postData.category || 'General',
          likes: postData.likeCount || postData.likes?.length || 0,
          comments: [],
          createdAt: postData.createdAt || new Date().toISOString(),
        };
        
        setPost(postDetails);
        
        // Fetch comments if available
        if (postData.comments && Array.isArray(postData.comments)) {
          const formattedComments: PostComment[] = postData.comments.map((comment: any) => ({
            id: comment._id || Date.now().toString(),
            author: {
              id: comment.author?._id || 'unknown',
              name: comment.author?.username || 
                    comment.author?.name || 
                    comment.author?.email?.split('@')[0] || 
                    'Anonymous',
            },
            content: comment.content || '',
            createdAt: comment.createdAt || new Date().toISOString(),
          }));
          setComments(formattedComments);
        }
      } else {
        // If no post found, show error
        Alert.alert('Error', 'Post not found');
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
      // Still show a basic view with the postId
      const fallbackPost: PostDetails = {
        id: postId,
        author: { name: 'Unknown Author' },
        content: 'Unable to load post content',
        category: 'General',
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString(),
      };
      setPost(fallbackPost);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to comment.');
      return;
    }
    if (!newComment.trim()) {
      Alert.alert('Error', 'Comment cannot be empty.');
      return;
    }

    try {
      setIsSubmittingComment(true);
      
      // In a real app, you'd call: await apiService.addComment(postId, newComment);
      // For now, we'll add it locally
      const newCommentObj: PostComment = {
        id: Date.now().toString(),
        author: {
          id: user.id || 'user',
          name: user.name || 'Anonymous',
        },
        content: newComment,
        createdAt: new Date().toISOString(),
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
      Alert.alert('Success', 'Comment added successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const renderComment = ({ item }: { item: PostComment }) => (
    <View style={styles.commentCard}>
      <Text style={styles.commentAuthor}>{item.author.name}</Text>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentTime}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView style={styles.scrollView}>
        {post && (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Text style={styles.authorName}>{post.author.name}</Text>
              <Text style={styles.postTime}>
                {new Date(post.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.postStats}>
              <Text style={styles.statText}>👍 {post.likes} Likes</Text>
              <Text style={styles.statText}>💬 {comments.length} Comments</Text>
            </View>
          </View>
        )}
        
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {comments.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No Comments Yet</Text>
              <Text style={styles.emptyStateMessage}>
                Be the first to share your thoughts!
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
      
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor="#999"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity 
          style={[styles.commentSubmitButton, isSubmittingComment && styles.disabledButton]}
          onPress={handleAddComment}
          disabled={isSubmittingComment}
        >
          {isSubmittingComment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.commentSubmitButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
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
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  postHeader: {
    marginBottom: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  postTime: {
    fontSize: 12,
    color: '#999',
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  commentsSection: {
    backgroundColor: '#fff',
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  commentCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  commentSubmitButton: {
    backgroundColor: COLORS.primary || '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  commentSubmitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PostDetailScreen;

