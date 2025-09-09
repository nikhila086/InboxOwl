/**
 * Email Content Cache Utility
 * Provides local storage based caching for email content to reduce API calls
 */

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Maximum number of emails to cache
const MAX_CACHE_SIZE = 50;

/**
 * Gets email content from cache
 * @param {string} emailId - The email ID to look up
 * @returns {Object|null} - The cached email data or null if not found/expired
 */
export const getEmailFromCache = (emailId) => {
  try {
    const cacheKey = `email_content_${emailId}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const { timestamp, data } = JSON.parse(cachedData);
    const now = new Date().getTime();
    
    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error retrieving from email cache:', error);
    return null;
  }
};

/**
 * Stores email content in cache
 * @param {string} emailId - The email ID to use as key
 * @param {Object} data - The email data to cache
 */
export const cacheEmail = (emailId, data) => {
  try {
    const cacheKey = `email_content_${emailId}`;
    const cacheEntry = {
      timestamp: new Date().getTime(),
      data
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    
    // Manage cache size by removing oldest entries if needed
    pruneCache();
  } catch (error) {
    console.error('Error storing email in cache:', error);
  }
};

/**
 * Removes a specific email from cache
 * @param {string} emailId - The email ID to remove
 */
export const removeEmailFromCache = (emailId) => {
  try {
    localStorage.removeItem(`email_content_${emailId}`);
  } catch (error) {
    console.error('Error removing email from cache:', error);
  }
};

/**
 * Removes the oldest emails from cache if the cache size exceeds the maximum
 */
const pruneCache = () => {
  try {
    const emailCacheKeys = [];
    
    // Collect all email cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('email_content_')) {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          const { timestamp } = JSON.parse(cachedData);
          emailCacheKeys.push({ key, timestamp });
        }
      }
    }
    
    // If we exceed the max cache size, remove oldest entries
    if (emailCacheKeys.length > MAX_CACHE_SIZE) {
      emailCacheKeys.sort((a, b) => a.timestamp - b.timestamp);
      const keysToRemove = emailCacheKeys.slice(0, emailCacheKeys.length - MAX_CACHE_SIZE);
      keysToRemove.forEach(item => localStorage.removeItem(item.key));
    }
  } catch (error) {
    console.error('Error pruning email cache:', error);
  }
};

/**
 * Clears all cached email content
 */
export const clearEmailCache = () => {
  try {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('email_content_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing email cache:', error);
  }
};
