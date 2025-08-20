import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import { reinitializeApiClient } from '../services/apiService';

/**
 * Network Change Detector Utility
 * 
 * This utility monitors network changes and automatically reinitializes 
 * the API client when the network connection changes, ensuring that the 
 * app always uses the correct IP address for API calls.
 */

class NetworkChangeDetector {
  private isListening = false;
  private currentNetworkType: string | null = null;
  private currentIpAddress: string | null = null;
  private unsubscribe: (() => void) | null = null;
  private isReinitializing = false;
  private reinitializationTimeout: NodeJS.Timeout | null = null;

  /**
   * Start monitoring network changes
   */
  startMonitoring() {
    if (this.isListening) {
      console.log('🌐 Network change detection already active');
      return;
    }

    console.log('🚀 Starting network change detection...');
    this.isListening = true;

    this.unsubscribe = NetInfo.addEventListener(state => {
      const { type, isConnected, details } = state;
      
      console.log('🔄 Network state changed:', {
        type,
        isConnected,
        details: details ? { ...details } : null
      });

      // Check if network type changed
      const networkTypeChanged = this.currentNetworkType !== type;
      
      // Check if IP address changed (for WiFi networks)
      let ipAddressChanged = false;
      if (type === 'wifi' && details && 'ipAddress' in details) {
        const newIpAddress = details.ipAddress as string;
        ipAddressChanged = this.currentIpAddress !== newIpAddress;
        this.currentIpAddress = newIpAddress;
      }

      // Only reinitialize API client if we're using auto-detection (no fixed URL configured)
      const hasConfiguredUrl = Constants.expoConfig?.extra?.REACT_NATIVE_API_URL;
      
      if (isConnected && (networkTypeChanged || ipAddressChanged)) {
        if (hasConfiguredUrl) {
          console.log('🎯 Network changed but using configured API URL, skipping reinitialization');
        } else {
          console.log('🔄 Significant network change detected, reinitializing API client...');
          this.handleNetworkChange(type, details);
        }
      }

      this.currentNetworkType = type;
    });
  }

  /**
   * Stop monitoring network changes
   */
  stopMonitoring() {
    if (!this.isListening) {
      return;
    }

    console.log('🛑 Stopping network change detection...');
    this.isListening = false;

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Handle network change by reinitializing API client
   */
  private async handleNetworkChange(networkType: string, details: any) {
    // Ensure no multiple reinitializations happen simultaneously
    if (this.isReinitializing) {
      console.log('🔃 Reinitialization already in progress, skipping duplicate attempt.');
      return;
    }

    this.isReinitializing = true;

    // Clear existing timeout to avoid stale reinitialization attempt
    if (this.reinitializationTimeout) {
      clearTimeout(this.reinitializationTimeout);
    }

    try {
      // Add a small delay to ensure network is stable
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!this.isReinitializing) {
        return; // Exit if reinitialization has been handled by another call
      }
      
      console.log('📡 Reinitializing API client for network change...');
      await reinitializeApiClient();
      
      console.log('✅ API client successfully reinitialized for new network');
    } catch (error) {
      console.error('❌ Failed to reinitialize API client:', error);
    } finally {
      this.isReinitializing = false;
    }
  }

  /**
   * Get current network status
   */
  async getCurrentNetworkInfo() {
    try {
      const state = await NetInfo.fetch();
      return {
        type: state.type,
        isConnected: state.isConnected,
        details: state.details,
        isReachable: state.isInternetReachable
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }

  /**
   * Test network connectivity and reinitialize if needed
   */
  async refreshNetworkConfiguration() {
    console.log('🔄 Manually refreshing network configuration...');
    
    try {
      const networkInfo = await this.getCurrentNetworkInfo();
      if (networkInfo?.isConnected) {
        await reinitializeApiClient();
        console.log('✅ Network configuration refreshed successfully');
        return true;
      } else {
        console.warn('⚠️ No network connection available');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to refresh network configuration:', error);
      return false;
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      currentNetworkType: this.currentNetworkType,
      currentIpAddress: this.currentIpAddress
    };
  }
}

// Export singleton instance
const networkChangeDetector = new NetworkChangeDetector();
export default networkChangeDetector;

// Export utility functions
export const startNetworkMonitoring = () => networkChangeDetector.startMonitoring();
export const stopNetworkMonitoring = () => networkChangeDetector.stopMonitoring();
export const refreshNetworkConfiguration = () => networkChangeDetector.refreshNetworkConfiguration();
export const getCurrentNetworkInfo = () => networkChangeDetector.getCurrentNetworkInfo();
export const getNetworkMonitoringStatus = () => networkChangeDetector.getStatus();
