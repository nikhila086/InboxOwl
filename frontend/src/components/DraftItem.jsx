import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const DraftItem = ({ draft, onEdit, onDelete, onSent }) => {
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSend = async () => {
    try {
      setSending(true);
      await axios.post('http://localhost:3000/api/emails/drafts/send', {
        draftId: draft.id,
        to: draft.to,
        subject: draft.subject,
        body: draft.body
      }, {
        withCredentials: true
      });
      
      if (onSent) onSent(draft.id);
    } catch (error) {
      console.error('Failed to send draft:', error);
      alert('Failed to send draft: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    
    try {
      setDeleting(true);
      await axios.delete(`http://localhost:3000/api/emails/drafts/${draft.id}`, {
        withCredentials: true
      });
      
      if (onDelete) onDelete(draft.id);
    } catch (error) {
      console.error('Failed to delete draft:', error);
      alert('Failed to delete draft: ' + (error.response?.data?.error || error.message));
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Draft
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(draft.date)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-gray-600">To: </span>
              <span className="text-gray-900">{draft.to || 'No recipient'}</span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {draft.subject || 'No subject'}
            </div>
            <div className="text-sm text-gray-600">
              {truncateText(draft.body) || draft.snippet || 'Empty draft'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onEdit(draft)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Edit draft"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={handleSend}
            disabled={sending || !draft.to}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send draft"
          >
            {sending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
          
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            title="Delete draft"
          >
            {deleting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DraftItem;