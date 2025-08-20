import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updatePostLikes, updatePostComments } from '../store/slices/communitySlice';
import { communityScreenStyles as styles } from '../styles/CommunityScreen.styles';
import communityService from '../services/communityService';

interface PostCardProps {
  id: string;
  author: string;
  avatar?: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  onPress?: () => void;
  onComment?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  id,
  author, 
  avatar, 
  time, 
  content, 
  image, 
  likes, 
  comments, 
  onPress,
  onComment
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [isLiked, setIsLiked] = useState(false);
  
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to like posts');
      return;
    }

    if (isLiking) return; // Prevent double-tapping

    setIsLiking(true);
    try {
      if (isLiked) {
        // Unlike the post
        await communityService.unlikePost(id);
        const newLikes = Math.max(0, currentLikes - 1);
        setCurrentLikes(newLikes);
        setIsLiked(false);
        dispatch(updatePostLikes({ postId: id, likes: newLikes }));
      } else {
        // Like the post
        await communityService.likePost(id);
        const newLikes = currentLikes + 1;
        setCurrentLikes(newLikes);
        setIsLiked(true);
        dispatch(updatePostLikes({ postId: id, likes: newLikes }));
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like status');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to comment');
      return;
    }
    
    if (onComment) {
      onComment();
    } else {
      // TODO: Navigate to post detail screen or open comment modal
      Alert.alert('Comments', 'Comment functionality coming soon!');
    }
  };

  const handleShare = () => {
    // TODO: Implement sharing functionality
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.postHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarPlaceholder}>👨‍🌾</Text>
        </View>
        <View style={styles.postHeaderInfo}>
          <Text style={styles.authorName}>{author}</Text>
          <Text style={styles.postTime}>{time}</Text>
        </View>
      </View>
      
      <Text style={styles.postContent}>{content}</Text>
      
      {image && (
        <View style={styles.postImageContainer}>
          <Text style={styles.postImagePlaceholder}>🖼️</Text>
        </View>
      )}
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={[styles.actionButton, isLiked && { opacity: 0.7 }]} 
          onPress={handleLike}
          disabled={isLiking}
        >
          <Text style={[styles.actionIcon, isLiked && { fontSize: 20 }]}>
            {isLiked ? '👍' : '👍'}
          </Text>
          <Text style={styles.actionText}>
            {currentLikes} {currentLikes === 1 ? 'Like' : 'Likes'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <Text style={styles.actionIcon}>{'💬'}</Text>
          <Text style={styles.actionText}>
            {comments} {comments === 1 ? 'Comment' : 'Comments'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Text style={styles.actionIcon}>{'↗️'}</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default PostCard;
