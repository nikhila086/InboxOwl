import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import EmailSidebar from './EmailSidebar';
import EmailList from './EmailList';
import ComposeEmail from './ComposeEmail';
import DraftItem from './DraftItem';

const GmailInterface = () => {
  const [activeView, setActiveView] = useState('inbox');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [emails, setEmails] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [emailCounts, setEmailCounts] = useState({
    inbox: 0,
    primary: 0,
    important: 0,
    starred: 0,
    promotions: 0,
    social: 0,
    updates: 0,
    forums: 0,
    sent: 0,
    drafts: 0,
    spam: 0,
    trash: 0,
    categories: {}
  });

  // Fetch emails based on active view
  const fetchEmails = useCallback(async (view = activeView, category = selectedCategory) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '';
      let isDraftsView = false;
      
      if (view === 'inbox') {
        // Use the original emails endpoint that includes categories, then enrich with Gmail labels
        url = 'http://localhost:3000/api/emails/messages';
      } else if (view === 'category' || !view) {
        // Use the original emails endpoint that includes categories
        url = 'http://localhost:3000/api/emails/messages';
      } else if (view === 'drafts') {
        // Special handling for drafts - use dedicated drafts endpoint
        url = 'http://localhost:3000/api/emails/drafts';
        isDraftsView = true;
      } else if (['sent', 'primary', 'important', 'starred', 'promotions', 'social', 'updates', 'forums', 'spam', 'trash'].includes(view)) {
        // Fetch folder-based emails for other folders including Gmail categories
        url = `http://localhost:3000/api/emails/folder/${view}`;
      } else {
        // Default to main emails endpoint
        url = 'http://localhost:3000/api/emails/messages';
      }

      const response = await axios.get(url, {
        withCredentials: true,
        timeout: 15000
      });

      let filteredEmails;
      if (isDraftsView) {
        // For drafts, the response structure is { drafts: [...] }
        filteredEmails = response.data.drafts || [];
        setDrafts(filteredEmails);
        setEmails([]); // Clear regular emails when viewing drafts
      } else {
        filteredEmails = response.data || [];
        setDrafts([]); // Clear drafts when viewing other folders
        setEmails(filteredEmails);
      }

      // If viewing a specific category, filter the emails (only for non-draft views)
      if (view === 'category' && category && !isDraftsView) {
        filteredEmails = filteredEmails.filter(email => 
          email.categories?.some(cat => cat.name.toLowerCase() === category.toLowerCase())
        );
        setEmails(filteredEmails);
        updateEmailCounts(filteredEmails);
      } else if (!isDraftsView) {
        // Update email counts for non-draft views
        updateEmailCounts(filteredEmails);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      setError(`Failed to load ${view} emails. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [activeView, selectedCategory]);

  // Update email counts for sidebar
  const updateEmailCounts = (emailList) => {
    const counts = {
      inbox: 0,
      primary: 0,
      promotions: 0,
      social: 0,
      updates: 0,
      forums: 0,
      sent: 0,
      drafts: 0,
      spam: 0,
      trash: 0,
      categories: {}
    };

    emailList.forEach(email => {
      // Count by folder/labels
      if (email.labels?.includes('INBOX')) {
        counts.inbox++;
        
        // Primary emails are inbox emails that don't have other category labels
        const hasOtherCategories = email.labels?.some(label => 
          ['CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS'].includes(label)
        );
        if (!hasOtherCategories) {
          counts.primary++;
        }
      }
      if (email.labels?.includes('CATEGORY_PROMOTIONS')) counts.promotions++;
      if (email.labels?.includes('CATEGORY_SOCIAL')) counts.social++;
      if (email.labels?.includes('CATEGORY_UPDATES')) counts.updates++;
      if (email.labels?.includes('CATEGORY_FORUMS')) counts.forums++;
      if (email.labels?.includes('SENT')) counts.sent++;
      if (email.labels?.includes('DRAFT')) counts.drafts++;
      if (email.labels?.includes('SPAM')) counts.spam++;
      if (email.labels?.includes('TRASH')) counts.trash++;

      // Count by categories
      email.categories?.forEach(category => {
        const catName = category.name.toLowerCase();
        counts.categories[catName] = (counts.categories[catName] || 0) + 1;
      });
    });

    setEmailCounts(counts);
  };

  // Handle view changes
  const handleViewChange = (view, category = null) => {
    setActiveView(view);
    setSelectedCategory(category);
    
    if (view !== 'category') {
      setSelectedCategory(null);
    }
  };

  // Handle compose actions
  const handleCompose = () => {
    setReplyTo(null);
    setComposeOpen(true);
  };

  const handleReply = (email) => {
    setReplyTo(email);
    setComposeOpen(true);
  };

  const handleEmailSent = () => {
    // Refresh the current view after sending an email
    fetchEmails();
  };

  // Draft handling functions
  const handleEditDraft = (draft) => {
    setReplyTo({
      ...draft,
      isDraft: true,
      senderEmail: draft.to
    });
    setComposeOpen(true);
  };

  const handleDeleteDraft = (draftId) => {
    setDrafts(prev => prev.filter(draft => draft.id !== draftId));
  };

  const handleDraftSent = (draftId) => {
    setDrafts(prev => prev.filter(draft => draft.id !== draftId));
    // Refresh email counts
    fetchEmails();
  };

  // Handle email updates (when important/starred status changes)
  const handleEmailUpdate = useCallback(() => {
    // Refresh emails to get updated state from server
    fetchEmails();
  }, [fetchEmails]);

  // Enhanced sync function that works with current view
  const handleSync = async (fullSync = false) => {
    await fetchEmails();
  };

  // Initial load and when view changes
  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !composeOpen) {
        fetchEmails();
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [fetchEmails, loading, composeOpen]);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <EmailSidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        emailCounts={emailCounts}
        onCompose={handleCompose}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 capitalize">
              {activeView === 'category' && selectedCategory ? selectedCategory : activeView}
              {activeView === 'inbox' && ' - InboxOwl'}
            </h1>
            <div className="flex items-center space-x-3">
              {/* Sync Button */}
              <button
                onClick={() => handleSync(false)}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                title="Sync emails"
              >
                <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Syncing...' : 'Sync'}
              </button>

              {/* Full Sync Button */}
              <button
                onClick={() => handleSync(true)}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                title="Full sync - fetch all emails"
              >
                <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Full Sync
              </button>

              {/* Compose Button */}
              <button
                onClick={handleCompose}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Compose
              </button>
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-auto">
          {error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
                <button
                  onClick={() => fetchEmails()}
                  className="ml-2 text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : activeView === 'drafts' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Drafts ({drafts.length})
                </h2>
                <button
                  onClick={handleSync}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Refresh
                </button>
              </div>
              
              {drafts.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No drafts</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by composing a new email.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setComposeOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Compose
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {drafts.map(draft => (
                      <DraftItem
                        key={draft.id}
                        draft={draft}
                        onEdit={handleEditDraft}
                        onDelete={handleDeleteDraft}
                        onSent={handleDraftSent}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : (
            <EmailList
              emails={emails}
              loading={loading}
              onRefresh={handleSync}
              onReply={handleReply}
              onEmailUpdate={handleEmailUpdate}
            />
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {composeOpen && (
          <ComposeEmail
            isOpen={composeOpen}
            onClose={() => {
              setComposeOpen(false);
              setReplyTo(null);
            }}
            replyTo={replyTo}
            onEmailSent={handleEmailSent}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GmailInterface;