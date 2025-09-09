import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children, user, onLogout }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100">
      <Navbar user={user} onLogout={onLogout} />
      <main className="flex-1 container mx-auto px-4 py-8 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
