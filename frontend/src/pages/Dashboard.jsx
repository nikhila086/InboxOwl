import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import EmailList from '../components/EmailList.jsx';
import SettingsPanel from '../components/SettingsPanel';
import { fetchUser, fetchEmails as fetchEmailsApi, logout } from '../utils/api';
import { isAuthenticated, clearAuth } from '../utils/auth';
import { FiSettings } from 'react-icons/fi';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('emails');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        setLoading(true);
        const authenticated = await isAuthenticated();
        
        if (!authenticated) {
          navigate('/login', { replace: true });
          return;
        }

        // Load user data
        const userData = await fetchUser();
        if (userData) {
          setUser(userData);
          await fetchEmails();
        } else {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Failed to check auth/load user:', error);
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndLoadUser();
  }, [navigate]);

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
      console.log('Logging out...');
      // Use both logout functions to ensure we're fully logged out
      await logout();
      await clearAuth();
      
      // Clear local state
      setUser(null);
      setEmails([]);
      
      // Force a complete page reload to clear any remaining state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      window.location.href = '/login';
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
            <>
              <EmailList 
                emails={emails} 
                loading={emailsLoading} 
                onRefresh={fetchEmails}
              />
              <div className="fixed bottom-6 right-6">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                  title="Settings"
                >
                  <FiSettings className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              
              {showSettings && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-30 flex justify-center items-center z-50 p-4">
                  <SettingsPanel onClose={() => setShowSettings(false)} />
                </div>
              )}
            </>
          )}
          {activeTab === 'settings' && <SettingsPanel onClose={() => setActiveTab('emails')} />}
        </motion.div>
      </div>
    </Layout>
  );
}

export default Dashboard;
