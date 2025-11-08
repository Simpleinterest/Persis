import { api } from '../config/api';
import { User, Coach } from '../types';

/**
 * API service
 * Handles all API calls to the backend
 */

// User API

export const getUserProfile = async (): Promise<{ user: User }> => {
  return await api.get('/api/user/profile');
};

export const updateUserProfile = async (data: Partial<User>): Promise<{ message: string; user: User }> => {
  return await api.put('/api/user/profile', data);
};

export const requestCoach = async (coachId: string): Promise<{ message: string }> => {
  return await api.post(`/api/user/request-coach/${coachId}`, {});
};

export const removeCoach = async (): Promise<{ message: string }> => {
  return await api.delete('/api/user/coach');
};

// Coach API

export const getCoachProfile = async (): Promise<{ coach: Coach }> => {
  return await api.get('/api/coach/profile');
};

export const updateCoachProfile = async (data: Partial<Coach>): Promise<{ message: string; coach: Coach }> => {
  return await api.put('/api/coach/profile', data);
};

export const getStudents = async (): Promise<{ students: User[] }> => {
  return await api.get('/api/coach/students');
};

export const getStudent = async (studentId: string): Promise<{ student: User }> => {
  return await api.get(`/api/coach/students/${studentId}`);
};

export const addStudent = async (studentId: string): Promise<{ message: string }> => {
  return await api.post(`/api/coach/students/${studentId}`, {});
};

export const removeStudent = async (studentId: string): Promise<{ message: string }> => {
  return await api.delete(`/api/coach/students/${studentId}`);
};

export const getSports = async (): Promise<{ sports: string[] }> => {
  return await api.get('/api/coach/sports');
};

export const addSports = async (sports: string[]): Promise<{ message: string; sports: string[] }> => {
  return await api.post('/api/coach/sports', { sports });
};

export const removeSport = async (sport: string): Promise<{ message: string; sports: string[] }> => {
  // Note: DELETE requests with body need special handling
  const token = localStorage.getItem('token');
  const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/coach/sports`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ sport }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API request failed: ${response.statusText}`);
  }
  
  return response.json();
};

export const getStudentAIParameters = async (studentId: string): Promise<{ parameters: string }> => {
  return await api.get(`/api/coach/students/${studentId}/ai-parameters`);
};

export const updateStudentAIParameters = async (
  studentId: string,
  parameters: string
): Promise<{ message: string; aiParameters: any }> => {
  return await api.put(`/api/coach/students/${studentId}/ai-parameters`, { parameters });
};

// AI API

export const analyzeVideo = async (
  videoDescription: string,
  exercise: string
): Promise<{ success: boolean; analysis: string; exercise: string; timestamp: string }> => {
  return await api.post('/api/ai/analyze-video', { videoDescription, exercise });
};

export const getExerciseAdvice = async (
  exercise: string,
  question: string
): Promise<{ success: boolean; advice: string; exercise: string; timestamp: string }> => {
  return await api.post('/api/ai/advice', { exercise, question });
};

