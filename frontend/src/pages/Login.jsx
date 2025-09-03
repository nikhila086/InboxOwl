import React from 'react';

function Login() {
  const handleSignIn = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <img src="https://img.icons8.com/color/96/000000/gmail-new.png" alt="Gmail" className="mb-6 mx-auto" />
        <h1 className="text-3xl font-bold mb-4 text-purple-700">Sign in to InboxOwl</h1>
        <button
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:scale-105 transition-transform"
          onClick={handleSignIn}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
