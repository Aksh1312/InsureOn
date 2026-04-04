import { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await api.get('/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    // FastAPI requires form data for login
    const formData = new URLSearchParams();
    formData.append('username', email); // Using email as username
    formData.append('password', password);

    const response = await api.post('/login', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });
    
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      await fetchUser();
    }
    return response.data;
  };

  const signup = async (userData) => {
    const response = await api.post('/signup', userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
