const NodeCache = require('node-cache');

// Initialize cache with 5 minute TTL and check period of 60 seconds
const syncTimestampCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Cache utility for tracking sync operations to prevent excessive API calls
 */
class SyncCache {
  /**
   * Check if a sync operation was recently performed for a user
   * 
   * @param {number} userId - The user ID
   * @returns {boolean} - Whether a sync was performed recently
   */
  static wasRecentlySynced(userId) {
    const key = `sync:${userId}`;
    const lastSync = syncTimestampCache.get(key);
    
    if (!lastSync) return false;
    
    const now = Date.now();
    const timeElapsed = now - lastSync;
    
    // Consider "recent" if less than 15 seconds ago
    return timeElapsed < 15000;
  }
  
  /**
   * Record a sync operation for a user
   * 
   * @param {number} userId - The user ID
   */
  static recordSync(userId) {
    const key = `sync:${userId}`;
    syncTimestampCache.set(key, Date.now());
  }
  
  /**
   * Get the timestamp of the last sync operation for a user
   * 
   * @param {number} userId - The user ID
   * @returns {number|null} - The timestamp of the last sync or null if none
   */
  static getLastSyncTime(userId) {
    const key = `sync:${userId}`;
    return syncTimestampCache.get(key) || null;
  }
}

module.exports = SyncCache;
