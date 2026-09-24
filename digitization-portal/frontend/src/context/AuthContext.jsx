import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/auth';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('bhumipatra_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('bhumipatra_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Validate or restore user profile if token is present
  const checkAuth = useCallback(async () => {
    const existingToken = localStorage.getItem('bhumipatra_token');
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await authApi.getMe();
      const currentUser = data?.user || data;
      setUser(currentUser);
      localStorage.setItem('bhumipatra_user', JSON.stringify(currentUser));
      setAuthError(null);
    } catch (err) {
      console.warn('Authentication check failed:', err.message);
      // If 401 or network error, let client interceptor or context handle
      if (err.status === 401) {
        localStorage.removeItem('bhumipatra_token');
        localStorage.removeItem('bhumipatra_user');
        setToken(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for 401 session expiry events triggered by API client
    const handleSessionExpired = (event) => {
      setToken(null);
      setUser(null);
      setAuthError(event.detail || 'Your session has expired. Please sign in again.');
    };

    window.addEventListener('bhumipatra:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('bhumipatra:session-expired', handleSessionExpired);
    };
  }, [checkAuth]);

  /**
   * Log in operator
   */
  const login = async (credentials) => {
    setAuthError(null);
    try {
      const data = await authApi.login(credentials);
      // Support common JWT response formats: { token, user } or { accessToken, user } or { data: { token, user } }
      const receivedToken = data?.token || data?.accessToken || data?.data?.token;
      const receivedUser = data?.user || data?.data?.user || {
        email: credentials.email || credentials.username,
        role: USER_ROLES.DIGITIZATION_OPERATOR,
        name: credentials.email?.split('@')[0] || 'Operator'
      };

      if (!receivedToken) {
        throw new Error('Authentication token was not returned by the server.');
      }

      localStorage.setItem('bhumipatra_token', receivedToken);
      localStorage.setItem('bhumipatra_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      return { success: true, user: receivedUser };
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    }
  };

  /**
   * Log out operator
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('bhumipatra_token');
      localStorage.removeItem('bhumipatra_user');
      setToken(null);
      setUser(null);
      setAuthError(null);
    }
  };

  const isOperator = user?.role === USER_ROLES.DIGITIZATION_OPERATOR || !user?.role; // Default assume operator for this portal

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        authError,
        isOperator,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
