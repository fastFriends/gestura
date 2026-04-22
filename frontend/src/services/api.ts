import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

export interface SignupPayload {
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TranslationPayload {
  video_data?: string;
  source_language?: string;
  target_language?: string;
}

export interface TranslationResponse {
  text: string;
  audio_url?: string | null;
  confidence: number;
  source_language: string;
  target_language: string;
}

export interface TranslationStatusResponse {
  status: string;
  message: string;
  supported_languages: string[];
  user: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers ?? {};
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
  signup: async (data: SignupPayload): Promise<User> => {
    const response = await api.post<User>('/api/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginPayload): Promise<AuthTokenResponse> => {
    const response = await api.post<AuthTokenResponse>('/api/auth/login', data);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/api/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },
};

// Translation API calls
export const translationAPI = {
  translate: async (data: TranslationPayload): Promise<TranslationResponse> => {
    const response = await api.post<TranslationResponse>('/api/translate', data);
    return response.data;
  },

  getStatus: async (): Promise<TranslationStatusResponse> => {
    const response = await api.get<TranslationStatusResponse>('/api/translate/status');
    return response.data;
  },
};

export default api;
