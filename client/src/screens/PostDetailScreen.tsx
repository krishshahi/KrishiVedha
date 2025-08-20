
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCommentsForPost, addCommentToPost } from '../store/slices/communitySlice';
import { AppStackParamList } from '../types/navigation.types';
import { CommunityPost, Comment } from '../types/user.types';
import { communityScreenStyles as styles } from '../styles/CommunityScreen.styles';
import { LoadingSpinner, PostCard } from '../components';

type PostDetailScreenRouteProp = RouteProp<AppStackParamList, 'PostDetail'>;

const PostDetailScreen = () => {
  const route = useRoute<PostDetailScreenRouteProp>();
  const { post } = route.params;
  
  const [newComment, setNewComment] = useState('');
  
  const dispatch = useAppDispatch();
  const { comments, isLoading, error } = useAppSelector(state => state.community);
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (post.id) {
      dispatch(fetchCommentsForPost(post.id));
    }
  }, [dispatch, post.id]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

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
      await dispatch(addCommentToPost({ 
        postId: post.id, 
        content: newComment, 
        authorId: user.id, 
        authorName: user.name 
      })).unwrap();
      setNewComment('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add comment.');
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentCard}>
      <Text style={styles.commentAuthor}>{item.authorName}</Text>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentTime}>{new Date(item.createdAt).toLocaleString()}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: styles.container.backgroundColor }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <FlatList
        ListHeaderComponent={
          <PostCard
            id={post.id}
            author={post.authorName}
            time={new Date(post.createdAt).toLocaleString()}
            content={post.content}
            likes={post.likes}
            comments={post.comments}
            onPress={() => {}}
          />
        }
        data={comments[post.id] || []}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No Comments Yet</Text>
              <Text style={styles.emptyStateMessage}>Be the first to share your thoughts!</Text>
            </View>
          ) : null
        }
      />
      {isLoading && <LoadingSpinner />}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity style={styles.commentSubmitButton} onPress={handleAddComment}>
          <Text style={styles.commentSubmitButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PostDetailScreen;

