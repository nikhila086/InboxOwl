import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEmails, setShowEmails] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3000/users', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setUser(data[0]);
        }
      });
  }, []);

  const fetchEmails = () => {
    setLoading(true);
    fetch('http://localhost:3000/gmail', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setEmails(data);
        setLoading(false);
        setShowEmails(true);
      });
  };

  const handleSignIn = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  const handleLogout = () => {
    fetch('http://localhost:3000/logout', { credentials: 'include' })
      .then(() => {
        setUser(null);
        setEmails([]);
        setShowEmails(false);
        window.location.reload();
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-purple-700 tracking-tight">InboxOwl</h1>
          {user && (
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg shadow"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
        {!user ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col items-center justify-center py-16">
              <img src="https://img.icons8.com/color/96/000000/gmail-new.png" alt="Gmail" className="mb-6" />
              <button
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:scale-105 transition-transform"
                onClick={handleSignIn}
              >
                Sign in with Google
              </button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {!showEmails ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="text-xl font-semibold mb-4 text-gray-700">Welcome, {user.name || user.email}</span>
                  <button
                    className="bg-gradient-to-r from-green-400 to-blue-400 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:scale-105 transition-transform"
                    onClick={fetchEmails}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Show My Emails'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-6">
                  <span className="text-2xl font-bold text-gray-800">Your Emails</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {emails.length === 0 ? (
                    <p className="text-gray-500">No emails found.</p>
                  ) : (
                    emails.map(email => (
                      <motion.div key={email.id} whileHover={{ scale: 1.03 }} className="bg-white border border-gray-200 rounded-xl shadow p-5 transition-all">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-700">{email.subject || 'No Subject'}</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{email.labels}</span>
                        </div>
                        <div className="mb-1 text-sm text-gray-600">From: <span className="font-medium">{email.sender}</span></div>
                        <div className="mb-1 text-sm text-gray-600">Date: <span className="font-medium">{email.date}</span></div>
                        <div className="mt-2 text-gray-700 text-base">{email.snippet}</div>
                      </motion.div>
                    ))
                  )}
                </div>
                <div className="mt-8 flex justify-center">
                  <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg shadow"
                    onClick={() => setShowEmails(false)}
                  >
                    Back to Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}

export default Dashboard;
