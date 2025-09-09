import React, { useEffect, useState } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { isAuthenticated, initializeAuthFromUrl } from './utils/auth';

function AuthWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        if (!authenticated && location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login', { replace: true });
      } finally {
        setChecking(false);
      }
    };
    
    checkAuth();
  }, [location.pathname, navigate]);

  if (checking) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen w-full bg-gray-50">
        <AuthWrapper />
      </div>
    </Router>
  );
}

export default App;
