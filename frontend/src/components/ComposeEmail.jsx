import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { validateEmail, parseEmailAddresses, createEmailTemplate, getEmailSignature } from '../utils/emailUtils';

const ComposeEmail = ({ isOpen, onClose, replyTo = null, onEmailSent }) => {
  const [formData, setFormData] = useState(() => {
    if (replyTo?.isDraft) {
      // Editing existing draft
      return {
        to: replyTo.to || '',
        subject: replyTo.subject || '',
        body: replyTo.body || ''
      };
    } else if (replyTo) {
      // Replying to email
      return {
        to: replyTo.senderEmail || '',
        subject: `Re: ${replyTo.subject}` || '',
        body: `\n\n--- Original Message ---\nFrom: ${replyTo.sender}\nDate: ${replyTo.date}\nSubject: ${replyTo.subject}\n\n${replyTo.body || replyTo.content}`
      };
    } else {
      // New email
      return {
        to: '',
        subject: '',
        body: ''
      };
    }
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(replyTo?.isDraft || false);
  const [draftId, setDraftId] = useState(replyTo?.id || null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '' });
  const bodyRef = useRef(null);
  const toRef = useRef(null);

  // Focus management and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (toRef.current && !replyTo) {
        setTimeout(() => toRef.current?.focus(), 100);
      }
      if (bodyRef.current && replyTo) {
        setTimeout(() => {
          bodyRef.current?.focus();
          bodyRef.current?.setSelectionRange(0, 0);
        }, 100);
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, replyTo]);

  // Close template dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTemplates && !event.target.closest('.template-dropdown')) {
        setShowTemplates(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTemplates]);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle multiple email addresses
  const parseEmailAddresses = (emailString) => {
    return emailString.split(/[,;]/).map(email => email.trim()).filter(email => email);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle template insertion
  const handleTemplateSelect = (templateType) => {
    let template;
    if (typeof templateType === 'string') {
      template = createEmailTemplate(templateType);
      const signature = getEmailSignature();
      const fullTemplate = template + (signature ? `\n\n${signature}` : '');
      
      setFormData(prev => ({
        ...prev,
        body: fullTemplate
      }));
    } else {
      // Custom template
      setFormData(prev => ({
        ...prev,
        subject: templateType.subject,
        body: templateType.body
      }));
    }
    setShowTemplates(false);
    
    // Focus the body and move cursor to the end
    setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.focus();
        bodyRef.current.setSelectionRange(0, 0);
      }
    }, 100);
  };

  const handleCreateTemplate = () => {
    if (newTemplate.name && newTemplate.body) {
      const template = {
        id: Date.now(),
        name: newTemplate.name,
        subject: newTemplate.subject,
        body: newTemplate.body,
        isCustom: true
      };
      const updatedTemplates = [...customTemplates, template];
      setCustomTemplates(updatedTemplates);
      localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
      setNewTemplate({ name: '', subject: '', body: '' });
      setShowCreateTemplate(false);
    }
  };

  const deleteCustomTemplate = (templateId) => {
    const updated = customTemplates.filter(t => t.id !== templateId);
    setCustomTemplates(updated);
    localStorage.setItem('emailTemplates', JSON.stringify(updated));
  };

  // Load custom templates from localStorage
  React.useEffect(() => {
    const savedTemplates = localStorage.getItem('emailTemplates');
    if (savedTemplates) {
      setCustomTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const handleSend = async () => {
    try {
      setSending(true);
      setError('');
      
      // Enhanced validation
      if (!formData.to.trim()) {
        setError('Please enter a recipient email address');
        toRef.current?.focus();
        return;
      }
      
      if (!formData.subject.trim()) {
        setError('Please enter a subject');
        return;
      }
      
      if (!formData.body.trim()) {
        setError('Please enter a message');
        bodyRef.current?.focus();
        return;
      }

      // Validate email addresses
      const emails = parseEmailAddresses(formData.to);
      const invalidEmails = emails.filter(email => !validateEmail(email));
      
      if (invalidEmails.length > 0) {
        setError(`Invalid email address(es): ${invalidEmails.join(', ')}`);
        toRef.current?.focus();
        return;
      }

      if (isEditingDraft && draftId) {
        // Send from draft
        await axios.post('http://localhost:3000/api/emails/drafts/send', {
          draftId: draftId,
          to: formData.to.trim(),
          subject: formData.subject.trim(),
          body: formData.body.trim()
        }, {
          withCredentials: true,
          timeout: 15000
        });
      } else {
        // Send new email
        await axios.post('http://localhost:3000/api/emails/send', {
          to: formData.to.trim(),
          subject: formData.subject.trim(),
          body: formData.body.trim()
        }, {
          withCredentials: true,
          timeout: 15000
        });
      }

      // Success animation
      setSuccess(true);
      
      // Close after showing success
      setTimeout(() => {
        onClose();
        if (onEmailSent) onEmailSent();
        
        // Reset form
        setFormData({ to: '', subject: '', body: '' });
        setSuccess(false);
        setIsEditingDraft(false);
        setDraftId(null);
      }, 1500);
      
    } catch (error) {
      console.error('Failed to send email:', error);
      if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError(error.response?.data?.error || 'Failed to send email. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setError('');
      setIsDraft(true);
      
      if (!formData.to.trim() && !formData.subject.trim() && !formData.body.trim()) {
        setError('Cannot save empty draft');
        return;
      }
      
      await axios.post('http://localhost:3000/api/emails/drafts', {
        to: formData.to.trim(),
        subject: formData.subject.trim(),
        body: formData.body.trim()
      }, {
        withCredentials: true,
        timeout: 10000
      });
      
      // Show success message
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to save draft:', error);
      setError('Failed to save draft. Please try again.');
    } finally {
      setIsDraft(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !sending) {
      e.preventDefault();
      handleSend();
    }
    
    // Ctrl/Cmd + S to save draft
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveDraft();
    }
  };

  if (!isOpen) return null;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] overflow-hidden"
      onKeyDown={handleKeyDown}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 bg-green-50 bg-opacity-95 flex items-center justify-center z-10">
            <div className="text-center">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-lg font-semibold text-green-700">
                {isDraft ? 'Draft Saved!' : 'Email Sent Successfully!'}
              </p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {replyTo ? 'Reply' : 'Compose Email'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Press Ctrl+Enter to send • Ctrl+S to save draft
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start"
            >
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To <span className="text-red-500">*</span>
            </label>
            <input
              ref={toRef}
              type="email"
              name="to"
              value={formData.to}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="recipient@example.com (separate multiple emails with commas)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">You can enter multiple email addresses separated by commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="Email subject"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <div className="relative template-dropdown">
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Templates
                </button>
                
                {showTemplates && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
                    <div className="py-1">
                      {/* Default Templates */}
                      <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
                        Default Templates
                      </div>
                      <button
                        onClick={() => handleTemplateSelect('business')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📋 Business Email
                      </button>
                      <button
                        onClick={() => handleTemplateSelect('meeting')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📅 Meeting Request
                      </button>
                      <button
                        onClick={() => handleTemplateSelect('followUp')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ↩️ Follow-up
                      </button>
                      <button
                        onClick={() => handleTemplateSelect('introduction')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        👋 Introduction
                      </button>
                      
                      {/* Custom Templates */}
                      {customTemplates.length > 0 && (
                        <>
                          <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-t mt-1">
                            Custom Templates
                          </div>
                          {customTemplates.map(template => (
                            <div key={template.id} className="flex items-center">
                              <button
                                onClick={() => handleTemplateSelect(template)}
                                className="flex-1 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                ✨ {template.name}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCustomTemplate(template.id);
                                }}
                                className="px-2 py-2 text-red-500 hover:text-red-700"
                                title="Delete template"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* Create New Template */}
                      <div className="border-t mt-1">
                        <button
                          onClick={() => setShowCreateTemplate(true)}
                          className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium"
                        >
                          ➕ Create New Template
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <textarea
              ref={bodyRef}
              name="body"
              value={formData.body}
              onChange={handleInputChange}
              rows="12"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical transition-colors"
              placeholder="Write your message here...\n\n💡 Tips:\n• Use Ctrl+Enter to send quickly\n• Click 'Templates' for pre-written formats\n• Separate multiple recipients with commas"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Characters: {formData.body.length}</span>
              <span>Press Ctrl+Enter to send • Ctrl+S to save draft</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-t flex-shrink-0">
          <button
            onClick={handleSaveDraft}
            disabled={isDraft || sending}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Save Draft (Ctrl+S)"
          >
            {isDraft && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isDraft ? 'Saving...' : 'Save Draft'}
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={sending || isDraft}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || isDraft || !formData.to.trim() || !formData.subject.trim() || !formData.body.trim()}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send Email (Ctrl+Enter)"
            >
              {sending && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10000]"
          onClick={() => setShowCreateTemplate(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Custom Template</h3>
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Project Proposal, Weekly Update"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Subject (Optional)
                </label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Weekly Project Update"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
                  placeholder="Enter your template content here...

Tip: Use placeholders like [Name], [Date], [Company] that you can replace when using the template."
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplate.name || !newTemplate.body}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Template
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ComposeEmail;