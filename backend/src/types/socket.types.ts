import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: 'user' | 'coach';
  userName?: string;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderType: 'user' | 'coach' | 'ai';
  receiverId?: string;
  receiverType?: 'user' | 'coach';
  message: string;
  timestamp: Date;
  conversationId: string;
  type: 'text' | 'video' | 'system';
}

export interface ConversationRoom {
  id: string;
  type: 'user-coach' | 'user-ai';
  participants: string[]; // User IDs and Coach IDs
  createdAt: Date;
  lastMessageAt?: Date;
}

export interface VideoStreamData {
  userId: string;
  videoData: string; // Base64 or blob data
  timestamp: Date;
  frameNumber?: number;
}

export interface AIFormCorrection {
  userId: string;
  exercise: string;
  correction: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
}

export interface SocketEvents {
  // Connection events
  'connection': () => void;
  'disconnect': () => void;
  'authenticate': (data: { token: string }) => void;
  'auth-success': (data: { userId: string; userType: string }) => void;
  'auth-error': (error: string) => void;

  // Chat events (User-Coach)
  'join-conversation': (data: { conversationId: string }) => void;
  'leave-conversation': (data: { conversationId: string }) => void;
  'send-message': (data: ChatMessage) => void;
  'receive-message': (data: ChatMessage) => void;
  'message-sent': (data: { messageId: string }) => void;
  'message-error': (error: string) => void;

  // AI Coach chat events
  'join-ai-chat': (data: { userId: string }) => void;
  'leave-ai-chat': (data: { userId: string }) => void;
  'send-ai-message': (data: { userId: string; message: string }) => void;
  'receive-ai-message': (data: { userId: string; message: string; from: 'ai' }) => void;

  // Live video streaming events
  'start-live-stream': (data: { userId: string }) => void;
  'stop-live-stream': (data: { userId: string }) => void;
  'video-frame': (data: VideoStreamData) => void;
  'form-correction': (data: AIFormCorrection) => void;
  'stream-status': (data: { userId: string; status: 'active' | 'inactive' }) => void;

  // Video upload events
  'upload-video': (data: { userId: string; videoData: string; fileName: string }) => void;
  'video-uploaded': (data: { userId: string; videoId: string }) => void;
  'video-analysis': (data: { userId: string; analysis: string }) => void;
}

