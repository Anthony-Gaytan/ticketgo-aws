import { createContext, useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on load
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('ticketgo_token');
      if (token) {
        try {
          // Fetch current logged in user details
          const userData = await apiClient.get('/api/Users/me');
          setUser(userData);
        } catch (error) {
          console.error('Failed to validate session token', error);
          localStorage.removeItem('ticketgo_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/api/Auth/login', { email, password });
      
      // The API returns token and expiration
      if (response && response.token) {
        localStorage.setItem('ticketgo_token', response.token);
        // Get user profile info
        const userData = await apiClient.get('/api/Users/me');
        setUser(userData);
        return { success: true };
      }
      
      throw new Error('Formato de login incorrecto.');
    } catch (error) {
      console.error('Login request failed', error);
      return { success: false, error: error.message || 'Credenciales inválidas.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('ticketgo_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
