import axios from 'axios';
import API_URL from '../config/api';
import { AuthResponse, LoginRequest, RegisterUserRequest, RegisterCoachRequest, User, Coach } from '../types/auth.types';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  // User authentication
  registerUser: async (data: RegisterUserRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/user/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'user');
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },

  loginUser: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/user/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'user');
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },

  // Coach authentication
  registerCoach: async (data: RegisterCoachRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/coach/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'coach');
      if (response.data.coach) {
        localStorage.setItem('user', JSON.stringify(response.data.coach));
      }
    }
    return response.data;
  },

  loginCoach: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/coach/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'coach');
      if (response.data.coach) {
        localStorage.setItem('user', JSON.stringify(response.data.coach));
      }
    }
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<{ user: User }>('/api/auth/user/me');
    return response.data.user;
  },

  // Get current coach
  getCurrentCoach: async (): Promise<Coach> => {
    const response = await api.get<{ coach: Coach }>('/api/auth/coach/me');
    return response.data.coach;
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
  },

  // Get token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Get user type
  getUserType: (): 'user' | 'coach' | null => {
    return localStorage.getItem('userType') as 'user' | 'coach' | null;
  },

  // Get stored user
  getStoredUser: (): User | Coach | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Check if authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

export default authService;

