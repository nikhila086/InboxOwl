import React from 'react';
import { motion } from 'framer-motion';

// Helper function to clean snippet text
function cleanSnippetText(text) {
  if (!text) return 'No preview available';
  
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = cleaned;
  cleaned = textarea.value;
  
  // Remove excessive whitespace and normalize
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
  
  return cleaned || 'No preview available';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function EmailCard({ email, onClick, onReply, onToggleImportant, onToggleStarred }) {
  const senderName = email?.sender || 'Unknown Sender';
  const senderEmail = email?.senderEmail || '';
  const firstLetter = senderName.charAt(0).toUpperCase();
  
  // Enhanced label parsing with debugging
  let labels = [];
  if (email?.labels) {
    if (Array.isArray(email.labels)) {
      labels = email.labels;
    } else if (typeof email.labels === 'string') {
      labels = email.labels.split(',').map(label => label.trim()).filter(Boolean);
    }
  }
  
  const categories = email?.categories || [];
  
  // Check for important/starred status from multiple sources
  const isImportant = labels.includes('IMPORTANT') || labels.includes('important') || 
                     email.isImportant || false;
  const isStarred = labels.includes('STARRED') || labels.includes('starred') || 
                   email.isStarred || false;
  
  // Debug logging
  if (process.env.NODE_ENV === 'development' && (isImportant || isStarred)) {
    console.log('Email with special labels:', {
      subject: email?.subject,
      labels,
      isImportant,
      isStarred,
      emailIsImportant: email.isImportant,
      emailIsStarred: email.isStarred
    });
  }

  const hasSpamIndicators = email.analysis?.isSpam;
  const spamScore = email.analysis?.spamScore || 0;
  const spamReasons = email.analysis?.reasons || [];
  const summary = email.analysis?.summary;

  const handleToggleImportant = async (e) => {
    e.stopPropagation();
    if (onToggleImportant) {
      await onToggleImportant(email.id, !isImportant);
    }
  };

  const handleToggleStarred = async (e) => {
    e.stopPropagation();
    if (onToggleStarred) {
      await onToggleStarred(email.id, !isStarred);
    }
  };

  // Create display text for sender
  const getSenderDisplay = () => {
    if (senderEmail && senderName !== senderEmail) {
      // If we have both name and email and they're different, show both
      return `${senderName} <${senderEmail}>`;
    } else if (senderEmail) {
      // If we only have email or name equals email, just show email
      return senderEmail;
    } else {
      // Fallback to sender name
      return senderName;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer border ${
        isImportant ? 'border-red-200 bg-red-50/30' : 
        isStarred ? 'border-yellow-200 bg-yellow-50/30' : 
        'border-gray-100'
      }`}
      onClick={() => onClick && onClick(email)}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-medium">
            {firstLetter}
          </div>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {email?.subject || 'No Subject'}
              </h3>
              {/* Visual indicators for important/starred */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {isImportant && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.854-.833-2.624 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Important
                  </span>
                )}
                {isStarred && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Starred
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleToggleImportant}
                className={`p-1 transition-all duration-200 ${
                  isImportant 
                    ? 'text-red-500 hover:text-red-600 bg-red-50 rounded' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50 rounded'
                }`}
                title={isImportant ? 'Remove from important' : 'Mark as important'}
              >
                <svg 
                  className="w-4 h-4" 
                  fill={isImportant ? "currentColor" : "none"} 
                  stroke={isImportant ? "none" : "currentColor"}
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={isImportant ? 0 : 2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.854-.833-2.624 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </button>
              <button
                onClick={handleToggleStarred}
                className={`p-1 transition-all duration-200 ${
                  isStarred 
                    ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 rounded' 
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded'
                }`}
                title={isStarred ? 'Remove star' : 'Add star'}
              >
                <svg 
                  className="w-5 h-5" 
                  fill={isStarred ? "currentColor" : "none"} 
                  stroke={isStarred ? "none" : "currentColor"}
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={isStarred ? 0 : 2} 
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                  />
                </svg>
              </button>
              <span className="text-sm text-gray-500">
                {email?.date ? formatDate(email.date) : 'No date'}
              </span>
              {onReply && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReply(email);
                  }}
                  className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Reply to this email"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 truncate mb-1">
            {getSenderDisplay()}
          </p>
          <p className="text-sm text-gray-500 line-clamp-2">
            {cleanSnippetText(summary || email?.snippet)}
          </p>
          
          {hasSpamIndicators && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className={`h-2 flex-grow rounded-full ${
                  spamScore > 0.6 ? 'bg-red-200' : 'bg-yellow-200'
                }`}>
                  <div
                    className={`h-2 rounded-full ${
                      spamScore > 0.6 ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${spamScore * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {Math.round(spamScore * 100)}% spam probability
                </span>
              </div>
              {spamReasons.length > 0 && (
                <div className="mt-1">
                  <ul className="text-xs text-gray-500">
                    {spamReasons.map((reason, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="mr-1">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {categories.map(category => (
              <span 
                key={category.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                style={{ 
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                  marginRight: '4px'
                }}
              >
                {category.name}
              </span>
            ))}
            {labels.length > 0 && labels.map(label => (
              <span 
                key={label}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default EmailCard;
