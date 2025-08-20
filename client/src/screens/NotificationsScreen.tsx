import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import notificationService, { CropNotification } from '../services/notificationService';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';

interface NotificationItemProps {
  notification: CropNotification;
  onPress: () => void;
  onMarkAsRead: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress, onMarkAsRead }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'irrigation': return '💧';
      case 'fertilization': return '🌱';
      case 'pest_control': return '🐛';
      case 'harvesting': return '🌾';
      case 'planting': return '🌱';
      default: return '📋';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification
      ]} 
      onPress={onPress}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIconContainer}>
          <Text style={styles.notificationIcon}>{getTypeIcon(notification.type)}</Text>
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <View style={styles.notificationMeta}>
            <Text style={[styles.notificationPriority, { color: getPriorityColor(notification.priority) }]}>
              {notification.priority.toUpperCase()}
            </Text>
            <Text style={styles.notificationDate}>
              {new Date(notification.scheduledDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
        {!notification.isRead && (
          <TouchableOpacity 
            style={styles.markReadButton}
            onPress={onMarkAsRead}
          >
            <Text style={styles.markReadButtonText}>Mark Read</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<CropNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'high'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications();
    setNotifications(allNotifications);
  };

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notificationService.getUnreadNotifications();
      case 'high':
        return notificationService.getHighPriorityNotifications();
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Unread ({notificationService.getUnreadNotifications().length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'high' && styles.activeTab]}
          onPress={() => setActiveTab('high')}
        >
          <Text style={[styles.tabText, activeTab === 'high' && styles.activeTabText]}>
            Priority ({notificationService.getHighPriorityNotifications().length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onPress={() => {
                // Navigate to relevant screen based on notification type
                if (notification.type === 'harvesting') {
                  navigation.navigate('CropDetail', { cropId: notification.cropId });
                }
              }}
              onMarkAsRead={() => handleMarkAsRead(notification.id)}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyDescription}>
              {activeTab === 'all' 
                ? 'You have no notifications yet. Add some crops to start receiving progress updates!'
                : `No ${activeTab} notifications at the moment.`
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundDark,
    paddingVertical: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  activeTabText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 8,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    marginRight: SPACING.sm,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  notificationMessage: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationPriority: {
    fontSize: FONTS.size.xs,
    fontWeight: 'bold',
  },
  notificationDate: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
  },
  markReadButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  markReadButtonText: {
    color: COLORS.textWhite,
    fontSize: FONTS.size.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationsScreen;
