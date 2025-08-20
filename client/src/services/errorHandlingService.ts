import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert, ToastAndroid, Platform } from 'react-native';
import apiService from './apiService';
import { offlineService } from './offlineService';

export interface ErrorContext {
  action: string;
  screen: string;
  userId?: string;
  timestamp: Date;
  networkState?: any;
  additionalData?: any;
}

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  exponentialBackoff: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface ErrorMetrics {
  errorType: string;
  count: number;
  lastOccurrence: Date;
  resolved: boolean;
  userImpact: 'low' | 'medium' | 'high';
}

export interface UserFriendlyError {
  title: string;
  message: string;
  actionText?: string;
  action?: () => void;
  severity: 'info' | 'warning' | 'error' | 'critical';
  showRetry: boolean;
  showOfflineMode: boolean;
}

class ErrorHandlingService {
  private errorQueue: any[] = [];
  private errorMetrics: Map<string, ErrorMetrics> = new Map();
  private isOnline = true;

  constructor() {
    this.initializeNetworkListener();
    this.loadErrorMetrics();
  }

  /**
   * Initialize network state listener
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected || false;
      
      // Process queued errors when back online
      if (this.isOnline && this.errorQueue.length > 0) {
        this.processErrorQueue();
      }
    });
  }

  /**
   * Load error metrics from storage
   */
  private async loadErrorMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('error_metrics');
      if (stored) {
        const metrics = JSON.parse(stored);
        this.errorMetrics = new Map(Object.entries(metrics));
      }
    } catch (error) {
      console.error('❌ Failed to load error metrics:', error);
    }
  }

  /**
   * Save error metrics to storage
   */
  private async saveErrorMetrics(): Promise<void> {
    try {
      const metricsObj = Object.fromEntries(this.errorMetrics);
      await AsyncStorage.setItem('error_metrics', JSON.stringify(metricsObj));
    } catch (error) {
      console.error('❌ Failed to save error metrics:', error);
    }
  }

  /**
   * Handle error with comprehensive processing
   */
  async handleError(
    error: any, 
    context: ErrorContext, 
    showToUser = true
  ): Promise<UserFriendlyError> {
    try {
      // Create standardized error object
      const standardizedError = this.standardizeError(error, context);
      
      // Track error metrics
      this.trackError(standardizedError);
      
      // Create user-friendly error
      const userError = this.createUserFriendlyError(standardizedError, context);
      
      // Queue error for reporting if offline
      if (!this.isOnline) {
        this.queueError(standardizedError, context);
      } else {
        // Report error immediately
        await this.reportError(standardizedError, context);
      }
      
      // Show error to user if requested
      if (showToUser) {
        this.displayError(userError);
      }
      
      return userError;
      
    } catch (handlingError) {
      console.error('❌ Error in error handling:', handlingError);
      
      // Fallback error display
      const fallbackError: UserFriendlyError = {
        title: 'Something went wrong',
        message: 'An unexpected error occurred. Please try again.',
        severity: 'error',
        showRetry: true,
        showOfflineMode: false,
      };
      
      if (showToUser) {
        this.displayError(fallbackError);
      }
      
      return fallbackError;
    }
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    context: ErrorContext
  ): Promise<T> {
    let lastError: any;
    let delay = config.delayMs;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (config.retryCondition && !config.retryCondition(error)) {
          break;
        }
        
        // Don't wait after the last attempt
        if (attempt < config.maxAttempts) {
          console.log(`⏳ Retry attempt ${attempt}/${config.maxAttempts} in ${delay}ms`);
          await this.delay(delay);
          
          // Apply exponential backoff
          if (config.exponentialBackoff) {
            delay *= 2;
          }
        }
      }
    }

    // All retries failed, handle the error
    throw await this.handleError(lastError, {
      ...context,
      action: `${context.action}_retry_failed`,
      additionalData: {
        ...context.additionalData,
        attempts: config.maxAttempts,
        finalDelay: delay,
      }
    });
  }

  /**
   * Standardize error object
   */
  private standardizeError(error: any, context: ErrorContext): any {
    return {
      name: error.name || 'UnknownError',
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      networkError: !this.isOnline,
      timestamp: new Date(),
      context,
      id: this.generateErrorId(),
    };
  }

  /**
   * Create user-friendly error message
   */
  private createUserFriendlyError(error: any, context: ErrorContext): UserFriendlyError {
    // Network errors
    if (error.networkError || error.code === 'NETWORK_ERROR') {
      return {
        title: 'Connection Problem',
        message: 'Please check your internet connection and try again.',
        actionText: 'Use Offline Mode',
        action: () => this.switchToOfflineMode(),
        severity: 'warning',
        showRetry: true,
        showOfflineMode: true,
      };
    }

    // Server errors (5xx)
    if (error.status >= 500) {
      return {
        title: 'Server Error',
        message: 'Our servers are experiencing issues. Please try again in a few minutes.',
        actionText: 'Try Again',
        severity: 'error',
        showRetry: true,
        showOfflineMode: true,
      };
    }

    // Authentication errors (401)
    if (error.status === 401) {
      return {
        title: 'Authentication Required',
        message: 'Please log in again to continue.',
        actionText: 'Log In',
        action: () => this.navigateToLogin(),
        severity: 'warning',
        showRetry: false,
        showOfflineMode: false,
      };
    }

    // Permission errors (403)
    if (error.status === 403) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        severity: 'warning',
        showRetry: false,
        showOfflineMode: false,
      };
    }

    // Validation errors (400)
    if (error.status === 400) {
      return {
        title: 'Invalid Data',
        message: error.message || 'Please check your input and try again.',
        severity: 'info',
        showRetry: false,
        showOfflineMode: false,
      };
    }

    // Not found errors (404)
    if (error.status === 404) {
      return {
        title: 'Not Found',
        message: 'The requested information could not be found.',
        severity: 'info',
        showRetry: false,
        showOfflineMode: true,
      };
    }

    // Data sync errors
    if (error.name === 'SyncError') {
      return {
        title: 'Sync Problem',
        message: 'Unable to sync your data. Your changes are saved locally.',
        actionText: 'Retry Sync',
        action: () => this.retrySync(),
        severity: 'warning',
        showRetry: true,
        showOfflineMode: false,
      };
    }

    // Storage errors
    if (error.name === 'StorageError') {
      return {
        title: 'Storage Issue',
        message: 'Unable to save data locally. Please free up some device storage.',
        severity: 'error',
        showRetry: true,
        showOfflineMode: false,
      };
    }

    // Generic error
    return {
      title: 'Something Went Wrong',
      message: this.getGenericErrorMessage(context.action),
      severity: 'error',
      showRetry: true,
      showOfflineMode: this.canWorkOffline(context.action),
    };
  }

  /**
   * Display error to user
   */
  private displayError(error: UserFriendlyError): void {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        error.message,
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM
      );
    }

    // For important errors, show alert
    if (error.severity === 'error' || error.severity === 'critical') {
      const buttons: any[] = [
        { text: 'OK', style: 'default' }
      ];

      if (error.showRetry) {
        buttons.unshift({
          text: 'Retry',
          onPress: error.action || (() => {}),
        });
      }

      if (error.showOfflineMode) {
        buttons.unshift({
          text: 'Use Offline',
          onPress: () => this.switchToOfflineMode(),
        });
      }

      Alert.alert(error.title, error.message, buttons);
    }
  }

  /**
   * Track error metrics
   */
  private trackError(error: any): void {
    const errorKey = `${error.name}_${error.status || 'unknown'}`;
    const existing = this.errorMetrics.get(errorKey);

    if (existing) {
      existing.count++;
      existing.lastOccurrence = new Date();
      existing.resolved = false;
    } else {
      this.errorMetrics.set(errorKey, {
        errorType: errorKey,
        count: 1,
        lastOccurrence: new Date(),
        resolved: false,
        userImpact: this.determineUserImpact(error),
      });
    }

    // Save metrics periodically
    this.saveErrorMetrics();
  }

  /**
   * Queue error for later reporting
   */
  private queueError(error: any, context: ErrorContext): void {
    this.errorQueue.push({ error, context, timestamp: new Date() });
    
    // Limit queue size to prevent memory issues
    if (this.errorQueue.length > 100) {
      this.errorQueue.shift();
    }
  }

  /**
   * Process queued errors when back online
   */
  private async processErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    console.log(`📤 Processing ${this.errorQueue.length} queued errors...`);

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const { error, context } of errors) {
      try {
        await this.reportError(error, context);
      } catch (reportError) {
        console.error('❌ Failed to report queued error:', reportError);
        // Re-queue if reporting fails
        this.errorQueue.push({ error, context, timestamp: new Date() });
      }
    }
  }

  /**
   * Report error to backend
   */
  private async reportError(error: any, context: ErrorContext): Promise<void> {
    try {
      await apiService.post('/errors/report', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
          status: error.status,
        },
        context,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        },
        appVersion: '1.0.0', // TODO: Get from app config
      });
      
      console.log('✅ Error reported to backend');
    } catch (reportError) {
      console.error('❌ Failed to report error to backend:', reportError);
      throw reportError;
    }
  }

  /**
   * Get default retry configuration
   */
  getDefaultRetryConfig(): RetryConfig {
    return {
      maxAttempts: 3,
      delayMs: 1000,
      exponentialBackoff: true,
      retryCondition: (error: any) => {
        // Retry network errors and 5xx server errors
        return error.code === 'NETWORK_ERROR' || 
               (error.status >= 500 && error.status < 600);
      },
    };
  }

  /**
   * Get retry config for API calls
   */
  getAPIRetryConfig(): RetryConfig {
    return {
      maxAttempts: 2,
      delayMs: 500,
      exponentialBackoff: true,
      retryCondition: (error: any) => {
        return error.status >= 500 && error.status < 600;
      },
    };
  }

  /**
   * Get retry config for sync operations
   */
  getSyncRetryConfig(): RetryConfig {
    return {
      maxAttempts: 5,
      delayMs: 2000,
      exponentialBackoff: true,
      retryCondition: (error: any) => {
        return error.code === 'NETWORK_ERROR' || error.status === 503;
      },
    };
  }

  /**
   * Utility methods
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineUserImpact(error: any): 'low' | 'medium' | 'high' {
    if (error.status >= 500) return 'high';
    if (error.code === 'NETWORK_ERROR') return 'medium';
    if (error.status === 401 || error.status === 403) return 'medium';
    return 'low';
  }

  private getGenericErrorMessage(action: string): string {
    const messages: { [key: string]: string } = {
      'fetch_crops': 'Unable to load your crops. Please try again.',
      'save_crop': 'Unable to save crop information. Please try again.',
      'delete_crop': 'Unable to delete crop. Please try again.',
      'sync_data': 'Unable to sync your data. Your changes are saved locally.',
      'load_weather': 'Unable to load weather information. Please try again.',
      'save_activity': 'Unable to save activity. Please try again.',
      'load_community': 'Unable to load community posts. Please try again.',
    };
    
    return messages[action] || 'Unable to complete the action. Please try again.';
  }

  private canWorkOffline(action: string): boolean {
    const offlineActions = [
      'fetch_crops', 'save_crop', 'delete_crop', 'save_activity', 
      'view_crop_details', 'browse_crops'
    ];
    
    return offlineActions.includes(action);
  }

  private switchToOfflineMode(): void {
    // TODO: Implement offline mode switch
    console.log('🔄 Switching to offline mode...');
    
    if (Platform.OS === 'android') {
      ToastAndroid.show(
        'Offline mode enabled. Your changes will sync when connection is restored.',
        ToastAndroid.LONG
      );
    }
  }

  private navigateToLogin(): void {
    // TODO: Implement navigation to login screen
    console.log('🔄 Navigating to login...');
  }

  private retrySync(): void {
    // TODO: Implement sync retry
    console.log('🔄 Retrying sync...');
    offlineService.performFullSync().catch(error => {
      console.error('❌ Sync retry failed:', error);
    });
  }

  /**
   * Get error metrics for analytics
   */
  getErrorMetrics(): ErrorMetrics[] {
    return Array.from(this.errorMetrics.values());
  }

  /**
   * Mark error as resolved
   */
  markErrorResolved(errorType: string): void {
    const metric = this.errorMetrics.get(errorType);
    if (metric) {
      metric.resolved = true;
      this.saveErrorMetrics();
    }
  }

  /**
   * Clear old error metrics
   */
  async clearOldMetrics(olderThanDays = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    for (const [key, metric] of this.errorMetrics.entries()) {
      if (metric.lastOccurrence < cutoffDate && metric.resolved) {
        this.errorMetrics.delete(key);
      }
    }

    await this.saveErrorMetrics();
  }

  /**
   * Get critical errors that need attention
   */
  getCriticalErrors(): ErrorMetrics[] {
    return Array.from(this.errorMetrics.values())
      .filter(metric => 
        metric.userImpact === 'high' && 
        !metric.resolved && 
        metric.count > 3
      );
  }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService();
