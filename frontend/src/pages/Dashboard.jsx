import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import EmailList from '../components/EmailList';
import SettingsView from '../components/SettingsView';
import { fetchUser, fetchEmails as fetchEmailsApi, logout } from '../utils/api';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('emails');

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const data = await fetchUser();
        if (data && data.length > 0) {
          setUser(data[0]);
          fetchEmails(); // Auto-fetch emails when user is loaded
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const fetchEmails = async () => {
    setEmailsLoading(true);
    try {
      const data = await fetchEmailsApi();
      setEmails(data);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setEmailsLoading(false);
    }
  };

  const handleSignIn = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setEmails([]);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-12 text-center"
          >
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
              Welcome to InboxOwl
            </h1>
            <p className="text-gray-600 mb-8">
              Your smart email dashboard
            </p>
            <button
              onClick={handleSignIn}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:opacity-90 transition-opacity"
            >
              Sign in with Google
            </button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'emails', label: 'Emails' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name || user.email}
            </h1>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'emails' && (
            <EmailList 
              emails={emails} 
              loading={emailsLoading} 
              onRefresh={fetchEmails}
            />
          )}
          {activeTab === 'settings' && <SettingsView />}
        </motion.div>
      </div>
    </Layout>
  );
}

export default Dashboard;
