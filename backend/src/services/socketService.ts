import { Server } from 'socket.io';
import { AuthenticatedSocket, ChatMessage, ConversationRoom, AIFormCorrection } from '../types/socket.types';
import User from '../models/User';
import Coach from '../models/Coach';
import { getAIChatResponse, analyzeLiveVideoFrame, analyzeVideoForm } from './xaiService';
import {
  getConversationHistory,
  addToConversationHistory,
  getVideoAnalysisHistory,
  addToVideoAnalysisHistory,
  clearVideoAnalysisHistory,
} from './conversationStore';

// Store active conversations
const activeConversations = new Map<string, ConversationRoom>();
// Store user socket connections
const userSockets = new Map<string, string[]>(); // userId -> socketIds[]

/**
 * Generate conversation ID
 */
export const generateConversationId = (userId: string, coachId: string): string => {
  const ids = [userId, coachId].sort();
  return `conv_${ids[0]}_${ids[1]}`;
};

/**
 * Get or create conversation room
 */
export const getOrCreateConversation = (userId: string, coachId: string): ConversationRoom => {
  const conversationId = generateConversationId(userId, coachId);

  if (!activeConversations.has(conversationId)) {
    const room: ConversationRoom = {
      id: conversationId,
      type: 'user-coach',
      participants: [userId, coachId],
      createdAt: new Date(),
    };
    activeConversations.set(conversationId, room);
  }

  return activeConversations.get(conversationId)!;
};

/**
 * Join user to socket room
 */
export const joinUserToRoom = (socket: AuthenticatedSocket, roomId: string): void => {
  socket.join(roomId);
  console.log(`User ${socket.userId} joined room ${roomId}`);
};

/**
 * Leave user from socket room
 */
export const leaveUserFromRoom = (socket: AuthenticatedSocket, roomId: string): void => {
  socket.leave(roomId);
  console.log(`User ${socket.userId} left room ${roomId}`);
};

/**
 * Register user socket
 */
export const registerUserSocket = (userId: string, socketId: string): void => {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, []);
  }
  userSockets.get(userId)!.push(socketId);
};

/**
 * Unregister user socket
 */
export const unregisterUserSocket = (userId: string, socketId: string): void => {
  const sockets = userSockets.get(userId);
  if (sockets) {
    const index = sockets.indexOf(socketId);
    if (index > -1) {
      sockets.splice(index, 1);
    }
    if (sockets.length === 0) {
      userSockets.delete(userId);
    }
  }
};

/**
 * Get user socket IDs
 */
export const getUserSocketIds = (userId: string): string[] => {
  return userSockets.get(userId) || [];
};

/**
 * Broadcast message to conversation room
 */
export const broadcastToConversation = (
  io: Server,
  conversationId: string,
  event: string,
  data: any
): void => {
  io.to(conversationId).emit(event, data);
};

/**
 * Send message to specific user
 */
export const sendToUser = (io: Server, userId: string, event: string, data: any): void => {
  const socketIds = getUserSocketIds(userId);
  socketIds.forEach(socketId => {
    io.to(socketId).emit(event, data);
  });
};

/**
 * Handle chat message
 */
export const handleChatMessage = async (
  io: Server,
  socket: AuthenticatedSocket,
  messageData: { message: string; conversationId: string; receiverId?: string }
): Promise<void> => {
  try {
    // Validate message data
    if (!messageData.message || !messageData.conversationId) {
      socket.emit('message-error', 'Invalid message data');
      return;
    }

    // Create message object
    const message: ChatMessage = {
      senderId: socket.userId!,
      senderType: socket.userType!,
      receiverId: messageData.receiverId,
      receiverType: socket.userType === 'user' ? 'coach' : 'user',
      message: messageData.message,
      timestamp: new Date(),
      conversationId: messageData.conversationId,
      type: 'text',
      id: `msg_${Date.now()}_${socket.userId}`,
    };

    // Broadcast to conversation room
    broadcastToConversation(io, messageData.conversationId, 'receive-message', message);

    // Confirm message was sent
    socket.emit('message-sent', { messageId: message.id });
  } catch (error: any) {
    socket.emit('message-error', error.message || 'Failed to send message');
  }
};

/**
 * Handle AI chat message
 */
export const handleAIChatMessage = async (
  io: Server,
  socket: AuthenticatedSocket,
  messageData: { userId: string; message: string }
): Promise<void> => {
  try {
    if (socket.userType !== 'user' || socket.userId !== messageData.userId) {
      socket.emit('message-error', 'Unauthorized');
      return;
    }

    const aiRoomId = `ai_chat_${messageData.userId}`;

    // Get conversation history
    const conversationHistory = getConversationHistory(messageData.userId);

    // Add user message to history
    addToConversationHistory(messageData.userId, {
      role: 'user',
      content: messageData.message,
    });

    try {
      // Get AI response from XAI
      const aiResponseText = await getAIChatResponse(
        messageData.userId,
        messageData.message,
        conversationHistory
      );

      // Add AI response to history
      addToConversationHistory(messageData.userId, {
        role: 'assistant',
        content: aiResponseText,
      });

      // Send AI response to user
      sendToUser(io, messageData.userId, 'receive-ai-message', {
        userId: messageData.userId,
        message: aiResponseText,
        from: 'ai',
      });
    } catch (error: any) {
      console.error('XAI API Error:', error);
      socket.emit('message-error', 'Failed to get AI response. Please try again.');
    }
  } catch (error: any) {
    socket.emit('message-error', error.message || 'Failed to send AI message');
  }
};

/**
 * Handle video frame streaming
 */
export const handleVideoFrame = async (
  io: Server,
  socket: AuthenticatedSocket,
  videoData: { userId: string; videoData: string; frameNumber?: number; exercise?: string; frameDescription?: string }
): Promise<void> => {
  try {
    if (socket.userType !== 'user' || socket.userId !== videoData.userId) {
      socket.emit('message-error', 'Unauthorized');
      return;
    }

    const streamRoomId = `live_stream_${videoData.userId}`;

    // If frame description is provided, analyze it with XAI
    if (videoData.frameDescription && videoData.exercise) {
      try {
        // Get previous corrections for context
        const previousCorrections = getVideoAnalysisHistory(videoData.userId);

        // Analyze frame with XAI
        const analysis = await analyzeLiveVideoFrame(
          videoData.userId,
          videoData.frameDescription,
          videoData.exercise,
          previousCorrections
        );

        // Add correction to history if it's significant
        if (analysis.severity !== 'info' || analysis.correction.length > 50) {
          addToVideoAnalysisHistory(videoData.userId, analysis.correction);
        }

        // Send form correction to user
        const correction: AIFormCorrection = {
          userId: videoData.userId,
          exercise: videoData.exercise,
          correction: analysis.correction,
          timestamp: new Date(),
          severity: analysis.severity,
        };

        sendToUser(io, videoData.userId, 'form-correction', correction);
      } catch (error: any) {
        console.error('Error analyzing video frame:', error);
        // Don't emit error to user for video analysis failures, just log it
      }
    }

    // Acknowledge video frame received
    io.to(streamRoomId).emit('video-frame', {
      ...videoData,
      timestamp: new Date(),
    });
  } catch (error: any) {
    socket.emit('message-error', error.message || 'Failed to process video frame');
  }
};

