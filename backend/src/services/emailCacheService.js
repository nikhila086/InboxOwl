/**
 * Email Content Cache Service
 * Implements server-side caching for email content to reduce Gmail API calls
 */

const NodeCache = require('node-cache');

// Set email cache with 24 hour TTL (time to live)
const emailCache = new NodeCache({ 
  stdTTL: 86400, // 24 hours in seconds
  checkperiod: 3600, // Check for expired keys every hour
  maxKeys: 1000 // Maximum number of keys in cache
});

/**
 * Cache middleware for email content
 * Checks if the requested email is already cached before hitting the Gmail API
 */
const emailCacheMiddleware = async (req, res, next) => {
  // Only apply caching to single email fetches
  if (!req.params.id) return next();
  
  const emailId = req.params.id;
  const cachedEmail = emailCache.get(emailId);
  
  if (cachedEmail) {
    console.log(`Serving email ${emailId} from cache`);
    return res.json(cachedEmail);
  }
  
  // Add cache setter to response
  res.cacheEmail = (data) => {
    emailCache.set(emailId, data);
  };
  
  next();
};

/**
 * Store an email in the cache
 * @param {string} emailId - Email ID to use as cache key
 * @param {object} data - Email data to cache
 */
const cacheEmail = (emailId, data) => {
  emailCache.set(emailId, data);
};

/**
 * Retrieve an email from the cache
 * @param {string} emailId - Email ID to retrieve
 * @returns {object|undefined} - The cached email data or undefined if not found
 */
const getEmailFromCache = (emailId) => {
  return emailCache.get(emailId);
};

/**
 * Remove an email from the cache
 * @param {string} emailId - Email ID to remove
 */
const removeEmailFromCache = (emailId) => {
  emailCache.del(emailId);
};

/**
 * Clear the entire email cache
 */
const clearEmailCache = () => {
  emailCache.flushAll();
};

module.exports = {
  emailCacheMiddleware,
  cacheEmail,
  getEmailFromCache,
  removeEmailFromCache,
  clearEmailCache
};
