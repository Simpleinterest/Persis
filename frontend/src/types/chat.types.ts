export interface Message {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'video' | 'system';
}

export interface AIResponse {
  message: string;
  analysis?: any;
}

export interface VideoAnalysis {
  analysis: {
    formFeedback?: string;
    techniqueTips?: string[];
    progressNotes?: string;
    recommendations?: string[];
    score?: number;
    status?: 'processing' | 'complete' | 'error';
    error?: string;
  };
  type: string;
}

