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

export interface LoginRequest {
  userName: string;
  passWord: string;
}

export interface RegisterUserRequest {
  userName: string;
  passWord: string;
  profile?: User['profile'];
  bodyWeight?: number;
  height?: number;
  gender?: string;
  sports?: string[];
  age?: number;
}

export interface RegisterCoachRequest {
  userName: string;
  passWord: string;
  sports?: string[];
  profile?: Coach['profile'];
}

