import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  selectIsOnline,
  selectIsSyncing,
  selectSyncNeeded,
  selectPendingChanges,
  selectLastSyncTime,
  selectSyncError,
  performFullSync,
} from '../store/slices/syncSlice';

const { width } = Dimensions.get('window');

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showWhenOnline?: boolean;
  compact?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  showWhenOnline = false,
  compact = false,
}) => {
  const dispatch = useDispatch();
  const isOnline = useSelector(selectIsOnline);
  const isSyncing = useSelector(selectIsSyncing);
  const syncNeeded = useSelector(selectSyncNeeded);
  const pendingChanges = useSelector(selectPendingChanges);
  const lastSyncTime = useSelector(selectLastSyncTime);
  const syncError = useSelector(selectSyncError);

  const [slideAnim] = React.useState(new Animated.Value(0));
  const [pulseAnim] = React.useState(new Animated.Value(1));

  React.useEffect(() => {
    // Show/hide animation
    if (!isOnline || showWhenOnline || syncNeeded || syncError) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, showWhenOnline, syncNeeded, syncError, slideAnim]);

  React.useEffect(() => {
    // Pulse animation for sync in progress
    if (isSyncing) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSyncing, pulseAnim]);

  const handlePress = () => {
    if (!isSyncing && isOnline) {
      dispatch(performFullSync() as any);
    }
  };

  const getStatusInfo = () => {
    if (syncError) {
      return {
        icon: 'alert-circle',
        color: '#FF6B6B',
        backgroundColor: '#FFE5E5',
        text: 'Sync failed',
        subText: 'Tap to retry',
      };
    }

    if (isSyncing) {
      return {
        icon: 'sync',
        color: '#4ECDC4',
        backgroundColor: '#E8F8F7',
        text: 'Syncing...',
        subText: 'Updating your data',
      };
    }

    if (!isOnline) {
      return {
        icon: 'wifi-off',
        color: '#FF9500',
        backgroundColor: '#FFF4E6',
        text: 'You\'re offline',
        subText: pendingChanges > 0 
          ? `${pendingChanges} changes saved locally` 
          : 'Changes will be saved locally',
      };
    }

    if (syncNeeded && pendingChanges > 0) {
      return {
        icon: 'cloud-upload',
        color: '#4ECDC4',
        backgroundColor: '#E8F8F7',
        text: `${pendingChanges} changes to sync`,
        subText: 'Tap to sync now',
      };
    }

    if (showWhenOnline && lastSyncTime) {
      const lastSync = new Date(lastSyncTime);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
      
      return {
        icon: 'check-circle',
        color: '#4CAF50',
        backgroundColor: '#E8F5E8',
        text: 'Up to date',
        subText: diffMinutes < 1 
          ? 'Just synced' 
          : `Synced ${diffMinutes}m ago`,
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();

  if (!statusInfo) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: position === 'top' ? [-100, 0] : [100, 0],
  });

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          { 
            backgroundColor: statusInfo.backgroundColor,
            transform: [{ translateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.compactContent}
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={isSyncing || !isOnline}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Icon
              name={statusInfo.icon}
              size={16}
              color={statusInfo.color}
              style={styles.compactIcon}
            />
          </Animated.View>
          <Text style={[styles.compactText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: statusInfo.backgroundColor,
          [position]: 0,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={isSyncing || (!isOnline && !syncError)}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Icon
            name={statusInfo.icon}
            size={24}
            color={statusInfo.color}
            style={styles.icon}
          />
        </Animated.View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.primaryText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
          <Text style={[styles.secondaryText, { color: statusInfo.color }]}>
            {statusInfo.subText}
          </Text>
        </View>

        {(syncNeeded || syncError) && !isSyncing && isOnline && (
          <Icon
            name="chevron-right"
            size={20}
            color={statusInfo.color}
            style={styles.chevron}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 12,
    opacity: 0.8,
  },
  chevron: {
    marginLeft: 8,
  },
  compactContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compactIcon: {
    marginRight: 6,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default OfflineIndicator;
