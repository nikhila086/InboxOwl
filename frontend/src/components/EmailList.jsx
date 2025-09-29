import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import EmailCard from './EmailCard';
import EmailView from './EmailView';

function EmailList({ emails = [], loading = false, onReply, onEmailUpdate }) {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [localEmails, setLocalEmails] = useState(emails);

  // Update local emails when props change
  React.useEffect(() => {
    setLocalEmails(emails);
  }, [emails]);

  const handleEmailClick = async (email) => {
    setSelectedEmail(email);
    
    try {
      const response = await axios.get(`http://localhost:3000/api/emails/messages/${email.id}`);
      setSelectedEmail({
        ...email,
        content: response.data.content,
        body: response.data.body
      });
    } catch (error) {
      console.error('Failed to fetch email content:', error);
    }
  };

  const updateEmailInList = (emailId, updates) => {
    setLocalEmails(prevEmails => 
      prevEmails.map(email => 
        email.id === emailId 
          ? { ...email, ...updates }
          : email
      )
    );
  };

  const handleToggleImportant = async (emailId, isImportant) => {
    try {
      // Optimistically update UI
      updateEmailInList(emailId, {
        labels: isImportant 
          ? [...(localEmails.find(e => e.id === emailId)?.labels || []), 'IMPORTANT'].filter((label, index, arr) => arr.indexOf(label) === index)
          : (localEmails.find(e => e.id === emailId)?.labels || []).filter(label => label !== 'IMPORTANT')
      });
      
      await axios.put(`http://localhost:3000/api/emails/important/${emailId}`, { isImportant });
      
      // Notify parent component if callback provided
      if (onEmailUpdate) {
        onEmailUpdate();
      }
    } catch (error) {
      console.error('Failed to toggle important status:', error);
      // Revert optimistic update on error
      setLocalEmails(emails);
    }
  };

  const handleToggleStarred = async (emailId, isStarred) => {
    try {
      // Optimistically update UI
      updateEmailInList(emailId, {
        labels: isStarred 
          ? [...(localEmails.find(e => e.id === emailId)?.labels || []), 'STARRED'].filter((label, index, arr) => arr.indexOf(label) === index)
          : (localEmails.find(e => e.id === emailId)?.labels || []).filter(label => label !== 'STARRED')
      });
      
      await axios.put(`http://localhost:3000/api/emails/starred/${emailId}`, { isStarred });
      
      // Notify parent component if callback provided
      if (onEmailUpdate) {
        onEmailUpdate();
      }
    } catch (error) {
      console.error('Failed to toggle starred status:', error);
      // Revert optimistic update on error
      setLocalEmails(emails);
    }
  };

  return (
    <div className="h-full flex flex-col">
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
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="text-lg">No emails found</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {localEmails.map((email, index) => (
              <EmailCard 
                key={email.id || `email-${index}`}
                email={email} 
                onClick={handleEmailClick}
                onReply={onReply}
                onToggleImportant={handleToggleImportant}
                onToggleStarred={handleToggleStarred}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailList;