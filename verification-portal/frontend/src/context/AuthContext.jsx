import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('bhumipatra_officer_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('bhumipatra_officer_token'));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('bhumipatra_officer_token');
    localStorage.removeItem('bhumipatra_officer_user');
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((jwtToken, userData) => {
    localStorage.setItem('bhumipatra_officer_token', jwtToken);
    localStorage.setItem('bhumipatra_officer_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  }, []);

  const updateProfile = useCallback((updated) => {
    setUser((prev) => {
      const merged = { ...prev, ...updated };
      localStorage.setItem('bhumipatra_officer_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const storedToken = localStorage.getItem('bhumipatra_officer_token');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (isMounted) {
          const fetchedUser = response?.user || response;
          setUser(fetchedUser);
          localStorage.setItem('bhumipatra_officer_user', JSON.stringify(fetchedUser));
        }
      } catch (err) {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  const isAuthenticated = Boolean(token && user);
  const isOfficer = user?.role === 'VERIFICATION_OFFICER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isOfficer,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
