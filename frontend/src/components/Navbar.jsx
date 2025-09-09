import React from 'react';
import LogoutButton from './LogoutButton';

function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
              InboxOwl
            </span>
          </div>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src={user.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)}
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-gray-700">{user.name}</span>
              </div>
              <LogoutButton onLogout={onLogout} />
            </div>
          ) : (
            <button
              onClick={() => window.location.href = 'http://localhost:3000/auth/google'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
