import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

const getWebSocketBaseUrl = () => {
  if (API_BASE_URL) {
    if (API_BASE_URL.startsWith('https://')) {
      return `wss://${API_BASE_URL.slice('https://'.length)}`;
    }
    if (API_BASE_URL.startsWith('http://')) {
      return `ws://${API_BASE_URL.slice('http://'.length)}`;
    }
    if (API_BASE_URL.startsWith('ws://') || API_BASE_URL.startsWith('wss://')) {
      return API_BASE_URL;
    }
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}`;
};

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  signup: async (data: { email: string; username: string; password: string }) => {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Translation API calls
export const translationAPI = {
  translate: async (data: {
    video_data?: string;
    source_language?: string;
    target_language?: string;
  }) => {
    const response = await api.post('/api/translate', data);
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/api/translate/status');
    return response.data;
  },

  openPredictWebSocket: () => {
    const token = localStorage.getItem('access_token');
    const wsBaseUrl = getWebSocketBaseUrl().replace(/\/$/, '');
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    return new WebSocket(`${wsBaseUrl}/api/translate/predict${tokenQuery}`);
  },

  // Reset translation buffer
  resetTranslation: async () => {
    const response = await api.post('/api/translate/reset');
    return response.data;
  },

  // Get supported labels
  getSupportedLabels: async () => {
    const response = await api.get('/api/translate/labels');
    return response.data;
  },

  generateSentence: async (data?: { labels?: string[]; top5?: any[] }) => {
    const response = await api.post('/api/translate/generate', data || {});
    return response.data;
  },

  getTranslationHistory: async (limit = 50) => {
    const response = await api.get('/api/translate/history', {
      params: { limit },
    });
    return response.data;
  },
};

export default api;
