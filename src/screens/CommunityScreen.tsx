import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';
import { communityScreenStyles as styles } from '../styles/CommunityScreen.styles';

interface PostCardProps {
  author: string;
  avatar?: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  onPress: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  author, 
  avatar, 
  time, 
  content, 
  image, 
  likes, 
  comments, 
  onPress 
}) => {
  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress}>
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
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>👍</Text>
          <Text style={styles.actionText}>{likes} Likes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{comments} Comments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>↗️</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

interface ExpertCardProps {
  name: string;
  specialty: string;
  avatar?: string;
  rating: number;
  onPress: () => void;
}

const ExpertCard: React.FC<ExpertCardProps> = ({ name, specialty, avatar, rating, onPress }) => {
  return (
    <TouchableOpacity style={styles.expertCard} onPress={onPress}>
      <View style={styles.expertAvatarContainer}>
        <Text style={styles.expertAvatarPlaceholder}>👩‍🔬</Text>
      </View>
      <View style={styles.expertInfo}>
        <Text style={styles.expertName}>{name}</Text>
        <Text style={styles.expertSpecialty}>{specialty}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingStars}>{'⭐'.repeat(rating)}</Text>
          <Text style={styles.ratingValue}>({rating}.0)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CommunityScreen = () => {
  const [activeTab, setActiveTab] = useState('feed');

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
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'experts' && styles.activeTab]}
          onPress={() => setActiveTab('experts')}
        >
          <Text style={[styles.tabText, activeTab === 'experts' && styles.activeTabText]}>Expert Advice</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my-posts' && styles.activeTab]}
          onPress={() => setActiveTab('my-posts')}
        >
          <Text style={[styles.tabText, activeTab === 'my-posts' && styles.activeTabText]}>My Posts</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {activeTab === 'feed' && (
          <View style={styles.feedContainer}>
            <View style={styles.createPostContainer}>
              <View style={styles.createPostHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarPlaceholder}>👨‍🌾</Text>
                </View>
                <TextInput
                  style={styles.postInput}
                  placeholder="Share your farming experience..."
                  placeholderTextColor={COLORS.placeholder}
                  multiline
                />
              </View>
              <View style={styles.createPostActions}>
                <TouchableOpacity style={styles.createPostAction}>
                  <Text style={styles.actionIcon}>📷</Text>
                  <Text style={styles.actionText}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createPostAction}>
                  <Text style={styles.actionIcon}>📍</Text>
                  <Text style={styles.actionText}>Location</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postButton}>
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <PostCard
              author="Ram Bahadur"
              time="2 hours ago"
              content="My rice fields are doing great this season! The weather has been perfect. Has anyone tried the new seed variety from the agricultural center?"
              image="rice_field.jpg"
              likes={24}
              comments={8}
              onPress={() => {}}
            />
            
            <PostCard
              author="Sita Sharma"
              time="5 hours ago"
              content="Dealing with some pest issues in my vegetable garden. Any natural remedies that have worked for you?"
              likes={18}
              comments={12}
              onPress={() => {}}
            />
            
            <PostCard
              author="Hari Prasad"
              time="Yesterday"
              content="Just harvested my first batch of organic tomatoes! The yield is amazing. I'll be sharing some tips on organic farming next week."
              image="tomatoes.jpg"
              likes={42}
              comments={15}
              onPress={() => {}}
            />
          </View>
        )}
        
        {activeTab === 'experts' && (
          <View style={styles.expertsContainer}>
            <Text style={styles.sectionTitle}>Ask an Expert</Text>
            <View style={styles.askExpertContainer}>
              <TextInput
                style={styles.expertQuestionInput}
                placeholder="Type your farming question here..."
                placeholderTextColor={COLORS.placeholder}
                multiline
              />
              <TouchableOpacity style={styles.submitQuestionButton}>
                <Text style={styles.submitQuestionButtonText}>Submit Question</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionTitle}>Available Experts</Text>
            <ExpertCard
              name="Dr. Anita Sharma"
              specialty="Crop Diseases"
              rating={5}
              onPress={() => {}}
            />
            
            <ExpertCard
              name="Prakash Adhikari"
              specialty="Organic Farming"
              rating={4}
              onPress={() => {}}
            />
            
            <ExpertCard
              name="Dr. Rajendra Singh"
              specialty="Irrigation Systems"
              rating={5}
              onPress={() => {}}
            />
            
            <Text style={styles.sectionTitle}>Recent Expert Advice</Text>
            <View style={styles.expertAdviceCard}>
              <View style={styles.expertAdviceHeader}>
                <View style={styles.expertAvatarSmall}>
                  <Text style={styles.expertAvatarPlaceholderSmall}>👩‍🔬</Text>
                </View>
                <View>
                  <Text style={styles.expertAdviceName}>Dr. Anita Sharma</Text>
                  <Text style={styles.expertAdviceTime}>Answered 1 day ago</Text>
                </View>
              </View>
              <View style={styles.questionContainer}>
                <Text style={styles.questionLabel}>Q:</Text>
                <Text style={styles.questionText}>
                  How can I prevent blight in my potato crops during the monsoon season?
                </Text>
              </View>
              <View style={styles.answerContainer}>
                <Text style={styles.answerLabel}>A:</Text>
                <Text style={styles.answerText}>
                  To prevent potato blight during monsoon, ensure good drainage in your field, practice crop rotation, use resistant varieties, maintain proper plant spacing, and apply preventative fungicides before the rainy season starts. Also, avoid overhead irrigation and remove infected plants immediately.
                </Text>
              </View>
              <TouchableOpacity style={styles.readMoreLink}>
                <Text style={styles.readMoreText}>Read more answers</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {activeTab === 'my-posts' && (
          <View style={styles.myPostsContainer}>
            <TouchableOpacity style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
              <Text style={styles.emptyStateMessage}>
                Share your farming experiences with the community. Your knowledge can help other farmers!
              </Text>
              <View style={styles.createFirstPostButton}>
                <Text style={styles.createFirstPostButtonText}>Create Your First Post</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};


export default CommunityScreen;

