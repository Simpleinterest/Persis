import { io, Socket } from 'socket.io-client';
import API_URL from '../config/api';
import authService from './authService';
import { Message, AIResponse, VideoAnalysis } from '../types/chat.types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    this.socket = io(API_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('authenticated', (data: { success: boolean }) => {
      if (data.success) {
        console.log('✅ WebSocket authenticated');
      }
    });

    this.socket.on('authentication_error', (data: { error: string }) => {
      console.error('WebSocket authentication error:', data.error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Room management
  joinRoom(roomId: string, callback?: (data: { roomId: string }) => void): void {
    if (this.socket) {
      this.socket.emit('join_room', { roomId });
      if (callback) {
        this.socket.once('room_joined', callback);
      }
    }
  }

  leaveRoom(roomId: string, callback?: (data: { roomId: string }) => void): void {
    if (this.socket) {
      this.socket.emit('leave_room', { roomId });
      if (callback) {
        this.socket.once('room_left', callback);
      }
    }
  }

  // Messaging
  sendMessage(roomId: string, message: string, type: 'text' | 'video' = 'text'): void {
    if (this.socket) {
      this.socket.emit('send_message', { roomId, message, type });
    }
  }

  onMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  offMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.off('new_message', callback);
    }
  }

  // AI Chat
  sendAIChatMessage(message: string, roomId?: string, context?: string): void {
    if (this.socket) {
      this.socket.emit('ai_chat_message', { message, roomId, context });
    }
  }

  onAIResponse(callback: (response: AIResponse) => void): void {
    if (this.socket) {
      this.socket.on('ai_response', callback);
    }
  }

  offAIResponse(callback: (response: AIResponse) => void): void {
    if (this.socket) {
      this.socket.off('ai_response', callback);
    }
  }

  // Streaming AI responses
  onAIResponseStart(callback: (data: { messageId: string; timestamp: Date }) => void): void {
    if (this.socket) {
      this.socket.on('ai_response_start', callback);
    }
  }

  offAIResponseStart(callback: (data: { messageId: string; timestamp: Date }) => void): void {
    if (this.socket) {
      this.socket.off('ai_response_start', callback);
    }
  }

  onAIResponseChunk(callback: (data: { messageId: string; chunk: string; message: string }) => void): void {
    if (this.socket) {
      this.socket.on('ai_response_chunk', callback);
    }
  }

  offAIResponseChunk(callback: (data: { messageId: string; chunk: string; message: string }) => void): void {
    if (this.socket) {
      this.socket.off('ai_response_chunk', callback);
    }
  }

  onAIResponseComplete(callback: (data: { messageId: string; message: string; timestamp: Date }) => void): void {
    if (this.socket) {
      this.socket.on('ai_response_complete', callback);
    }
  }

  offAIResponseComplete(callback: (data: { messageId: string; message: string; timestamp: Date }) => void): void {
    if (this.socket) {
      this.socket.off('ai_response_complete', callback);
    }
  }

  onAIResponseError(callback: (data: { messageId: string; error: string }) => void): void {
    if (this.socket) {
      this.socket.on('ai_response_error', callback);
    }
  }

  offAIResponseError(callback: (data: { messageId: string; error: string }) => void): void {
    if (this.socket) {
      this.socket.off('ai_response_error', callback);
    }
  }

  // Video Analysis
  sendVideoAnalysis(videoData: any, analysisType: 'form' | 'progress' | 'technique' | 'general', exerciseType?: string, roomId?: string): void {
    if (this.socket) {
      this.socket.emit('ai_video_analysis', { videoData, analysisType, exerciseType, roomId });
    }
  }

  onVideoAnalysis(callback: (analysis: VideoAnalysis) => void): void {
    if (this.socket) {
      this.socket.on('ai_analysis_complete', callback);
    }
  }

  offVideoAnalysis(callback: (analysis: VideoAnalysis) => void): void {
    if (this.socket) {
      this.socket.off('ai_analysis_complete', callback);
    }
  }

  // Video Streaming
  startStream(roomId: string): void {
    if (this.socket) {
      this.socket.emit('start_stream', { roomId });
    }
  }

  stopStream(roomId: string): void {
    if (this.socket) {
      this.socket.emit('stop_stream', { roomId });
    }
  }

  sendStreamData(roomId: string, streamData: any): void {
    if (this.socket) {
      this.socket.emit('stream_data', { roomId, streamData });
    }
  }

  onStreamStarted(callback: (data: { roomId: string; streamId: string }) => void): void {
    if (this.socket) {
      this.socket.on('stream_started', callback);
    }
  }

  onStreamStopped(callback: (data: { roomId: string }) => void): void {
    if (this.socket) {
      this.socket.on('stream_stopped', callback);
    }
  }

  onStreamData(callback: (data: { streamId: string; data: any }) => void): void {
    if (this.socket) {
      this.socket.on('stream_data_received', callback);
    }
  }

  // Error handling
  onError(callback: (error: { error: string }) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  offError(callback: (error: { error: string }) => void): void {
    if (this.socket) {
      this.socket.off('error', callback);
    }
  }

  // Connection status
  onConnectionStatus(callback: (data: { status: string; message?: string }) => void): void {
    if (this.socket) {
      this.socket.on('connection_status', callback);
    }
  }

  offConnectionStatus(callback: (data: { status: string; message?: string }) => void): void {
    if (this.socket) {
      this.socket.off('connection_status', callback);
    }
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;

