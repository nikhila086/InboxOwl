import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '../utils/dateUtils';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { HiOutlineLightBulb } from 'react-icons/hi';
import { getEmailFromCache, cacheEmail } from '../utils/emailCache';

const EmailView = ({ email, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const [emailContent, setEmailContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const fetchEmailContent = async () => {
    // If email already has content or we're already loading, skip fetching
    if (!email?.id || (email?.content && email.content.length > 10) || loadingContent) return;
    
    // Check cache first
    const cachedEmail = getEmailFromCache(email.id);
    if (cachedEmail) {
      console.log('Retrieved email content from cache:', email.id);
      setEmailContent(cachedEmail);
      return;
    }
    
    try {
      setLoadingContent(true);
      const response = await axios.get(`http://localhost:3000/api/emails/messages/${email.id}`, {
        timeout: 10000, // 10 second timeout
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.data?.content) {
        // Store the result in the cache
        cacheEmail(email.id, response.data);
        setEmailContent(response.data);
      }
    } catch (err) {
      console.error('Error fetching email content:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  // Define analyzeEmail outside of the component body to avoid dependency issues
  const analyzeEmailOnMount = () => {
    // Only run if we have an email ID and we're not already analyzing
    if (email?.id && !loading) {
      analyzeEmail();
    }
  };
  
  useEffect(() => {
    if (email?.id) {
      fetchEmailContent();
      // Automatically analyze the email to show spam score when opening
      setTimeout(() => {
        if (!loading) analyzeEmail();
      }, 500); // Slight delay to ensure content has time to load
    }
  }, [email?.id]);

  const analyzeEmail = async () => {
    try {
      // If we're already loading content, wait a bit and retry
      if (loadingContent) {
        setTimeout(() => analyzeEmail(), 1000);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Check if we have content to analyze
      const content = email.content || emailContent?.content;
      
      // If content is still loading or not available, use snippet instead
      const contentToAnalyze = content || email.snippet;
      if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
        setError('No email content to analyze.');
        setLoading(false);
        return;
      }
      
      const response = await axios.post('/api/emails/analyze', {
        emailId: email.id,
        subject: email.subject,
        body: contentToAnalyze
      }, {
        timeout: 45000 // Increased timeout for AI analysis
      });
      
      if (response.data) {
        setAnalysis(response.data);
        
        // Ensure we have all required fields
        if (!response.data.summary) {
          console.warn('Missing summary in analysis response');
          // If we have no summary but other data is fine, don't show an error
        }
        
        // Make sure spamScore is valid
        if (typeof response.data.spamScore !== 'number') {
          response.data.spamScore = 0;
        }
      } else {
        setError('Received empty response from analysis service');
      }
    } catch (err) {
      let errorMessage = 'Failed to analyze email';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Analysis timed out. The server might be busy or the email is too complex.';
      } else if (!navigator.onLine) {
        errorMessage = 'You appear to be offline. Please check your connection.';
      }
      
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  const hasSpamIndicators = analysis?.isSpam;
  const spamScore = analysis?.spamScore || 0;
  const spamReasons = analysis?.reasons || [];
  const summary = analysis?.summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Email Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">{email.subject}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <p className="font-medium text-gray-900">{email.sender}</p>
              <p>To: {email.to || 'me'}</p>
            </div>
            <p>{formatDate(email.date)}</p>
          </div>
        </div>

        {/* Email Content - Fixed Scrolling Issue */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 300px)', overflowY: 'auto' }}>
          {loadingContent ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              <span className="ml-3 text-gray-600">Loading email content...</span>
            </div>
          ) : (email.content || emailContent?.content) ? (
            <div className="h-full overflow-auto">
              <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200 sticky top-0 z-10">
                {loading ? (
                  <div className="flex items-center space-x-2 text-gray-600 py-1">
                    <FaSpinner className="animate-spin h-4 w-4" />
                    <span>Analyzing for security threats...</span>
                  </div>
                ) : analysis ? (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">Spam Score:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        spamScore > 0.6 ? 'bg-red-100 text-red-800' : 
                        spamScore > 0.3 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {Math.round(spamScore * 100)}%
                      </span>
                    </div>
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                      <div 
                        style={{ width: `${Math.max(5, Math.round(spamScore * 100))}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          spamScore > 0.6 ? 'bg-red-500' : 
                          spamScore > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      ></div>
                    </div>
                    
                    {/* Display Category */}
                    {analysis.category && (
                      <div className="flex items-center mt-2 pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-700 mr-2">Category:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {analysis.category}
                          {analysis.matchedRule && (
                            <span className="ml-1 text-xs text-gray-500">
                              (Matched rule: {analysis.matchedRule})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 text-sm">
                    Email security analysis not yet available
                  </div>
                )}
              </div>
              <div className="prose max-w-none whitespace-pre-wrap">
                {email.content || emailContent?.content}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <IoDocumentTextOutline className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              No content available
            </div>
          )}
        </div>

        {/* Analysis Section - Only shown when analysis exists */}
        {analysis && (
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="p-6 space-y-4">
              {/* Spam Score */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Spam Analysis
                </h3>
                <div className="relative pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Spam Score</span>
                    <span className={`text-sm font-medium ${
                      spamScore > 0.6 ? 'text-red-600' : 
                      spamScore > 0.3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {Math.round(spamScore * 100)}%
                    </span>
                  </div>
                  <div className="overflow-hidden h-2 mt-2 text-xs flex rounded bg-gray-200">
                    <div 
                      style={{ width: `${Math.max(5, Math.round(spamScore * 100))}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        spamScore > 0.6 ? 'bg-red-500' : 
                        spamScore > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Spam Reasons */}
              {spamReasons.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Detected Issues
                  </h3>
                  <ul className="space-y-2">
                    {spamReasons.map((reason, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-gray-600">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Email Summary */}
              {summary && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                    <HiOutlineLightBulb className="h-5 w-5 mr-2 text-amber-500" />
                    AI Summary
                  </h3>
                  <p className="text-gray-600">{summary}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* AI Analysis Button */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-center">
          {loading ? (
            <div className="flex items-center justify-center space-x-2 text-indigo-600 py-2">
              <FaSpinner className="animate-spin h-5 w-5" />
              <span>Analyzing email...</span>
            </div>
          ) : (
            <button
              onClick={analyzeEmail}
              disabled={loading || !email?.content && !emailContent?.content}
              className={`py-2 px-6 rounded-md font-medium transition-all flex items-center ${
                !email?.content && !emailContent?.content
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg'
              }`}
            >
              <HiOutlineLightBulb className="mr-2 h-5 w-5" />
              {analysis ? 'Regenerate AI Summary' : 'Generate AI Summary'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmailView;
