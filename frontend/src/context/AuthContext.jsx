import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('skillproof_role') || 'student');
  const [token, setToken] = useState(localStorage.getItem('skillproof_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore authenticated session from localStorage
    const initUser = () => {
      try {
        const savedUser = localStorage.getItem('skillproof_user');
        const savedToken = localStorage.getItem('skillproof_token');
        const savedRole = localStorage.getItem('skillproof_role');

        if (savedUser && savedToken) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setRole(parsed.role || savedRole || 'student');
          setToken(savedToken);
        } else if (savedToken && savedToken.startsWith('dev-')) {
          const parts = savedToken.split('-');
          const devRole = parts[1] || savedRole || 'student';
          const devUserId = parts.slice(2).join('-') || `user-${devRole}`;
          const fallbackUser = {
            id: devUserId,
            email: `${devRole}@skillproof.io`,
            fullName: `${devRole.charAt(0).toUpperCase() + devRole.slice(1)} User`,
            role: devRole,
          };
          setUser(fallbackUser);
          setRole(devRole);
          setToken(savedToken);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Session restore error:', err);
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, []);

  const login = async (email, password, expectedRole) => {
    setLoading(true);
    try {
      const res = await api.login(email, password, expectedRole);
      const loggedUser = res.user;
      setUser(loggedUser);
      setRole(loggedUser.role);
      setToken(res.token);
      localStorage.setItem('skillproof_user', JSON.stringify(loggedUser));
      localStorage.setItem('skillproof_token', res.token);
      localStorage.setItem('skillproof_role', loggedUser.role);
      localStorage.setItem('skillproof_user_id', loggedUser.id);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      if (res.user && res.token) {
        setUser(res.user);
        setRole(res.user.role);
        setToken(res.token);
        localStorage.setItem('skillproof_user', JSON.stringify(res.user));
        localStorage.setItem('skillproof_token', res.token);
        localStorage.setItem('skillproof_role', res.user.role);
        localStorage.setItem('skillproof_user_id', res.user.id);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (newRole) => {
    setRole(newRole);
    const newUserId = `demo-${newRole}-uuid`;
    const newToken = `dev-${newRole}-${newUserId}`;
    setToken(newToken);
    localStorage.setItem('skillproof_role', newRole);
    localStorage.setItem('skillproof_user_id', newUserId);
    localStorage.setItem('skillproof_token', newToken);

    const devUser = {
      id: newUserId,
      email: `${newRole}@skillproof.io`,
      fullName: `${newRole.toUpperCase()} User`,
      role: newRole,
    };
    setUser(devUser);
    localStorage.setItem('skillproof_user', JSON.stringify(devUser));
  };

  const logout = () => {
    localStorage.removeItem('skillproof_user');
    localStorage.removeItem('skillproof_token');
    localStorage.removeItem('skillproof_role');
    localStorage.removeItem('skillproof_user_id');
    setUser(null);
    setToken(null);
    setRole('student');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        switchRole,
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
