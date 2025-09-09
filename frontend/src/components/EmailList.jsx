import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import EmailCard from './EmailCard';
import EmailView from './EmailView';
import { getEmailFromCache, cacheEmail } from '../utils/emailCache';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

function EmailList({ emails: initialEmails, loading: initialLoading, onRefresh }) {
  const [emails, setEmails] = useState(initialEmails);
  const [loading, setLoading] = useState(initialLoading);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [syncInterval, setSyncInterval] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [error, setError] = useState(null);

  // Function to sync emails
  const syncEmails = useCallback(async () => {
    try {
      // Prevent rapid re-syncs with improved timing
      const now = Date.now();
      const minSyncInterval = 30000; // 30 seconds minimum between syncs
      
      if (loading) {
        console.log('Skipping sync - already loading');
        return;
      }
      
      if (now - lastSyncTime < minSyncInterval) {
        console.log(`Skipping sync - too soon (${Math.round((now - lastSyncTime)/1000)}s since last sync)`);
        return;
      }
      
      console.log('Starting email sync...');
      setLoading(true);
      setError(null);
      
      // Add a cache control header to prevent browser caching
      const response = await axios.get('http://localhost:3000/api/emails/messages/sync', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'If-Modified-Since': new Date(lastSyncTime).toUTCString()
        },
        timeout: 15000 // 15 second timeout
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`Sync complete - received ${response.data.length} emails`);
        
        // Only update if we actually got new data
        if (JSON.stringify(response.data) !== JSON.stringify(emails)) {
          setEmails(response.data);
          if (onRefresh) onRefresh(response.data);
        } else {
          console.log('No changes in email data');
        }
      }
      setLastSyncTime(now);
    } catch (error) {
      console.error('Failed to sync emails:', error);
      setError('Failed to fetch emails. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onRefresh, loading, lastSyncTime, emails]);

  // Start email sync interval
  useEffect(() => {
    let isSubscribed = true;
    console.log('Setting up email sync interval');

    // Initial sync - but only if we don't have emails already
    if (isSubscribed && (!emails || emails.length === 0)) {
      syncEmails();
    }

    // Set up interval for regular syncs (every 10 minutes)
    const interval = setInterval(() => {
      if (isSubscribed) {
        console.log('Running scheduled email sync');
        syncEmails();
      }
    }, 10 * 60 * 1000); // Increased to 10 minutes to reduce frequency
    setSyncInterval(interval);

    // Cleanup function
    return () => {
      console.log('Cleaning up email sync interval');
      isSubscribed = false;
      if (interval) clearInterval(interval);
    };
  }, [syncEmails, emails]);

  // Update emails when initialEmails changes
  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails]);

  // Update loading state when initialLoading changes
  useEffect(() => {
    setLoading(initialLoading);
  }, [initialLoading]);

  const handleEmailClick = async (email) => {
    // First set the email we have to provide immediate feedback to the user
    setSelectedEmail(email);
    
    // Check if we have this email in cache
    const cachedEmail = getEmailFromCache(email.id);
    if (cachedEmail) {
      console.log('Using cached email content for:', email.id);
      setSelectedEmail({
        ...email,
        content: cachedEmail.content,
        body: cachedEmail.body
      });
      return;
    }
    
    // If not in cache, fetch from API
    try {
      const response = await axios.get(`http://localhost:3000/api/emails/messages/${email.id}`, {
        timeout: 8000 // 8 second timeout
      });
      
      // Cache the result
      cacheEmail(email.id, response.data);
      
      setSelectedEmail({
        ...email,
        content: response.data.content,
        body: response.data.body
      });
    } catch (error) {
      console.error('Failed to fetch email content:', error);
      // Keep the email selected but without content
    }
  };

  return (
    <>
      <AnimatePresence>
        {selectedEmail && (
          <EmailView
            email={selectedEmail}
            onClose={() => setSelectedEmail(null)}
          />
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600">Loading your emails...</p>
        </div>
      ) : !emails?.length ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No emails found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Your inbox is empty. New emails will appear here when they arrive.
          </p>
          <button
            onClick={syncEmails}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Emails
          </button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {emails.map((email) => (
            <motion.div key={email.id} variants={item}>
              <EmailCard 
                email={email} 
                onClick={() => setSelectedEmail(email)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {selectedEmail && (
          <EmailView 
            email={selectedEmail} 
            onClose={() => setSelectedEmail(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default EmailList;
