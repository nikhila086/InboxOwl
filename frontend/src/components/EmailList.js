import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import EmailCard from './EmailCard';
import EmailView from './EmailView';

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

  // Function to sync emails
  const syncEmails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/emails/gmail/sync');
      setEmails(response.data);
      if (onRefresh) onRefresh(response.data);
    } catch (error) {
      console.error('Failed to sync emails:', error);
    } finally {
      setLoading(false);
    }
  }, [onRefresh]);

  // Start email sync interval
  useEffect(() => {
    // Initial sync
    syncEmails();

    // Set up interval for regular syncs (every 5 minutes)
    const interval = setInterval(syncEmails, 5 * 60 * 1000);
    setSyncInterval(interval);

    // Cleanup on unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncEmails]);

  // Update emails when initialEmails changes
  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails]);

  // Update loading state when initialLoading changes
  useEffect(() => {
    setLoading(initialLoading);
  }, [initialLoading]);

  return (
    <>
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
