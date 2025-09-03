import React from 'react';
import { motion } from 'framer-motion';

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function EmailCard({ email }) {
  const senderName = email?.sender || 'Unknown Sender';
  const firstLetter = senderName.charAt(0).toUpperCase();
  const labels = email?.labels ? email.labels.split(',').filter(Boolean) : [];
  const category = email?.category;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer border border-gray-100"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-medium">
            {firstLetter}
          </div>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {email?.subject || 'No Subject'}
            </h3>
            <span className="text-sm text-gray-500 flex-shrink-0">
              {email?.date ? formatDate(email.date) : 'No date'}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate mb-1">
            {senderName}
          </p>
          <p className="text-sm text-gray-500 line-clamp-2">
            {email?.snippet || 'No preview available'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {category && (
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
            )}
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
