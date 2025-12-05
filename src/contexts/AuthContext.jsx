import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('cryptoTracker_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('cryptoTracker_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const user = await authAPI.login(email, password);
      if (user) {
        setUser(user);
        localStorage.setItem('cryptoTracker_user', JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const user = await authAPI.signup(name, email, password);
      if (user) {
        setUser(user);
        localStorage.setItem('cryptoTracker_user', JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false, error: 'Signup failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cryptoTracker_user');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
