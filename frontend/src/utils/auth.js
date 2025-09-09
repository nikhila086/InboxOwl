// Authentication utility functions

let cachedUser = null;

export const isAuthenticated = async () => {
  try {
    const response = await fetch('http://localhost:3000/auth/check', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    
    if (data.authenticated && data.user) {
      cachedUser = data.user;
    } else {
      cachedUser = null;
    }
    
    return data.authenticated;
  } catch (error) {
    console.error('Auth check failed:', error);
    cachedUser = null;
    return false;
  }
};

export const getUser = () => {
  return cachedUser;
};

export const setAuthData = (user) => {
  cachedUser = user;
};

export const clearAuth = async () => {
  try {
    await fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    cachedUser = null;
  }
};

// Initialize auth from URL if needed
export const initializeAuthFromUrl = () => {
  return false; // We're using session-based auth
};
