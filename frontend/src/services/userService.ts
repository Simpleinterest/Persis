import axios from 'axios';
import API_URL from '../config/api';

export interface CoachRequest {
  _id: string;
  coachId: {
    _id: string;
    userName: string;
    profile?: {
      fullName?: string;
      avatar?: string;
    };
  } | string;
  studentId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
}

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

export const userService = {
  // Get user profile
  getUserProfile: async () => {
    const response = await api.get('/api/user/profile');
    return response.data.user;
  },

  // Update user profile
  updateUserProfile: async (data: any) => {
    const response = await api.put('/api/user/profile', data);
    return response.data.user;
  },

  // Get coach requests
  getCoachRequests: async (): Promise<CoachRequest[]> => {
    const response = await api.get<{ requests: CoachRequest[] }>('/api/user/coach-requests');
    return response.data.requests;
  },

  // Accept coach request
  acceptCoachRequest: async (requestId: string): Promise<void> => {
    await api.post(`/api/user/coach-requests/${requestId}/accept`);
  },

  // Reject coach request
  rejectCoachRequest: async (requestId: string): Promise<void> => {
    await api.post(`/api/user/coach-requests/${requestId}/reject`);
  },

  // Upload video for AI analysis
  uploadVideo: async (file: File, allowCoachView: boolean, analysisType?: string, exerciseType?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('studentPermission', String(allowCoachView));
    if (analysisType) {
      formData.append('analysisType', analysisType);
    }
    if (exerciseType) {
      formData.append('exerciseType', exerciseType);
    }

    const response = await api.post('/api/user/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update video permission for coach viewing
  updateVideoPermission: async (videoId: string, allowCoachView: boolean): Promise<void> => {
    await api.put(`/api/user/videos/${videoId}/permission`, { studentPermission: allowCoachView });
  },

  // Get user progress data
  getUserProgress: async (period: 'week' | 'month' | 'year' | '2years' = 'month', sport?: string) => {
    const params: any = { period };
    if (sport) {
      params.sport = sport;
    }
    const response = await api.get('/api/user/progress', { params });
    return response.data;
  },

  // Get user's coaches
  getUserCoaches: async () => {
    const response = await api.get('/api/user/coaches');
    return response.data.coaches;
  },
};

export default userService;

