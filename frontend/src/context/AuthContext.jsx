import { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await api.get('/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

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
      setToken(response.data.access_token);
      localStorage.setItem('token', response.data.access_token);
      await fetchUser();
    }
    return response.data;
  };

  const signup = async (userData) => {
    const response = await api.post('/signup', userData);

    if (response.data.access_token) {
      setToken(response.data.access_token);
      localStorage.setItem('token', response.data.access_token);

      await fetchUser();
    }

    return response.data;
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
