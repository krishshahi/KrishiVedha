import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { errorHandlingService } from '../services/errorHandlingService';
import { selectIsOnline } from '../store/slices/syncSlice';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType<{
    error: Error;
    retry: () => void;
    goHome: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  showDetails?: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
      errorId: this.generateErrorId(),
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to error handling service
    this.reportError(error, errorInfo);
  }

  generateErrorId(): string {
    return `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async reportError(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await errorHandlingService.handleError(error, {
        action: 'component_error',
        screen: 'error_boundary',
        timestamp: new Date(),
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      }, false); // Don't show to user as ErrorBoundary will handle display
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  retry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      Alert.alert(
        'Maximum Retries Reached',
        'This error keeps occurring. Please restart the app or contact support.',
        [
          { text: 'Go Home', onPress: this.goHome },
          { text: 'Restart App', onPress: this.restartApp },
        ]
      );
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }));

    // Clear error state to retry
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }, 100);
  };

  goHome = () => {
    // Reset error state and navigate to home
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
    
    // TODO: Navigate to home screen
    console.log('Navigate to home');
  };

  restartApp = () => {
    // For React Native, we can't truly restart the app from JS
    // This would typically involve native methods or app restart libraries
    if (Platform.OS === 'android') {
      // On Android, we might use react-native-restart
      console.log('Restart app (Android)');
    } else {
      // On iOS, show instructions to user
      Alert.alert(
        'Restart Required',
        'Please close and reopen the app to continue.',
        [{ text: 'OK' }]
      );
    }
  };

  reportIssue = () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (!error || !errorId) return;

    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      version: Platform.Version,
    };

    // TODO: Implement issue reporting (email, in-app feedback, etc.)
    Alert.alert(
      'Report Issue',
      'Would you like to send this error report to help us fix the issue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Report',
          onPress: () => {
            console.log('Send error report:', errorReport);
            // Implement actual reporting mechanism
          },
        },
      ]
    );
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    const { hasError, error, retryCount } = this.state;
    const { 
      children, 
      fallbackComponent: FallbackComponent, 
      enableRetry = true,
      maxRetries = 3,
      showDetails = false,
    } = this.props;

    if (hasError && error) {
      // Use custom fallback component if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            retry={this.retry}
            goHome={this.goHome}
          />
        );
      }

      // Default error UI
      return <ErrorFallback 
        error={error}
        retry={enableRetry ? this.retry : undefined}
        goHome={this.goHome}
        reportIssue={this.reportIssue}
        retryCount={retryCount}
        maxRetries={maxRetries}
        showDetails={showDetails}
      />;
    }

    return children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  retry?: () => void;
  goHome: () => void;
  reportIssue: () => void;
  retryCount: number;
  maxRetries: number;
  showDetails: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  retry,
  goHome,
  reportIssue,
  retryCount,
  maxRetries,
  showDetails,
}) => {
  const isOnline = useSelector(selectIsOnline);
  const [showDetailedError, setShowDetailedError] = React.useState(false);

  const getErrorMessage = () => {
    // Provide user-friendly error messages based on error type
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Connection Problem',
        description: isOnline 
          ? 'Unable to connect to our servers. Please try again.'
          : 'You\'re currently offline. Please check your internet connection.',
        icon: 'wifi-off',
        color: '#FF9500',
      };
    }
    
    if (message.includes('timeout')) {
      return {
        title: 'Request Timeout',
        description: 'The request took too long to complete. Please try again.',
        icon: 'clock-alert',
        color: '#FF9500',
      };
    }
    
    if (message.includes('unauthorized') || message.includes('auth')) {
      return {
        title: 'Authentication Error',
        description: 'Please log in again to continue.',
        icon: 'account-alert',
        color: '#FF6B6B',
      };
    }
    
    if (message.includes('permission') || message.includes('forbidden')) {
      return {
        title: 'Permission Denied',
        description: 'You don\'t have permission to access this feature.',
        icon: 'lock-alert',
        color: '#FF6B6B',
      };
    }
    
    // Generic error
    return {
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred. We\'re working to fix it.',
      icon: 'alert-circle',
      color: '#FF6B6B',
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Icon 
            name={errorInfo.icon} 
            size={80} 
            color={errorInfo.color} 
          />
        </View>
        
        <Text style={styles.title}>{errorInfo.title}</Text>
        <Text style={styles.description}>{errorInfo.description}</Text>

        {!isOnline && (
          <View style={styles.offlineNotice}>
            <Icon name="wifi-off" size={16} color="#FF9500" />
            <Text style={styles.offlineText}>
              You're currently offline. Some features may not work properly.
            </Text>
          </View>
        )}

        {retryCount > 0 && (
          <View style={styles.retryInfo}>
            <Text style={styles.retryText}>
              Retry attempt {retryCount} of {maxRetries}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {retry && retryCount < maxRetries && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={retry}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={goHome}
          >
            <Icon name="home" size={20} color="#4ECDC4" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Go Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={reportIssue}
          >
            <Icon name="bug" size={20} color="#666" />
            <Text style={[styles.buttonText, styles.tertiaryButtonText]}>
              Report Issue
            </Text>
          </TouchableOpacity>
        </View>

        {(showDetails || __DEV__) && (
          <View style={styles.detailsSection}>
            <TouchableOpacity
              style={styles.detailsToggle}
              onPress={() => setShowDetailedError(!showDetailedError)}
            >
              <Text style={styles.detailsToggleText}>
                {showDetailedError ? 'Hide' : 'Show'} Technical Details
              </Text>
              <Icon 
                name={showDetailedError ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>

            {showDetailedError && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Message:</Text>
                <Text style={styles.errorDetailsText}>{error.message}</Text>
                
                {error.stack && (
                  <>
                    <Text style={styles.errorDetailsTitle}>Stack Trace:</Text>
                    <ScrollView style={styles.stackTrace} horizontal>
                      <Text style={styles.errorDetailsText}>{error.stack}</Text>
                    </ScrollView>
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  offlineText: {
    fontSize: 14,
    color: '#FF9500',
    marginLeft: 8,
    flex: 1,
  },
  retryInfo: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 24,
  },
  retryText: {
    fontSize: 12,
    color: '#4ECDC4',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#4ECDC4',
  },
  tertiaryButtonText: {
    color: '#666',
  },
  detailsSection: {
    width: '100%',
    marginTop: 40,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  errorDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 16,
  },
  stackTrace: {
    maxHeight: 200,
  },
});

// HOC wrapper for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  return (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
