import axios from 'axios';
import API_URL from '../config/api';

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

export interface Student {
  _id: string;
  userName: string;
  profile?: {
    fullName?: string;
    email?: string;
    bio?: string;
    avatar?: string;
  };
  age?: number;
  bodyWeight?: number;
  height?: number;
  gender?: string;
  sports?: string[];
  createdAt?: string;
  updatedAt?: string;
}


export const coachService = {
  // Get all students
  getStudents: async (): Promise<Student[]> => {
    const response = await api.get<{ students: Student[] }>('/api/coach/students');
    return response.data.students;
  },

  // Get a specific student
  getStudent: async (studentId: string): Promise<{
    student: Student;
    performanceData?: any[];
    goals?: any[];
  }> => {
    const response = await api.get<{ 
      student: Student;
      performanceData?: any[];
      goals?: any[];
    }>(`/api/coach/students/${studentId}`);
    return response.data;
  },

  // Request to add a student by username
  requestStudentByUsername: async (username: string, message?: string): Promise<void> => {
    await api.post('/api/coach/students/request', { username, message });
  },

  // Remove a student
  removeStudent: async (studentId: string): Promise<void> => {
    await api.delete(`/api/coach/students/${studentId}`);
  },

  // Get coach profile
  getCoachProfile: async () => {
    const response = await api.get('/api/coach/profile');
    return response.data.coach;
  },

  // Update coach profile
  updateCoachProfile: async (data: any) => {
    const response = await api.put('/api/coach/profile', data);
    return response.data.coach;
  },

  // Get student AI parameters
  getStudentAIParameters: async (studentId: string): Promise<string> => {
    const response = await api.get<{ parameters: string }>(`/api/coach/students/${studentId}/ai-parameters`);
    return response.data.parameters;
  },

  // Update student AI parameters
  updateStudentAIParameters: async (studentId: string, parameters: string): Promise<void> => {
    await api.put(`/api/coach/students/${studentId}/ai-parameters`, { parameters });
  },

  // Get video analyses for a student
  getStudentVideoAnalyses: async (studentId: string, type?: 'live' | 'uploaded'): Promise<any[]> => {
    const params = type ? `?type=${type}` : '';
    const response = await api.get<{ analyses: any[] }>(`/api/coach/students/${studentId}/video-analyses${params}`);
    return response.data.analyses;
  },

  // Get uploaded videos for a student
  getStudentVideos: async (studentId: string): Promise<any[]> => {
    const response = await api.get<{ videos: any[] }>(`/api/coach/students/${studentId}/videos`);
    return response.data.videos;
  },
};

export default coachService;

