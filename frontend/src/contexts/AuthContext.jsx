import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));

  useEffect(() => {
    console.log('AuthContext: Token changed, checking auth. Token:', token?.substring(0, 20));
    checkAuth();
  }, [token]);

  const checkAuth = async () => {
    if (!token) {
      setIsAuthenticated(false);
      setUserEmail(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/check`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.authenticated) {
        setIsAuthenticated(true);
        setUserEmail(response.data.email);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        localStorage.removeItem('auth_token');
        setToken(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUserEmail(null);
      localStorage.removeItem('auth_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (authToken) => {
    localStorage.setItem('auth_token', authToken);
    setToken(authToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  const value = {
    isAuthenticated,
    userEmail,
    loading,
    login,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
