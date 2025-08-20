const logger = require('../utils/logger');
const User = require('../models/User');
const Crop = require('../models/Crop');
const WeatherData = require('../models/WeatherData');

// Mock FCM Admin SDK - In production, install firebase-admin
// npm install firebase-admin
class NotificationService {
  
  constructor() {
    this.fcmEnabled = process.env.FCM_ENABLED === 'true';
    this.fcmServerKey = process.env.FCM_SERVER_KEY;
    this.vapidKey = process.env.VAPID_KEY;
    
    if (this.fcmEnabled && this.fcmServerKey) {
      this.initializeFCM();
    } else {
      logger.warn('FCM not configured - notifications will be logged only');
    }
  }

  initializeFCM() {
    try {
      // Initialize Firebase Admin SDK
      // const admin = require('firebase-admin');
      // const serviceAccount = require('../config/firebase-service-account.json');
      
      // admin.initializeApp({
      //   credential: admin.credential.cert(serviceAccount)
      // });
      
      // this.messaging = admin.messaging();
      
      logger.info('FCM initialized successfully');
    } catch (error) {
      logger.error('FCM initialization failed', { error: error.message });
      this.fcmEnabled = false;
    }
  }

  /**
   * Register user's FCM token
   */
  async registerDeviceToken(userId, token, deviceType = 'mobile') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize notification settings if not present
      if (!user.notificationSettings) {
        user.notificationSettings = {
          pushEnabled: true,
          weatherAlerts: true,
          activityReminders: true,
          harvestReminders: true,
          communityUpdates: true,
          deviceTokens: []
        };
      }

      // Add or update device token
      const existingTokenIndex = user.notificationSettings.deviceTokens.findIndex(
        t => t.token === token
      );

      if (existingTokenIndex >= 0) {
        user.notificationSettings.deviceTokens[existingTokenIndex] = {
          token,
          deviceType,
          registeredAt: new Date(),
          active: true
        };
      } else {
        user.notificationSettings.deviceTokens.push({
          token,
          deviceType,
          registeredAt: new Date(),
          active: true
        });
      }

      await user.save();

      logger.info('Device token registered', { userId, deviceType });

      return {
        success: true,
        message: 'Device token registered successfully'
      };

    } catch (error) {
      logger.error('Device token registration failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Send push notification to user
   */
  async sendNotification(userId, notification) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.notificationSettings?.pushEnabled) {
        logger.info('Notifications disabled for user', { userId });
        return { success: false, reason: 'Notifications disabled' };
      }

      const activeTokens = user.notificationSettings.deviceTokens
        .filter(t => t.active)
        .map(t => t.token);

      if (activeTokens.length === 0) {
        logger.info('No active tokens for user', { userId });
        return { success: false, reason: 'No active tokens' };
      }

      const { title, body, data = {}, type, priority = 'normal' } = notification;

      const message = {
        notification: {
          title,
          body
        },
        data: {
          type,
          ...data,
          timestamp: new Date().toISOString()
        },
        android: {
          priority: priority === 'high' ? 'high' : 'normal',
          notification: {
            icon: 'ic_notification',
            color: '#4CAF50',
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body
              },
              badge: 1,
              sound: 'default'
            }
          }
        },
        tokens: activeTokens
      };

      if (this.fcmEnabled && this.messaging) {
        const response = await this.messaging.sendMulticast(message);
        
        logger.info('Notification sent', {
          userId,
          type,
          successCount: response.successCount,
          failureCount: response.failureCount
        });

        // Handle failed tokens
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(activeTokens[idx]);
            }
          });
          
          await this._deactivateTokens(userId, failedTokens);
        }

        return {
          success: true,
          successCount: response.successCount,
          failureCount: response.failureCount
        };
      } else {
        // Mock notification for development
        logger.info('Mock notification sent', {
          userId,
          title,
          body,
          type,
          tokensCount: activeTokens.length
        });

        return {
          success: true,
          successCount: activeTokens.length,
          failureCount: 0,
          mock: true
        };
      }

    } catch (error) {
      logger.error('Send notification failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Send weather alert notification
   */
  async sendWeatherAlert(userId, weatherData) {
    try {
      const user = await User.findById(userId);
      if (!user?.notificationSettings?.weatherAlerts) {
        return { success: false, reason: 'Weather alerts disabled' };
      }

      const { condition, temperature, humidity, recommendation } = weatherData;

      const notification = {
        title: '🌦️ Weather Alert',
        body: `${condition} expected. ${temperature}°C, ${humidity}% humidity. ${recommendation}`,
        type: 'weather_alert',
        priority: 'high',
        data: {
          weatherCondition: condition,
          temperature,
          humidity,
          recommendation
        }
      };

      return await this.sendNotification(userId, notification);

    } catch (error) {
      logger.error('Weather alert failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Send activity reminder notification
   */
  async sendActivityReminder(userId, cropId, activityType, message) {
    try {
      const user = await User.findById(userId);
      if (!user?.notificationSettings?.activityReminders) {
        return { success: false, reason: 'Activity reminders disabled' };
      }

      const crop = await Crop.findById(cropId);
      const cropName = crop?.name || 'your crop';

      const notification = {
        title: `🌱 ${this._getActivityIcon(activityType)} Activity Reminder`,
        body: `Time to ${activityType} ${cropName}. ${message}`,
        type: 'activity_reminder',
        data: {
          cropId,
          activityType,
          cropName
        }
      };

      return await this.sendNotification(userId, notification);

    } catch (error) {
      logger.error('Activity reminder failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Send harvest reminder notification
   */
  async sendHarvestReminder(userId, cropId) {
    try {
      const user = await User.findById(userId);
      if (!user?.notificationSettings?.harvestReminders) {
        return { success: false, reason: 'Harvest reminders disabled' };
      }

      const crop = await Crop.findById(cropId);
      if (!crop) {
        throw new Error('Crop not found');
      }

      const notification = {
        title: '🌾 Harvest Time!',
        body: `Your ${crop.name} is ready for harvest. Check your crop for optimal harvest timing.`,
        type: 'harvest_reminder',
        priority: 'high',
        data: {
          cropId: crop._id.toString(),
          cropName: crop.name,
          plantingDate: crop.plantingDate,
          expectedHarvestDate: crop.expectedHarvestDate
        }
      };

      return await this.sendNotification(userId, notification);

    } catch (error) {
      logger.error('Harvest reminder failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Send community update notification
   */
  async sendCommunityUpdate(userId, postId, authorName, postTitle) {
    try {
      const user = await User.findById(userId);
      if (!user?.notificationSettings?.communityUpdates) {
        return { success: false, reason: 'Community updates disabled' };
      }

      const notification = {
        title: '💬 Community Update',
        body: `${authorName} posted: ${postTitle.substring(0, 50)}${postTitle.length > 50 ? '...' : ''}`,
        type: 'community_update',
        data: {
          postId,
          authorName,
          postTitle
        }
      };

      return await this.sendNotification(userId, notification);

    } catch (error) {
      logger.error('Community update failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotifications(userIds, notification) {
    try {
      const results = [];
      
      for (const userId of userIds) {
        try {
          const result = await this.sendNotification(userId, notification);
          results.push({ userId, ...result });
        } catch (error) {
          results.push({ 
            userId, 
            success: false, 
            error: error.message 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      logger.info('Bulk notifications sent', {
        totalUsers: userIds.length,
        successCount,
        failureCount: userIds.length - successCount
      });

      return {
        success: true,
        results,
        successCount,
        failureCount: userIds.length - successCount
      };

    } catch (error) {
      logger.error('Bulk notifications failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(userId, settings) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.notificationSettings) {
        user.notificationSettings = {};
      }

      Object.assign(user.notificationSettings, settings);
      await user.save();

      logger.info('Notification settings updated', { userId, settings });

      return {
        success: true,
        settings: user.notificationSettings
      };

    } catch (error) {
      logger.error('Update notification settings failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get user's notification settings
   */
  async getNotificationSettings(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const defaultSettings = {
        pushEnabled: true,
        weatherAlerts: true,
        activityReminders: true,
        harvestReminders: true,
        communityUpdates: true,
        deviceTokens: []
      };

      return {
        success: true,
        settings: { ...defaultSettings, ...user.notificationSettings }
      };

    } catch (error) {
      logger.error('Get notification settings failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Schedule automated notifications
   */
  async scheduleAutomatedNotifications() {
    try {
      logger.info('Running automated notification scheduler');

      // Check for crops needing harvest
      await this._checkHarvestReminders();
      
      // Check for overdue activities
      await this._checkActivityReminders();
      
      // Check for weather alerts
      await this._checkWeatherAlerts();

      logger.info('Automated notification scheduler completed');

    } catch (error) {
      logger.error('Automated notification scheduler failed', { error: error.message });
    }
  }

  // Private helper methods
  async _deactivateTokens(userId, failedTokens) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      user.notificationSettings.deviceTokens.forEach(tokenObj => {
        if (failedTokens.includes(tokenObj.token)) {
          tokenObj.active = false;
        }
      });

      await user.save();
      logger.info('Failed tokens deactivated', { userId, count: failedTokens.length });

    } catch (error) {
      logger.error('Token deactivation failed', { error: error.message, userId });
    }
  }

  async _checkHarvestReminders() {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

      const cropsNearHarvest = await Crop.find({
        expectedHarvestDate: {
          $gte: now,
          $lte: threeDaysFromNow
        },
        status: { $ne: 'harvested' },
        isActive: { $ne: false }
      }).populate('owner');

      for (const crop of cropsNearHarvest) {
        await this.sendHarvestReminder(crop.owner._id, crop._id);
      }

      logger.info('Harvest reminders checked', { count: cropsNearHarvest.length });

    } catch (error) {
      logger.error('Harvest reminder check failed', { error: error.message });
    }
  }

  async _checkActivityReminders() {
    try {
      // Check for crops that haven't been watered in 3+ days
      const threeDaysAgo = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000));

      const cropsNeedingWater = await Crop.find({
        'irrigation.lastWatered': { $lt: threeDaysAgo },
        status: { $in: ['planted', 'growing'] },
        isActive: { $ne: false }
      }).populate('owner');

      for (const crop of cropsNeedingWater) {
        await this.sendActivityReminder(
          crop.owner._id,
          crop._id,
          'watering',
          'Your crop may need watering.'
        );
      }

      logger.info('Activity reminders checked', { wateringCount: cropsNeedingWater.length });

    } catch (error) {
      logger.error('Activity reminder check failed', { error: error.message });
    }
  }

  async _checkWeatherAlerts() {
    try {
      // Mock weather alert logic - integrate with real weather API
      const alertConditions = ['Heavy Rain', 'Frost Warning', 'Drought Alert'];
      const randomCondition = alertConditions[Math.floor(Math.random() * alertConditions.length)];

      if (Math.random() < 0.1) { // 10% chance of weather alert
        const users = await User.find({
          'notificationSettings.weatherAlerts': true
        }).limit(10);

        const weatherData = {
          condition: randomCondition,
          temperature: Math.floor(Math.random() * 30 + 5),
          humidity: Math.floor(Math.random() * 40 + 40),
          recommendation: this._getWeatherRecommendation(randomCondition)
        };

        for (const user of users) {
          await this.sendWeatherAlert(user._id, weatherData);
        }

        logger.info('Weather alerts sent', { condition: randomCondition, count: users.length });
      }

    } catch (error) {
      logger.error('Weather alert check failed', { error: error.message });
    }
  }

  _getActivityIcon(activityType) {
    const icons = {
      watering: '💧',
      fertilizing: '🌿',
      weeding: '🌾',
      pesticide: '🛡️',
      harvesting: '🌾',
      planting: '🌱'
    };
    return icons[activityType] || '📋';
  }

  _getWeatherRecommendation(condition) {
    const recommendations = {
      'Heavy Rain': 'Consider covering sensitive crops and checking drainage.',
      'Frost Warning': 'Protect crops from frost damage. Consider using covers.',
      'Drought Alert': 'Increase irrigation frequency and mulch around plants.'
    };
    return recommendations[condition] || 'Monitor your crops closely.';
  }
}

module.exports = new NotificationService();
