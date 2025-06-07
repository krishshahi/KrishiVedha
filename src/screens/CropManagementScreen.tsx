import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { styles } from '../styles/CropManagementScreen.styles';

interface CropCardProps {
  name: string;
  stage: string;
  progress: number;
  daysRemaining: number;
  imageUrl?: string;
  onPress: () => void;
}

const CropCard: React.FC<CropCardProps> = ({ name, stage, progress, daysRemaining, imageUrl, onPress }) => {
  return (
    <TouchableOpacity style={styles.cropCard} onPress={onPress}>
      <View style={styles.cropImageContainer}>
        <Text style={styles.cropImagePlaceholder}>🌾</Text>
      </View>
      <View style={styles.cropInfo}>
        <Text style={styles.cropName}>{name}</Text>
        <Text style={styles.cropStage}>{stage}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.daysRemaining}>{daysRemaining} days to harvest</Text>
      </View>
    </TouchableOpacity>
  );
};

interface CalendarEventProps {
  day: number;
  month: string;
  title: string;
  description: string;
  isCompleted: boolean;
  onPress: () => void;
}

const CalendarEvent: React.FC<CalendarEventProps> = ({ day, month, title, description, isCompleted, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.eventItem, isCompleted && styles.completedEvent]} 
      onPress={onPress}
    >
      <View style={styles.eventDate}>
        <Text style={styles.eventDay}>{day}</Text>
        <Text style={styles.eventMonth}>{month}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{title}</Text>
        <Text style={styles.eventDescription}>{description}</Text>
      </View>
      <View style={styles.eventStatus}>
        <View style={[styles.statusIndicator, isCompleted && styles.completedIndicator]} />
      </View>
    </TouchableOpacity>
  );
};

const CropManagementScreen = () => {
  const [activeTab, setActiveTab] = useState('crops');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Crop Management</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'crops' && styles.activeTab]}
          onPress={() => setActiveTab('crops')}
        >
          <Text style={[styles.tabText, activeTab === 'crops' && styles.activeTabText]}>My Crops</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'guide' && styles.activeTab]}
          onPress={() => setActiveTab('guide')}
        >
          <Text style={[styles.tabText, activeTab === 'guide' && styles.activeTabText]}>Crop Guide</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {activeTab === 'crops' && (
          <View style={styles.cropsContainer}>
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add New Crop</Text>
              </TouchableOpacity>
            </View>
            
            <CropCard
              name="Rice (Dhan)"
              stage="Growing"
              progress={45}
              daysRemaining={65}
              onPress={() => {}}
            />
            
            <CropCard
              name="Maize (Makai)"
              stage="Flowering"
              progress={70}
              daysRemaining={30}
              onPress={() => {}}
            />
            
            <CropCard
              name="Potato (Aalu)"
              stage="Initial Growth"
              progress={25}
              daysRemaining={90}
              onPress={() => {}}
            />
            
            <View style={styles.weatherImpactContainer}>
              <Text style={styles.sectionTitle}>Weather Impact</Text>
              <View style={styles.weatherImpactCard}>
                <Text style={styles.weatherImpactIcon}>⚠️</Text>
                <View>
                  <Text style={styles.weatherImpactTitle}>Heavy Rainfall Expected</Text>
                  <Text style={styles.weatherImpactDescription}>
                    Protect your maize crops from potential water damage. Consider drainage solutions.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        
        {activeTab === 'calendar' && (
          <View style={styles.calendarContainer}>
            <View style={styles.monthSelector}>
              <TouchableOpacity>
                <Text style={styles.monthSelectorArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.currentMonth}>June 2025</Text>
              <TouchableOpacity>
                <Text style={styles.monthSelectorArrow}>→</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarEventList}>
              <CalendarEvent
                day={10}
                month="Jun"
                title="Rice Watering"
                description="Water rice field 1"
                isCompleted={true}
                onPress={() => {}}
              />
              
              <CalendarEvent
                day={12}
                month="Jun"
                title="Apply Fertilizer"
                description="Apply NPK to maize crop"
                isCompleted={true}
                onPress={() => {}}
              />
              
              <CalendarEvent
                day={15}
                month="Jun"
                title="Pest Control"
                description="Check for and treat potato beetles"
                isCompleted={false}
                onPress={() => {}}
              />
              
              <CalendarEvent
                day={20}
                month="Jun"
                title="Maize Thinning"
                description="Thin out maize seedlings"
                isCompleted={false}
                onPress={() => {}}
              />
              
              <View style={styles.actionButtonContainer}>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>+ Add New Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        {activeTab === 'guide' && (
          <View style={styles.guideContainer}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchPlaceholder}>Search for crops...</Text>
            </View>
            
            <View style={styles.cropCategoryContainer}>
              <Text style={styles.sectionTitle}>Crop Categories</Text>
              <View style={styles.categoryGrid}>
                <TouchableOpacity style={styles.categoryItem}>
                  <Text style={styles.categoryIcon}>🌾</Text>
                  <Text style={styles.categoryName}>Cereals</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryItem}>
                  <Text style={styles.categoryIcon}>🥔</Text>
                  <Text style={styles.categoryName}>Vegetables</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryItem}>
                  <Text style={styles.categoryIcon}>🌱</Text>
                  <Text style={styles.categoryName}>Pulses</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryItem}>
                  <Text style={styles.categoryIcon}>🍎</Text>
                  <Text style={styles.categoryName}>Fruits</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>Seasonal Recommendations</Text>
            <View style={styles.recommendationContainer}>
              <TouchableOpacity style={styles.recommendationItem}>
                <Text style={styles.recommendationIcon}>🌾</Text>
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>Rice</Text>
                  <Text style={styles.recommendationDescription}>Ideal for monsoon planting. Good time to start now.</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.recommendationItem}>
                <Text style={styles.recommendationIcon}>🌽</Text>
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>Maize</Text>
                  <Text style={styles.recommendationDescription}>Best grown during pre-monsoon. Plant in well-drained soil.</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.recommendationItem}>
                <Text style={styles.recommendationIcon}>🥒</Text>
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>Cucumber</Text>
                  <Text style={styles.recommendationDescription}>Grows well in summer. Requires regular watering.</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};


export default CropManagementScreen;

