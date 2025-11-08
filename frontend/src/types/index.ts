// Global type definitions for the frontend

export interface User {
  _id: string;
  userName: string;
  profile?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    bio?: string;
    avatar?: string;
  };
  bodyWeight?: number;
  height?: number;
  gender?: string;
  sports: string[];
  age?: number;
  coachId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coach {
  _id: string;
  userName: string;
  studentsId: string[];
  sports: string[];
  aiParameters?: {
    [studentId: string]: string;
  };
  profile?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    bio?: string;
    avatar?: string;
    specialization?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user?: User;
  coach?: Coach;
}

export interface LoginCredentials {
  userName: string;
  passWord: string;
}

export interface RegisterUserData extends LoginCredentials {
  profile?: User['profile'];
  bodyWeight?: number;
  height?: number;
  gender?: string;
  sports?: string[];
  age?: number;
}

export interface RegisterCoachData extends LoginCredentials {
  sports?: string[];
  profile?: Coach['profile'];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'coach' | 'ai';
  receiverId?: string;
  receiverType?: 'user' | 'coach';
  message: string;
  timestamp: Date;
  conversationId: string;
  type: 'text' | 'video' | 'system';
}

export interface AIFormCorrection {
  userId: string;
  exercise: string;
  correction: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
}

export interface VideoAnalysis {
  userId: string;
  videoId: string;
  analysis: string;
  exercise: string;
}

