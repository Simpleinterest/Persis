import { Server } from 'socket.io';
import { AuthenticatedSocket, ChatMessage } from '../types/socket.types';
import {
  getOrCreateConversation,
  joinUserToRoom,
  leaveUserFromRoom,
  registerUserSocket,
  unregisterUserSocket,
  handleChatMessage,
  handleAIChatMessage,
  handleVideoFrame,
  sendToUser,
} from '../services/socketService';
import { clearVideoAnalysisHistory } from '../services/conversationStore';
import { analyzeVideoForm } from '../services/xaiService';
import User from '../models/User';
import Coach from '../models/Coach';

/**
 * Setup socket event handlers
 */
export const setupSocketHandlers = (io: Server): void => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const userType = socket.userType!;

    console.log(`✅ ${userType} connected: ${userId} (socket: ${socket.id})`);

    // Register user socket
    registerUserSocket(userId, socket.id);

    // Send authentication success
    socket.emit('auth-success', {
      userId: userId,
      userType: userType,
    });

    // Join user to their personal room
    const userRoom = `${userType}_${userId}`;
    joinUserToRoom(socket, userRoom);

    /**
     * Join conversation (User-Coach chat)
     */
    socket.on('join-conversation', async (data: { otherUserId: string }) => {
      try {
        let conversationUserId: string;
        let conversationCoachId: string;

        if (userType === 'user') {
          // Verify user has relationship with coach
          const user = await User.findById(userId);
          if (!user || user.coachId?.toString() !== data.otherUserId) {
            socket.emit('message-error', 'Not authorized to join this conversation');
            return;
          }
          conversationUserId = userId;
          conversationCoachId = data.otherUserId;
        } else if (userType === 'coach') {
          // Verify coach has this student
          const coach = await Coach.findById(userId);
          if (!coach || !coach.studentsId.some(id => id.toString() === data.otherUserId)) {
            socket.emit('message-error', 'Not authorized to join this conversation');
            return;
          }
          conversationUserId = data.otherUserId;
          conversationCoachId = userId;
        } else {
          socket.emit('message-error', 'Invalid user type');
          return;
        }

        const conversation = getOrCreateConversation(conversationUserId, conversationCoachId);

        joinUserToRoom(socket, conversation.id);
        socket.emit('joined-conversation', { conversationId: conversation.id });
      } catch (error: any) {
        socket.emit('message-error', error.message || 'Failed to join conversation');
      }
    });

    /**
     * Leave conversation
     */
    socket.on('leave-conversation', (data: { conversationId: string }) => {
      leaveUserFromRoom(socket, data.conversationId);
      socket.emit('left-conversation', { conversationId: data.conversationId });
    });

    /**
     * Send message (User-Coach chat)
     */
    socket.on('send-message', async (messageData: { message: string; conversationId: string; receiverId?: string }) => {
      await handleChatMessage(io, socket, messageData);
    });

    /**
     * Join AI chat
     */
    socket.on('join-ai-chat', async (data: { userId: string }) => {
      try {
        if (userType !== 'user' || userId !== data.userId) {
          socket.emit('message-error', 'Unauthorized');
          return;
        }

        const aiRoomId = `ai_chat_${data.userId}`;
        joinUserToRoom(socket, aiRoomId);
        socket.emit('joined-ai-chat', { userId: data.userId });
      } catch (error: any) {
        socket.emit('message-error', error.message || 'Failed to join AI chat');
      }
    });

    /**
     * Leave AI chat
     */
    socket.on('leave-ai-chat', (data: { userId: string }) => {
      const aiRoomId = `ai_chat_${data.userId}`;
      leaveUserFromRoom(socket, aiRoomId);
      socket.emit('left-ai-chat', { userId: data.userId });
    });

    /**
     * Send AI message
     */
    socket.on('send-ai-message', async (data: { userId: string; message: string }) => {
      await handleAIChatMessage(io, socket, data);
    });

    /**
     * Start live video stream
     */
    socket.on('start-live-stream', async (data: { userId: string }) => {
      try {
        if (userType !== 'user' || userId !== data.userId) {
          socket.emit('message-error', 'Unauthorized');
          return;
        }

        const streamRoomId = `live_stream_${data.userId}`;
        joinUserToRoom(socket, streamRoomId);
        
        sendToUser(io, data.userId, 'stream-status', {
          userId: data.userId,
          status: 'active',
        });

        socket.emit('live-stream-started', { userId: data.userId });
      } catch (error: any) {
        socket.emit('message-error', error.message || 'Failed to start live stream');
      }
    });

    /**
     * Stop live video stream
     */
    socket.on('stop-live-stream', (data: { userId: string }) => {
      const streamRoomId = `live_stream_${data.userId}`;
      leaveUserFromRoom(socket, streamRoomId);
      
      // Clear video analysis history when stream stops
      clearVideoAnalysisHistory(data.userId);
      
      sendToUser(io, data.userId, 'stream-status', {
        userId: data.userId,
        status: 'inactive',
      });

      socket.emit('live-stream-stopped', { userId: data.userId });
    });

    /**
     * Send video frame
     */
    socket.on('video-frame', async (data: { userId: string; videoData: string; frameNumber?: number; exercise?: string; frameDescription?: string }) => {
      await handleVideoFrame(io, socket, data);
    });

    /**
     * Upload video
     */
    socket.on('upload-video', async (data: { userId: string; videoData: string; fileName: string; exercise?: string; videoDescription?: string }) => {
      try {
        if (userType !== 'user' || userId !== data.userId) {
          socket.emit('message-error', 'Unauthorized');
          return;
        }

        const videoId = `video_${Date.now()}_${userId}`;
        
        // If exercise and description are provided, analyze the video
        if (data.exercise && data.videoDescription) {
          try {
            const analysis = await analyzeVideoForm(
              data.userId,
              data.videoDescription,
              data.exercise
            );

            // Send analysis result
            socket.emit('video-analysis', {
              userId: data.userId,
              videoId: videoId,
              analysis: analysis,
              exercise: data.exercise,
            });
          } catch (error: any) {
            console.error('Error analyzing video:', error);
            // Still acknowledge video upload even if analysis fails
          }
        }

        socket.emit('video-uploaded', {
          userId: data.userId,
          videoId: videoId,
        });
      } catch (error: any) {
        socket.emit('message-error', error.message || 'Failed to upload video');
      }
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      console.log(`❌ ${userType} disconnected: ${userId} (socket: ${socket.id})`);
      unregisterUserSocket(userId, socket.id);
    });

    /**
     * Error handler
     */
    socket.on('error', (error: Error) => {
      console.error(`Socket error for ${userId}:`, error);
      socket.emit('socket-error', error.message);
    });
  });
};

