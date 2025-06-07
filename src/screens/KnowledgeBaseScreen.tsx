import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';
import { styles } from '../styles/KnowledgeBaseScreen.styles';

interface ArticleCardProps {
  title: string;
  category: string;
  imageIcon: string;
  readTime: string;
  onPress: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ title, category, imageIcon, readTime, onPress }) => {
  return (
    <TouchableOpacity style={styles.articleCard} onPress={onPress}>
      <View style={styles.articleImageContainer}>
        <Text style={styles.articleImagePlaceholder}>{imageIcon}</Text>
      </View>
      <View style={styles.articleInfo}>
        <Text style={styles.articleCategory}>{category}</Text>
        <Text style={styles.articleTitle}>{title}</Text>
        <Text style={styles.articleReadTime}>{readTime} min read</Text>
      </View>
    </TouchableOpacity>
  );
};

interface CategoryTagProps {
  title: string;
  isSelected: boolean;
  onPress: () => void;
}

const CategoryTag: React.FC<CategoryTagProps> = ({ title, isSelected, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.categoryTag, isSelected && styles.selectedCategoryTag]} 
      onPress={onPress}
    >
      <Text style={[styles.categoryTagText, isSelected && styles.selectedCategoryTagText]}>{title}</Text>
    </TouchableOpacity>
  );
};

const KnowledgeBaseScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Crops', 'Pests', 'Farming', 'Weather', 'Technology'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Knowledge Base</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for farming knowledge..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.placeholder}
          />
        </View>
        
        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesScrollView}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <CategoryTag
              key={category}
              title={category}
              isSelected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>
        
        {/* Featured Articles */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Featured Articles</Text>
          <View style={styles.featuredArticleContainer}>
            <View style={styles.featuredArticleImagePlaceholder}>
              <Text style={styles.featuredArticleImageIcon}>🌱</Text>
            </View>
            <View style={styles.featuredArticleContent}>
              <Text style={styles.featuredArticleTitle}>Sustainable Rice Farming Techniques in Nepal</Text>
              <Text style={styles.featuredArticleDescription}>
                Learn modern approaches to rice cultivation that increase yield while preserving resources.
              </Text>
              <TouchableOpacity style={styles.readMoreButton}>
                <Text style={styles.readMoreButtonText}>Read More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Recent Articles */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Articles</Text>
          <ArticleCard
            title="Natural Pest Management for Vegetable Crops"
            category="Pests"
            imageIcon="🐞"
            readTime="5"
            onPress={() => {}}
          />
          <ArticleCard
            title="Understanding Weather Patterns for Better Crop Planning"
            category="Weather"
            imageIcon="🌦️"
            readTime="8"
            onPress={() => {}}
          />
          <ArticleCard
            title="Soil Health: The Foundation of Successful Farming"
            category="Farming"
            imageIcon="🌿"
            readTime="6"
            onPress={() => {}}
          />
        </View>
        
        {/* Trending Topics */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Trending Topics</Text>
          <View style={styles.trendingTopicsContainer}>
            <TouchableOpacity style={styles.trendingTopic}>
              <Text style={styles.trendingTopicIcon}>🌧️</Text>
              <Text style={styles.trendingTopicText}>Monsoon Farming</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trendingTopic}>
              <Text style={styles.trendingTopicIcon}>🌱</Text>
              <Text style={styles.trendingTopicText}>Organic Farming</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trendingTopic}>
              <Text style={styles.trendingTopicIcon}>🚜</Text>
              <Text style={styles.trendingTopicText}>Farm Equipment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trendingTopic}>
              <Text style={styles.trendingTopicIcon}>💧</Text>
              <Text style={styles.trendingTopicText}>Irrigation</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Video Tutorials */}
        <View style={[styles.sectionContainer, { marginBottom: SPACING.xl }]}>
          <Text style={styles.sectionTitle}>Video Tutorials</Text>
          <TouchableOpacity style={styles.videoTutorialCard}>
            <View style={styles.videoThumbnailContainer}>
              <Text style={styles.videoPlayIcon}>▶️</Text>
            </View>
            <Text style={styles.videoTitle}>How to Prepare Soil for Rice Planting</Text>
            <Text style={styles.videoDuration}>12:34</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.videoTutorialCard}>
            <View style={styles.videoThumbnailContainer}>
              <Text style={styles.videoPlayIcon}>▶️</Text>
            </View>
            <Text style={styles.videoTitle}>Natural Pesticides for Vegetable Gardens</Text>
            <Text style={styles.videoDuration}>8:45</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};


export default KnowledgeBaseScreen;

