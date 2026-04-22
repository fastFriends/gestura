import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AxiosError } from 'axios';

import { authAPI } from '../services/api';
import type { User } from '../services/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    if (typeof error.response?.data?.detail === 'string') {
      return error.response.data.detail;
    }
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return 'Cannot connect to server. Please make sure the backend is running.';
    }
  }

  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await authAPI.login({ email, password });
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success('Login successful!');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        'Login failed. Please check your credentials.',
      );
      toast.error(errorMessage);
      throw error;
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      await authAPI.signup({ email, username, password });
      await login(email, password);

      toast.success('Account created successfully!');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Signup failed. Please try again.');
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
