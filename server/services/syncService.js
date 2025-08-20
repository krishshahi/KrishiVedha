const logger = require('../utils/logger');
const User = require('../models/User');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const CommunityPost = require('../models/Community');

class SyncService {
  
  /**
   * Get data changes since last sync timestamp
   */
  static async getChangesSince(userId, lastSyncTimestamp, collections = ['farms', 'crops', 'activities', 'posts']) {
    try {
      const changes = {};
      const syncTime = new Date(lastSyncTimestamp || 0);
      
      logger.info('Getting changes since', { userId, lastSyncTimestamp, collections });

      // Get farms changes
      if (collections.includes('farms')) {
        changes.farms = await Farm.find({
          owner: userId,
          $or: [
            { updatedAt: { $gt: syncTime } },
            { createdAt: { $gt: syncTime } }
          ]
        }).lean();
      }

      // Get crops changes  
      if (collections.includes('crops')) {
        changes.crops = await Crop.find({
          owner: userId,
          $or: [
            { updatedAt: { $gt: syncTime } },
            { createdAt: { $gt: syncTime } }
          ]
        }).populate('farm', 'name').lean();
      }

      // Get activity changes (embedded in crops)
      if (collections.includes('activities')) {
        const cropsWithNewActivities = await Crop.aggregate([
          { $match: { owner: userId } },
          { $unwind: '$activities' },
          { $match: { 
            $or: [
              { 'activities.createdAt': { $gt: syncTime } },
              { 'activities.updatedAt': { $gt: syncTime } }
            ]
          }},
          { $group: {
            _id: '$_id',
            name: { $first: '$name' },
            activities: { $push: '$activities' }
          }}
        ]);
        
        changes.activities = cropsWithNewActivities;
      }

      // Get community posts changes
      if (collections.includes('posts')) {
        changes.posts = await CommunityPost.find({
          $or: [
            { author: userId }, // User's own posts
            { updatedAt: { $gt: syncTime } } // All updated posts
          ]
        }).populate('author', 'username').lean();
      }

      const currentSyncTime = new Date().toISOString();
      
      logger.info('Sync changes retrieved', { 
        userId, 
        changesCount: {
          farms: changes.farms?.length || 0,
          crops: changes.crops?.length || 0,
          activities: changes.activities?.length || 0,
          posts: changes.posts?.length || 0
        }
      });

      return {
        success: true,
        data: changes,
        syncTimestamp: currentSyncTime,
        lastSyncTimestamp: lastSyncTimestamp
      };

    } catch (error) {
      logger.error('Sync service error', { error: error.message, userId, lastSyncTimestamp });
      throw error;
    }
  }

  /**
   * Apply offline changes to server with conflict resolution
   */
  static async applyOfflineChanges(userId, changes) {
    try {
      const results = {
        applied: [],
        conflicts: [],
        errors: []
      };

      logger.info('Applying offline changes', { userId, changesCount: changes.length });

      for (const change of changes) {
        try {
          const result = await this._applyChange(userId, change);
          results.applied.push(result);
        } catch (error) {
          if (error.type === 'CONFLICT') {
            results.conflicts.push({
              change,
              error: error.message,
              serverData: error.serverData
            });
          } else {
            results.errors.push({
              change,
              error: error.message
            });
          }
        }
      }

      logger.info('Offline changes applied', {
        userId,
        applied: results.applied.length,
        conflicts: results.conflicts.length,
        errors: results.errors.length
      });

      return results;

    } catch (error) {
      logger.error('Apply offline changes error', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Apply individual change with conflict detection
   */
  static async _applyChange(userId, change) {
    const { type, collection, id, data, clientTimestamp } = change;

    let Model;
    switch (collection) {
      case 'farms':
        Model = Farm;
        break;
      case 'crops':
        Model = Crop;
        break;
      case 'posts':
        Model = CommunityPost;
        break;
      default:
        throw new Error(`Unknown collection: ${collection}`);
    }

    if (type === 'CREATE') {
      // For creates, check if item already exists (duplicate offline creation)
      const existing = await Model.findById(id);
      if (existing) {
        return { type: 'DUPLICATE', id, message: 'Item already exists' };
      }

      const newItem = new Model({ ...data, _id: id, owner: userId });
      await newItem.save();
      
      return { type: 'CREATED', id, data: newItem.toObject() };

    } else if (type === 'UPDATE') {
      const existing = await Model.findById(id);
      
      if (!existing) {
        throw new Error('Item not found for update');
      }

      // Check for conflicts - if server version is newer than client's base version
      const serverTimestamp = existing.updatedAt.getTime();
      const clientBaseTimestamp = new Date(clientTimestamp).getTime();
      
      if (serverTimestamp > clientBaseTimestamp) {
        const conflictError = new Error('Update conflict detected');
        conflictError.type = 'CONFLICT';
        conflictError.serverData = existing.toObject();
        throw conflictError;
      }

      // Apply update
      Object.assign(existing, data);
      existing.updatedAt = new Date();
      await existing.save();

      return { type: 'UPDATED', id, data: existing.toObject() };

    } else if (type === 'DELETE') {
      const existing = await Model.findById(id);
      
      if (!existing) {
        return { type: 'ALREADY_DELETED', id, message: 'Item already deleted' };
      }

      // Soft delete by setting isActive: false
      existing.isActive = false;
      existing.updatedAt = new Date();
      await existing.save();

      return { type: 'DELETED', id };
    }
  }

  /**
   * Resolve conflict by applying server data or user choice
   */
  static async resolveConflict(userId, conflictId, resolution, userData = null) {
    try {
      // Resolution can be 'server', 'client', or 'merge'
      const conflict = await this._getConflict(conflictId);
      
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      let result;
      switch (resolution) {
        case 'server':
          result = { ...conflict.serverData };
          break;
        case 'client':
          result = await this._applyChange(userId, conflict.clientChange);
          break;
        case 'merge':
          result = await this._mergeData(conflict.serverData, userData);
          break;
        default:
          throw new Error('Invalid resolution type');
      }

      logger.info('Conflict resolved', { userId, conflictId, resolution });
      
      return result;

    } catch (error) {
      logger.error('Conflict resolution error', { error: error.message, userId, conflictId });
      throw error;
    }
  }

  /**
   * Get user's offline-capable data for initial sync
   */
  static async getFullDataSet(userId) {
    try {
      const [farms, crops, posts] = await Promise.all([
        Farm.find({ owner: userId, isActive: { $ne: false } }).lean(),
        Crop.find({ owner: userId, isActive: { $ne: false } }).populate('farm', 'name').lean(),
        CommunityPost.find({ 
          $or: [
            { author: userId },
            { isActive: true }
          ]
        }).populate('author', 'username').limit(100).lean()
      ]);

      const syncTimestamp = new Date().toISOString();

      logger.info('Full dataset retrieved', {
        userId,
        counts: {
          farms: farms.length,
          crops: crops.length,
          posts: posts.length
        }
      });

      return {
        success: true,
        data: {
          farms,
          crops,
          posts,
          syncTimestamp
        }
      };

    } catch (error) {
      logger.error('Full dataset retrieval error', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Merge server and client data (simple field-level merge)
   */
  static async _mergeData(serverData, clientData) {
    // Simple merge strategy - newer fields win
    const merged = { ...serverData };
    
    for (const [key, value] of Object.entries(clientData)) {
      if (key !== '_id' && key !== 'createdAt') {
        merged[key] = value;
      }
    }
    
    merged.updatedAt = new Date();
    
    return merged;
  }

  /**
   * Check network connectivity and data freshness
   */
  static async checkSyncHealth(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const lastSyncTime = user.lastSyncTime || new Date(0);
      const now = new Date();
      const timeSinceSync = now - lastSyncTime;
      const hoursOld = Math.floor(timeSinceSync / (1000 * 60 * 60));

      return {
        success: true,
        lastSyncTime,
        hoursOld,
        needsSync: hoursOld > 1, // Suggest sync if over 1 hour old
        serverTime: now.toISOString()
      };

    } catch (error) {
      logger.error('Sync health check error', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = SyncService;
