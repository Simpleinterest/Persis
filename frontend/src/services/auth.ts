import { api } from '../config/api';
import { AuthResponse, LoginCredentials, RegisterUserData, RegisterCoachData } from '../types';

/**
 * Authentication service
 * Handles user and coach authentication
 */

// Store token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// User Authentication

export const registerUser = async (data: RegisterUserData): Promise<AuthResponse> => {
  const response = await api.post('/api/auth/user/register', data);
  if (response.token) {
    setToken(response.token);
  }
  return response;
};

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post('/api/auth/user/login', credentials);
  if (response.token) {
    setToken(response.token);
  }
  return response;
};

export const getCurrentUser = async (): Promise<{ user: any }> => {
  return await api.get('/api/auth/user/me');
};

// Coach Authentication

export const registerCoach = async (data: RegisterCoachData): Promise<AuthResponse> => {
  const response = await api.post('/api/auth/coach/register', data);
  if (response.token) {
    setToken(response.token);
  }
  return response;
};

export const loginCoach = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post('/api/auth/coach/login', credentials);
  if (response.token) {
    setToken(response.token);
  }
  return response;
};

export const getCurrentCoach = async (): Promise<{ coach: any }> => {
  return await api.get('/api/auth/coach/me');
};

// Logout
export const logout = (): void => {
  removeToken();
  // Redirect to login page
  window.location.href = '/login';
};

