/**
 * Log out button component with enhanced functionality
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const LogoutButton = ({ onLogout }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async (e) => {
    e.preventDefault();
    setIsLoggingOut(true);
    
    try {
      await onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Force navigate to login anyway
      window.location.href = '/login';
    }
  };
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
        isLoggingOut 
          ? 'bg-gray-400 text-gray-100' 
          : 'bg-red-500 hover:bg-red-600 text-white'
      }`}
    >
      {isLoggingOut ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Signing Out...
        </>
      ) : (
        'Sign Out'
      )}
    </motion.button>
  );
};

export default LogoutButton;
