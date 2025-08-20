import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  selectSyncState,
  selectSyncConflicts,
  selectDataFreshness,
  performFullSync,
  syncSpecificData,
  resolveConflict,
  clearResolvedConflicts,
  setAutoSync,
  setSyncInterval,
} from '../store/slices/syncSlice';

interface SyncStatusProps {
  visible?: boolean;
  onClose?: () => void;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ visible = true, onClose }) => {
  const dispatch = useDispatch();
  const syncState = useSelector(selectSyncState);
  const conflicts = useSelector(selectSyncConflicts);
  const dataFreshness = useSelector(selectDataFreshness);

  const [showConflictModal, setShowConflictModal] = React.useState(false);
  const [selectedConflict, setSelectedConflict] = React.useState<any>(null);

  const formatLastSyncTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getDataStatusColor = (freshness: string | null) => {
    if (!freshness) return '#FF6B6B';
    
    const age = Date.now() - new Date(freshness).getTime();
    const hours = age / (1000 * 60 * 60);
    
    if (hours < 1) return '#4CAF50';
    if (hours < 24) return '#FF9500';
    return '#FF6B6B';
  };

  const handleFullSync = () => {
    dispatch(performFullSync() as any);
  };

  const handleSpecificSync = (dataType: 'crops' | 'activities' | 'community' | 'weather') => {
    dispatch(syncSpecificData({ dataType, forceRefresh: true }) as any);
  };

  const handleConflictPress = (conflict: any) => {
    setSelectedConflict(conflict);
    setShowConflictModal(true);
  };

  const handleResolveConflict = (resolution: 'server' | 'local' | 'custom', customValue?: any) => {
    if (!selectedConflict) return;

    dispatch(resolveConflict({
      conflictId: selectedConflict.id,
      resolution,
      customValue,
    }) as any);

    setShowConflictModal(false);
    setSelectedConflict(null);
  };

  const handleToggleAutoSync = () => {
    dispatch(setAutoSync(!syncState.autoSyncEnabled));
  };

  const handleChangeSyncInterval = () => {
    Alert.alert(
      'Sync Interval',
      'How often should the app automatically sync?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '5 minutes', onPress: () => dispatch(setSyncInterval(5)) },
        { text: '15 minutes', onPress: () => dispatch(setSyncInterval(15)) },
        { text: '30 minutes', onPress: () => dispatch(setSyncInterval(30)) },
        { text: '1 hour', onPress: () => dispatch(setSyncInterval(60)) },
      ]
    );
  };

  const renderConflictModal = () => {
    if (!selectedConflict) return null;

    return (
      <Modal
        visible={showConflictModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConflictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sync Conflict</Text>
              <TouchableOpacity
                onPress={() => setShowConflictModal(false)}
                style={styles.modalClose}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.conflictDescription}>
                There's a conflict in {selectedConflict.type} for field "{selectedConflict.field}". 
                Choose which version to keep:
              </Text>

              <View style={styles.conflictOptions}>
                <TouchableOpacity
                  style={styles.conflictOption}
                  onPress={() => handleResolveConflict('server')}
                >
                  <Icon name="cloud-download" size={20} color="#4ECDC4" />
                  <View style={styles.conflictOptionContent}>
                    <Text style={styles.conflictOptionTitle}>Use Server Version</Text>
                    <Text style={styles.conflictOptionValue}>
                      {JSON.stringify(selectedConflict.serverValue)}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.conflictOption}
                  onPress={() => handleResolveConflict('local')}
                >
                  <Icon name="cellphone" size={20} color="#FF9500" />
                  <View style={styles.conflictOptionContent}>
                    <Text style={styles.conflictOptionTitle}>Use Local Version</Text>
                    <Text style={styles.conflictOptionValue}>
                      {JSON.stringify(selectedConflict.localValue)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sync Status</Text>
          <Text style={styles.subtitle}>
            Last sync: {formatLastSyncTime(syncState.lastSyncTime)}
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Overall Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Status</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Icon
                name={syncState.isOnline ? 'wifi' : 'wifi-off'}
                size={20}
                color={syncState.isOnline ? '#4CAF50' : '#FF9500'}
              />
              <Text style={styles.statusText}>
                {syncState.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>

            {syncState.isSyncing && (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color="#4ECDC4" />
                <Text style={styles.statusText}>
                  Syncing... {syncState.syncProgress}%
                </Text>
              </View>
            )}

            {syncState.pendingChanges > 0 && (
              <View style={styles.statusRow}>
                <Icon name="cloud-upload" size={20} color="#FF9500" />
                <Text style={styles.statusText}>
                  {syncState.pendingChanges} pending changes
                </Text>
              </View>
            )}

            {syncState.syncError && (
              <View style={styles.statusRow}>
                <Icon name="alert-circle" size={20} color="#FF6B6B" />
                <Text style={[styles.statusText, { color: '#FF6B6B' }]}>
                  {syncState.syncError}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Data Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Status</Text>
          
          {Object.entries(dataFreshness).map(([key, timestamp]) => (
            <View key={key} style={styles.dataRow}>
              <View style={styles.dataInfo}>
                <Text style={styles.dataType}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text style={styles.dataTime}>
                  {formatLastSyncTime(timestamp)}
                </Text>
              </View>
              <View style={styles.dataActions}>
                <View
                  style={[
                    styles.dataStatus,
                    { backgroundColor: getDataStatusColor(timestamp) }
                  ]}
                />
                <TouchableOpacity
                  onPress={() => handleSpecificSync(key as any)}
                  disabled={syncState.isSyncing}
                  style={styles.syncButton}
                >
                  <Icon name="sync" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Conflicts ({conflicts.length})
              </Text>
              <TouchableOpacity
                onPress={() => dispatch(clearResolvedConflicts())}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear Resolved</Text>
              </TouchableOpacity>
            </View>

            {conflicts.map((conflict) => (
              <TouchableOpacity
                key={conflict.id}
                style={styles.conflictItem}
                onPress={() => handleConflictPress(conflict)}
              >
                <Icon name="alert-circle" size={20} color="#FF9500" />
                <View style={styles.conflictInfo}>
                  <Text style={styles.conflictTitle}>
                    {conflict.type} - {conflict.field}
                  </Text>
                  <Text style={styles.conflictTime}>
                    {formatLastSyncTime(conflict.timestamp)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Sync</Text>
            <TouchableOpacity
              onPress={handleToggleAutoSync}
              style={[
                styles.toggle,
                syncState.autoSyncEnabled && styles.toggleActive
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  syncState.autoSyncEnabled && styles.toggleThumbActive
                ]}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleChangeSyncInterval}
          >
            <Text style={styles.settingLabel}>Sync Interval</Text>
            <Text style={styles.settingValue}>
              {syncState.syncInterval < 60
                ? `${syncState.syncInterval}m`
                : `${syncState.syncInterval / 60}h`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              syncState.isSyncing && styles.disabledButton
            ]}
            onPress={handleFullSync}
            disabled={syncState.isSyncing || !syncState.isOnline}
          >
            {syncState.isSyncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="sync" size={20} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>
              {syncState.isSyncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderConflictModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dataInfo: {
    flex: 1,
  },
  dataType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dataTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dataActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  syncButton: {
    padding: 8,
  },
  conflictItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    marginBottom: 8,
  },
  conflictInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conflictTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  conflictTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#4ECDC4',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  actions: {
    marginVertical: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  conflictDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  conflictOptions: {
    gap: 12,
  },
  conflictOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  conflictOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  conflictOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  conflictOptionValue: {
    fontSize: 12,
    color: '#666',
  },
});

export default SyncStatus;
