const logger = require('../utils/logger');

class ErrorService {
  
  /**
   * Enhanced error response formatter
   */
  static formatError(error, context = {}) {
    const { req, operation, userId } = context;
    
    const baseError = {
      success: false,
      timestamp: new Date().toISOString(),
      operation,
      requestId: req?.headers['x-request-id'] || this._generateRequestId()
    };

    // Log the error with context
    logger.error('Enhanced error occurred', {
      error: error.message,
      stack: error.stack,
      context,
      userId
    });

    // Determine error type and format response
    if (this._isNetworkError(error)) {
      return {
        ...baseError,
        error: {
          type: 'NETWORK_ERROR',
          code: 'NET_001',
          message: 'Network connection failed. Please check your internet connection and try again.',
          userMessage: 'Connection problem. Please try again.',
          retryable: true,
          retryAfter: 5000, // 5 seconds
          recovery: {
            type: 'retry',
            maxAttempts: 3,
            backoffMs: 2000
          }
        }
      };
    }

    if (this._isValidationError(error)) {
      return {
        ...baseError,
        error: {
          type: 'VALIDATION_ERROR',
          code: 'VAL_001',
          message: 'The information provided is invalid.',
          userMessage: 'Please check your input and try again.',
          retryable: false,
          details: this._extractValidationDetails(error),
          recovery: {
            type: 'fix_input',
            fields: this._getInvalidFields(error)
          }
        }
      };
    }

    if (this._isAuthenticationError(error)) {
      return {
        ...baseError,
        error: {
          type: 'AUTH_ERROR',
          code: 'AUTH_001',
          message: 'Authentication failed. Please log in again.',
          userMessage: 'Session expired. Please log in again.',
          retryable: false,
          recovery: {
            type: 'reauthenticate',
            redirectTo: '/login'
          }
        }
      };
    }

    if (this._isRateLimitError(error)) {
      return {
        ...baseError,
        error: {
          type: 'RATE_LIMIT_ERROR',
          code: 'RATE_001',
          message: 'Too many requests. Please wait before trying again.',
          userMessage: 'Slow down! Please wait a moment before trying again.',
          retryable: true,
          retryAfter: this._extractRetryAfter(error),
          recovery: {
            type: 'wait_retry',
            waitMs: this._extractRetryAfter(error) * 1000
          }
        }
      };
    }

    if (this._isNotFoundError(error)) {
      return {
        ...baseError,
        error: {
          type: 'NOT_FOUND_ERROR',
          code: 'NOT_001',
          message: 'The requested resource was not found.',
          userMessage: 'The item you\'re looking for doesn\'t exist or has been removed.',
          retryable: false,
          recovery: {
            type: 'navigate_back',
            fallbackRoute: '/dashboard'
          }
        }
      };
    }

    if (this._isOfflineError(error)) {
      return {
        ...baseError,
        error: {
          type: 'OFFLINE_ERROR',
          code: 'OFF_001',
          message: 'You appear to be offline. Changes will be saved locally.',
          userMessage: 'No internet connection. Working offline.',
          retryable: true,
          retryAfter: 10000,
          recovery: {
            type: 'offline_mode',
            enableOfflineSync: true
          }
        }
      };
    }

    if (this._isConflictError(error)) {
      return {
        ...baseError,
        error: {
          type: 'CONFLICT_ERROR',
          code: 'CONF_001',
          message: 'Conflict detected. Data has been modified by another user.',
          userMessage: 'Someone else updated this data. Please refresh and try again.',
          retryable: true,
          recovery: {
            type: 'resolve_conflict',
            conflictData: error.conflictData,
            options: ['use_server', 'use_local', 'merge']
          }
        }
      };
    }

    // Default server error
    return {
      ...baseError,
      error: {
        type: 'SERVER_ERROR',
        code: 'SVR_001',
        message: 'An unexpected error occurred. Please try again later.',
        userMessage: 'Something went wrong. Please try again.',
        retryable: true,
        retryAfter: 30000,
        recovery: {
          type: 'retry',
          maxAttempts: 1,
          backoffMs: 5000
        }
      }
    };
  }

  /**
   * Create retry configuration for operations
   */
  static createRetryConfig(operation, options = {}) {
    const defaults = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      jitter: true
    };

    const operationConfigs = {
      'api_call': { maxAttempts: 3, baseDelayMs: 2000 },
      'file_upload': { maxAttempts: 2, baseDelayMs: 5000 },
      'sync_operation': { maxAttempts: 5, baseDelayMs: 1000 },
      'auth_request': { maxAttempts: 1, baseDelayMs: 0 },
      'critical_operation': { maxAttempts: 5, baseDelayMs: 500 }
    };

    const config = {
      ...defaults,
      ...(operationConfigs[operation] || {}),
      ...options
    };

    return {
      shouldRetry: (error, attemptNumber) => {
        if (attemptNumber >= config.maxAttempts) return false;
        if (this._isNonRetryableError(error)) return false;
        return this._isRetryableError(error);
      },
      
      getDelayMs: (attemptNumber) => {
        let delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1);
        delay = Math.min(delay, config.maxDelayMs);
        
        if (config.jitter) {
          delay += Math.random() * delay * 0.1; // Add 10% jitter
        }
        
        return Math.floor(delay);
      },

      onRetry: (error, attemptNumber, nextDelayMs) => {
        logger.warn('Operation retry scheduled', {
          operation,
          attempt: attemptNumber,
          maxAttempts: config.maxAttempts,
          nextDelayMs,
          error: error.message
        });
      }
    };
  }

  /**
   * Execute operation with retry logic
   */
  static async executeWithRetry(operation, operationName, options = {}) {
    const retryConfig = this.createRetryConfig(operationName, options.retry);
    let lastError;
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          logger.info('Operation succeeded after retry', {
            operationName,
            attempt,
            totalAttempts: attempt
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        if (!retryConfig.shouldRetry(error, attempt)) {
          logger.error('Operation failed - not retryable', {
            operationName,
            attempt,
            error: error.message
          });
          break;
        }
        
        if (attempt < retryConfig.maxAttempts) {
          const delayMs = retryConfig.getDelayMs(attempt);
          retryConfig.onRetry(error, attempt, delayMs);
          
          await this._delay(delayMs);
        }
      }
    }
    
    // All retries exhausted
    logger.error('Operation failed after all retries', {
      operationName,
      totalAttempts: retryConfig.maxAttempts,
      finalError: lastError.message
    });
    
    throw lastError;
  }

  /**
   * Create user-friendly error messages
   */
  static createUserMessage(error, operation) {
    const operationMessages = {
      'save_crop': {
        network: 'Unable to save your crop information. Please check your connection.',
        validation: 'Please check your crop details and try again.',
        generic: 'Failed to save crop. Please try again.'
      },
      'upload_image': {
        network: 'Image upload failed. Please check your connection and try again.',
        file_size: 'Image is too large. Please choose a smaller image.',
        generic: 'Failed to upload image. Please try again.'
      },
      'sync_data': {
        network: 'Unable to sync your data. Working offline for now.',
        conflict: 'Data conflict detected. Please resolve conflicts and try again.',
        generic: 'Sync failed. Your changes are saved locally.'
      },
      'load_data': {
        network: 'Unable to load fresh data. Showing offline data.',
        not_found: 'The requested information is not available.',
        generic: 'Failed to load data. Please refresh and try again.'
      }
    };

    const messages = operationMessages[operation] || operationMessages.generic;
    
    if (this._isNetworkError(error)) {
      return messages.network || messages.generic;
    }
    
    if (this._isValidationError(error)) {
      return messages.validation || messages.generic;
    }
    
    if (this._isNotFoundError(error)) {
      return messages.not_found || messages.generic;
    }
    
    if (this._isConflictError(error)) {
      return messages.conflict || messages.generic;
    }
    
    return messages.generic;
  }

  /**
   * Track error patterns and metrics
   */
  static trackError(error, context = {}) {
    const errorData = {
      type: this._getErrorType(error),
      message: error.message,
      operation: context.operation,
      userId: context.userId,
      timestamp: new Date(),
      userAgent: context.req?.get('User-Agent'),
      ip: context.req?.ip,
      retryable: this._isRetryableError(error)
    };

    logger.info('Error tracked', errorData);

    // In production, you might want to send this to an analytics service
    // this._sendToAnalytics(errorData);
    
    return errorData;
  }

  /**
   * Generate user-friendly error suggestions
   */
  static generateRecoverySuggestions(error, operation) {
    const suggestions = [];

    if (this._isNetworkError(error)) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
      if (operation !== 'critical_operation') {
        suggestions.push('Continue working offline');
      }
    }

    if (this._isValidationError(error)) {
      suggestions.push('Review the information you entered');
      suggestions.push('Make sure all required fields are filled');
      if (error.details) {
        suggestions.push(`Fix issues with: ${error.details.join(', ')}`);
      }
    }

    if (this._isAuthenticationError(error)) {
      suggestions.push('Log out and log back in');
      suggestions.push('Check your credentials');
      suggestions.push('Contact support if the problem persists');
    }

    if (this._isRateLimitError(error)) {
      suggestions.push('Wait a moment before trying again');
      suggestions.push('Reduce the frequency of your requests');
    }

    if (suggestions.length === 0) {
      suggestions.push('Try again later');
      suggestions.push('Contact support if the problem persists');
    }

    return suggestions;
  }

  // Private helper methods
  static _isNetworkError(error) {
    return error.code === 'NETWORK_ERROR' || 
           error.code === 'ENOTFOUND' || 
           error.code === 'ECONNREFUSED' ||
           error.message.includes('network') ||
           error.message.includes('connection');
  }

  static _isValidationError(error) {
    return error.name === 'ValidationError' || 
           error.status === 400 ||
           error.message.includes('validation');
  }

  static _isAuthenticationError(error) {
    return error.status === 401 || 
           error.name === 'UnauthorizedError' ||
           error.message.includes('unauthorized') ||
           error.message.includes('authentication');
  }

  static _isRateLimitError(error) {
    return error.status === 429 ||
           error.message.includes('rate limit') ||
           error.message.includes('too many requests');
  }

  static _isNotFoundError(error) {
    return error.status === 404 ||
           error.message.includes('not found');
  }

  static _isOfflineError(error) {
    return error.code === 'OFFLINE_ERROR' ||
           error.message.includes('offline') ||
           !navigator.onLine;
  }

  static _isConflictError(error) {
    return error.status === 409 ||
           error.type === 'CONFLICT' ||
           error.message.includes('conflict');
  }

  static _isRetryableError(error) {
    return this._isNetworkError(error) ||
           this._isRateLimitError(error) ||
           error.status >= 500 ||
           this._isOfflineError(error);
  }

  static _isNonRetryableError(error) {
    return this._isValidationError(error) ||
           this._isAuthenticationError(error) ||
           this._isNotFoundError(error) ||
           error.status === 400 ||
           error.status === 403;
  }

  static _getErrorType(error) {
    if (this._isNetworkError(error)) return 'network';
    if (this._isValidationError(error)) return 'validation';
    if (this._isAuthenticationError(error)) return 'authentication';
    if (this._isRateLimitError(error)) return 'rate_limit';
    if (this._isNotFoundError(error)) return 'not_found';
    if (this._isConflictError(error)) return 'conflict';
    return 'server';
  }

  static _extractValidationDetails(error) {
    if (error.details) {
      return error.details.map(d => d.field || d.path).filter(Boolean);
    }
    if (error.errors) {
      return Object.keys(error.errors);
    }
    return [];
  }

  static _getInvalidFields(error) {
    return this._extractValidationDetails(error);
  }

  static _extractRetryAfter(error) {
    if (error.retryAfter) return error.retryAfter;
    if (error.headers && error.headers['retry-after']) {
      return parseInt(error.headers['retry-after']) || 60;
    }
    return 60; // Default 60 seconds
  }

  static _generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  static _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ErrorService;
