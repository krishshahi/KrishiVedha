import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { communityScreenStyles as styles } from '../styles/CommunityScreen.styles';

interface ExpertCardProps {
  name: string;
  specialty: string;
  rating: number;
  avatar?: string;
  onPress: () => void;
}

const ExpertCard: React.FC<ExpertCardProps> = ({ 
  name, 
  specialty, 
  rating, 
  avatar, 
  onPress 
}) => {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.ratingStars}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    return stars;
  };

  return (
    <TouchableOpacity style={styles.expertCard} onPress={onPress}>
      <View style={styles.expertAvatarContainer}>
        <Text style={styles.expertAvatarPlaceholder}>👨‍🔬</Text>
      </View>
      <View style={styles.expertInfo}>
        <Text style={styles.expertName}>{name}</Text>
        <Text style={styles.expertSpecialty}>{specialty}</Text>
        <View style={styles.ratingContainer}>
          {renderStars(rating)}
          <Text style={styles.ratingValue}>({rating}/5)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ExpertCard;
