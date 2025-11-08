import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../config/api';
import { getToken } from './auth';
import { ChatMessage, AIFormCorrection, VideoAnalysis } from '../types';

/**
 * WebSocket service
 * Handles WebSocket connections and events
 */

let socket: Socket | null = null;

/**
 * Connect to WebSocket server
 */
export const connectSocket = (): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  socket = io(WS_URL, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('✅ WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
  });

  socket.on('auth-success', (data: { userId: string; userType: string }) => {
    console.log('✅ Authentication successful:', data);
  });

  socket.on('auth-error', (error: string) => {
    console.error('❌ Authentication error:', error);
  });

  socket.on('error', (error: Error) => {
    console.error('❌ Socket error:', error);
  });

  return socket;
};

/**
 * Disconnect from WebSocket server
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * User-Coach Chat Events
 */

export const joinConversation = (otherUserId: string, callback?: (data: any) => void): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.emit('join-conversation', { otherUserId });
  if (callback) {
    socket.on('joined-conversation', callback);
  }
};

export const leaveConversation = (conversationId: string): void => {
  if (socket) {
    socket.emit('leave-conversation', { conversationId });
  }
};

export const sendMessage = (
  message: string,
  conversationId: string,
  receiverId?: string
): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.emit('send-message', { message, conversationId, receiverId });
};

export const onReceiveMessage = (callback: (message: ChatMessage) => void): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.on('receive-message', callback);
};

export const onMessageSent = (callback: (data: { messageId: string }) => void): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.on('message-sent', callback);
};

export const onMessageError = (callback: (error: string) => void): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.on('message-error', callback);
};

/**
 * AI Coach Chat Events
 */

export const joinAIChat = (userId: string, callback?: (data: any) => void): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.emit('join-ai-chat', { userId });
  if (callback) {
    socket.on('joined-ai-chat', callback);
  }
};

export const leaveAIChat = (userId: string): void => {
  if (socket) {
    socket.emit('leave-ai-chat', { userId });
  }
};

export const sendAIMessage = (userId: string, message: string): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.emit('send-ai-message', { userId, message });
};

export const onReceiveAIMessage = (callback: (data: { userId: string; message: string; from: 'ai' }) => void): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.on('receive-ai-message', callback);
};

/**
 * Live Video Streaming Events
 */

export const startLiveStream = (userId: string, callback?: (data: any) => void): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.emit('start-live-stream', { userId });
  if (callback) {
    socket.on('live-stream-started', callback);
  }
};

export const stopLiveStream = (userId: string): void => {
  if (socket) {
    socket.emit('stop-live-stream', { userId });
  }
};

export const sendVideoFrame = (
  userId: string,
  videoData: string,
  frameNumber?: number,
  exercise?: string,
  frameDescription?: string
): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.emit('video-frame', { userId, videoData, frameNumber, exercise, frameDescription });
};

export const onFormCorrection = (callback: (correction: AIFormCorrection) => void): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.on('form-correction', callback);
};

export const onStreamStatus = (callback: (data: { userId: string; status: 'active' | 'inactive' }) => void): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.on('stream-status', callback);
};

/**
 * Video Upload Events
 */

export const uploadVideo = (
  userId: string,
  videoData: string,
  fileName: string,
  exercise?: string,
  videoDescription?: string
): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.emit('upload-video', { userId, videoData, fileName, exercise, videoDescription });
};

export const onVideoUploaded = (callback: (data: { userId: string; videoId: string }) => void): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.on('video-uploaded', callback);
};

export const onVideoAnalysis = (callback: (data: VideoAnalysis) => void): void => {
  if (!socket) {
    socket = connectSocket();
  }
  socket.on('video-analysis', callback);
};

/**
 * Cleanup function to remove all event listeners
 */
export const cleanupSocketListeners = (): void => {
  if (socket) {
    socket.removeAllListeners();
  }
};

