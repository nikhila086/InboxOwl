import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GmailInterface from '../components/GmailInterface';
import SettingsPanel from '../components/SettingsPanel';
import { fetchUser, logout } from '../utils/api';
import { isAuthenticated, clearAuth } from '../utils/auth';
import { FiSettings } from 'react-icons/fi';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
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

        const userData = await fetchUser();
        setUser(userData);
      } catch (error) {
        console.error('Auth/user loading error:', error);
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadUser();
  }, [navigate]);

  const handleSignIn = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await logout();
      await clearAuth();
      
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to InboxOwl</h1>
          <p className="text-gray-600 mb-8">Sign in with Google to get started</p>
          <button
            onClick={handleSignIn}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">InboxOwl</h1>
          <span className="text-sm text-gray-500">Welcome, {user?.name || 'User'}!</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Settings"
          >
            <FiSettings className="h-5 w-5" />
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Gmail Interface */}
      <div className="flex-1 overflow-hidden">
        <GmailInterface />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50 p-4">
          <SettingsPanel onClose={{ close: () => setShowSettings(false), onEmailsRefresh: () => {} }} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
