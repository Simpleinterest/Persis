// Application constants

export const APP_NAME = 'Persis';
export const APP_TAGLINE = 'Every rep matters';

// Theme colors (Light yellow and dark grey)
export const COLORS = {
  primary: '#F5F5DC', // Light yellow/beige
  secondary: '#2C2C2C', // Dark grey
  accent: '#D4AF37', // Gold accent
  background: '#1A1A1A', // Very dark grey
  text: '#F5F5DC', // Light text
  textSecondary: '#CCCCCC', // Light grey text
  error: '#FF6B6B',
  success: '#51CF66',
  warning: '#FFD93D',
  info: '#4DABF7',
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    USER_REGISTER: '/api/auth/user/register',
    USER_LOGIN: '/api/auth/user/login',
    USER_ME: '/api/auth/user/me',
    COACH_REGISTER: '/api/auth/coach/register',
    COACH_LOGIN: '/api/auth/coach/login',
    COACH_ME: '/api/auth/coach/me',
  },
  USER: {
    PROFILE: '/api/user/profile',
    REQUEST_COACH: '/api/user/request-coach',
    REMOVE_COACH: '/api/user/coach',
  },
  COACH: {
    PROFILE: '/api/coach/profile',
    STUDENTS: '/api/coach/students',
    STUDENT: '/api/coach/students',
    SPORTS: '/api/coach/sports',
    AI_PARAMETERS: '/api/coach/students',
  },
  AI: {
    ANALYZE_VIDEO: '/api/ai/analyze-video',
    ADVICE: '/api/ai/advice',
  },
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  COACH: 'coach',
  USER_TYPE: 'userType',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  COACH_DASHBOARD: '/coach/dashboard',
  AI_COACH: '/ai-coach',
  MY_COACH: '/my-coach',
  SETTINGS: '/settings',
};

// Gender options
export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

// Common sports
export const COMMON_SPORTS = [
  'Weightlifting',
  'Bodybuilding',
  'Powerlifting',
  'CrossFit',
  'Running',
  'Cycling',
  'Swimming',
  'Basketball',
  'Football',
  'Soccer',
  'Tennis',
  'Yoga',
  'Pilates',
  'Martial Arts',
  'Other',
];

// Exercise types
export const EXERCISE_TYPES = [
  'Squat',
  'Bench Press',
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
  'Pull-ups',
  'Push-ups',
  'Lunges',
  'Planks',
  'Other',
];

