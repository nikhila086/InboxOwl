import React from 'react';
import { motion } from 'framer-motion';
import EmailCard from './EmailCard';

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

function EmailList({ emails, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">Loading your emails...</p>
      </div>
    );
  }

  if (!emails?.length) {
    return (
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
          onClick={window.location.reload}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Refresh Inbox
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4"
    >
      {emails.map(email => (
        <motion.div key={email.id} variants={item}>
          <EmailCard email={email} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default EmailList;
