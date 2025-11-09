export interface XAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface XAIChatRequest {
  messages: XAIChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface XAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: XAIChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIChatContext {
  userId: string;
  userName: string;
  userProfile?: {
    age?: number;
    weight?: number;
    height?: number;
    gender?: string;
    sports?: string[];
    goals?: string;
  };
  coachParameters?: string;
  conversationHistory?: XAIChatMessage[];
}

export interface AIChatRequest {
  message: string;
  userId?: string;
  context?: AIChatContext;
  roomId?: string;
}

export interface AIChatResponse {
  message: string;
  analysis?: any;
  timestamp: Date;
}

export interface VideoAnalysisRequest {
  videoData: string | Buffer; // Base64 encoded video or video buffer
  analysisType: 'form' | 'progress' | 'technique' | 'general';
  userId: string;
  exerciseType?: string;
  context?: AIChatContext;
}

export interface VideoAnalysisResponse {
  analysis: {
    formFeedback?: string;
    techniqueTips?: string[];
    progressNotes?: string;
    recommendations?: string[];
    score?: number; // 0-100
  };
  type: string;
  timestamp: Date;
}

export interface AIStreamChunk {
  delta: {
    content?: string;
  };
  finish_reason?: string;
}

