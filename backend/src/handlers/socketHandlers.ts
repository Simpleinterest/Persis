import { Server } from 'socket.io';
import { AuthenticatedSocket, SocketMessage, ClientToServerEvents, ServerToClientEvents } from '../types/socket.types';
import {
  getOrCreateRoom,
  joinRoom,
  leaveRoom,
  broadcastToRoom,
  cleanupSocket,
  verifyRoomAccess,
  registerUserSocket,
  unregisterUserSocket,
  getUserSockets,
  disconnectOtherUserSockets,
} from '../services/socketService';
import User from '../models/User';
import Coach from '../models/Coach';
import VideoAnalysis from '../models/VideoAnalysis';
import aiService from '../services/aiService';
import { resetUserState } from '../services/stateTrackingService';

/**
 * Setup socket event handlers
 */
export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    // Register this socket for the user first
    registerUserSocket(socket);

    // Check for existing connections from the same user and disconnect duplicates
    if (socket.userId) {
      const existingSockets = getUserSockets(socket.userId);
      if (existingSockets.size > 1) {
        console.log(`⚠️  User ${socket.userName} (${socket.userId}) has ${existingSockets.size} connections. Disconnecting duplicates...`);
        // Disconnect old connections, keep only the newest one
        disconnectOtherUserSockets(io, socket.userId, socket.id);
      }
    }

    console.log(`✅ Client connected: ${socket.id} (User: ${socket.userName}, Type: ${socket.userType})`);

    // Send authentication success
    socket.emit('authenticated', { success: true });

    // Send connection status
    socket.emit('connection_status', {
      status: 'connected',
      message: 'Successfully connected to Persis',
    });

    /**
     * Join a chat room
     */
    socket.on('join_room', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;

        if (!socket.userId) {
          socket.emit('error', { error: 'Not authenticated' });
          return;
        }

        // Verify room access
        const hasAccess = await verifyRoomAccess(socket, roomId);
        if (!hasAccess) {
          socket.emit('error', { error: 'Access denied to this room' });
          return;
        }

        joinRoom(socket, roomId);
        socket.emit('room_joined', { roomId });

        // Notify others in room
        broadcastToRoom(io, roomId, 'connection_status', {
          status: 'user_joined',
          message: `${socket.userName} joined the room`,
        }, socket.id);
      } catch (error: any) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Leave a chat room
     */
    socket.on('leave_room', (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        leaveRoom(socket, roomId);
        socket.emit('room_left', { roomId });

        // Notify others in room
        broadcastToRoom(io, roomId, 'connection_status', {
          status: 'user_left',
          message: `${socket.userName} left the room`,
        }, socket.id);
      } catch (error: any) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Send message to room
     */
    socket.on('send_message', async (data: { roomId: string; message: string; type?: 'text' | 'video' }) => {
      try {
        const { roomId, message, type = 'text' } = data;

        if (!socket.userId) {
          socket.emit('message_error', { error: 'Not authenticated' });
          return;
        }

        // Verify room access
        const hasAccess = await verifyRoomAccess(socket, roomId);
        if (!hasAccess) {
          socket.emit('message_error', { error: 'Access denied to this room' });
          return;
        }

        // Create message object
        const socketMessage: SocketMessage = {
          id: `${Date.now()}-${socket.id}`,
          from: socket.userId,
          to: roomId,
          message,
          timestamp: new Date(),
          type,
        };

        // Broadcast to room
        broadcastToRoom(io, roomId, 'new_message', socketMessage, socket.id);

        // Also send confirmation to sender
        socket.emit('new_message', socketMessage);
      } catch (error: any) {
        socket.emit('message_error', { error: error.message });
      }
    });

    /**
     * Start video stream
     */
    socket.on('start_stream', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;

        if (!socket.userId) {
          socket.emit('error', { error: 'Not authenticated' });
          return;
        }

        // Verify room access
        const hasAccess = await verifyRoomAccess(socket, roomId);
        if (!hasAccess) {
          socket.emit('error', { error: 'Access denied to this room' });
          return;
        }

        const streamId = `stream-${socket.userId}-${Date.now()}`;

        // Broadcast stream started
        broadcastToRoom(io, roomId, 'stream_started', {
          roomId,
          streamId,
        });

        socket.emit('stream_started', { roomId, streamId });
      } catch (error: any) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Stop video stream
     */
    socket.on('stop_stream', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;

        if (!socket.userId) {
          socket.emit('error', { error: 'Not authenticated' });
          return;
        }

        // Reset user state when stream stops
        if (socket.userId) {
          resetUserState(socket.userId);
        }

        // Broadcast stream stopped
        broadcastToRoom(io, roomId, 'stream_stopped', { roomId });

        socket.emit('stream_stopped', { roomId });
      } catch (error: any) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Send stream data (for video analysis)
     */
    socket.on('stream_data', async (data: { roomId: string; streamData: any }) => {
      try {
        const { roomId, streamData } = data;

        if (!socket.userId) {
          socket.emit('error', { error: 'Not authenticated' });
          return;
        }

        // Verify room access
        const hasAccess = await verifyRoomAccess(socket, roomId);
        if (!hasAccess) {
          socket.emit('error', { error: 'Access denied to this room' });
          return;
        }

        // Broadcast stream data (this will be processed by AI service later)
        broadcastToRoom(io, roomId, 'stream_data_received', {
          streamId: `stream-${socket.userId}`,
          data: streamData,
        });
      } catch (error: any) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * AI Chat message (processed by AI service)
     */
    socket.on('ai_chat_message', async (data: { message: string; context?: string; roomId?: string }) => {
      try {
        if (!socket.userId || socket.userType !== 'user') {
          socket.emit('error', { error: 'Only users can send AI chat messages' });
          return;
        }

        if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
          socket.emit('error', { error: 'Message cannot be empty' });
          return;
        }

        // Get or create AI room
        const roomId = data.roomId || aiService.getAIRoomId(socket.userId);
        // Create room with user and ai-coach as participants
        const room = getOrCreateRoom(socket.userId, 'ai-coach', 'user-ai');
        
        // Ensure user is in the room
        if (!socket.rooms.has(room.id)) {
          joinRoom(socket, room.id);
        }
        
        // Use the generated room ID (might differ from requested)
        const actualRoomId = room.id;

        // Get user's coach if they have one
        const user = await User.findById(socket.userId);
        const coachId = user?.coachId?.toString();

        // Get user context
        const context = await aiService.getUserContext(socket.userId, coachId);

        // Create AI message ID for streaming
        const aiMessageId = `ai-${Date.now()}-${socket.id}`;
        const startTime = new Date();

        // Emit streaming start
        socket.emit('ai_response_start', {
          messageId: aiMessageId,
          timestamp: startTime,
        });

        // Stream AI response
        let fullMessage = '';
        try {
          for await (const chunk of aiService.streamChatMessage({
            message: data.message,
            context,
            userId: socket.userId,
            roomId: actualRoomId,
          })) {
            fullMessage += chunk;
            
            // Send each chunk as it arrives
            socket.emit('ai_response_chunk', {
              messageId: aiMessageId,
              chunk: chunk,
              message: fullMessage,
            });
          }

          // Create complete message object
          const aiMessage: SocketMessage = {
            id: aiMessageId,
            from: 'ai-coach',
            to: socket.userId,
            message: fullMessage,
            timestamp: startTime,
            type: 'text',
          };

          // Emit streaming complete
          socket.emit('ai_response_complete', {
            messageId: aiMessageId,
            message: fullMessage,
            timestamp: new Date(),
          });

          // Don't emit new_message here - the streaming chunks already updated the UI
          // The complete event is enough to finalize the message
        } catch (streamError: any) {
          console.error('AI stream error:', streamError);
          socket.emit('ai_response_error', {
            messageId: aiMessageId,
            error: streamError.message || 'Failed to stream AI response',
          });
        }
      } catch (error: any) {
        console.error('AI chat error:', error);
        socket.emit('error', { error: error.message || 'Failed to process AI message' });
      }
    });

    /**
     * AI Video analysis (processed by AI service)
     */
    socket.on('ai_video_analysis', async (data: { videoData: any; analysisType: string; exerciseType?: string; roomId?: string }) => {
      try {
        if (!socket.userId || socket.userType !== 'user') {
          socket.emit('error', { error: 'Only users can request video analysis' });
          return;
        }

        if (!data.videoData) {
          socket.emit('error', { error: 'Video data is required' });
          return;
        }

        if (!data.analysisType || !['form', 'progress', 'technique', 'general'].includes(data.analysisType)) {
          socket.emit('error', { error: 'Invalid analysis type' });
          return;
        }

        // Get or create AI room
        const roomId = data.roomId || aiService.getAIRoomId(socket.userId);
        const room = getOrCreateRoom(socket.userId, 'ai-coach', 'user-ai');
        
        // Ensure user is in the room
        if (!socket.rooms.has(room.id)) {
          joinRoom(socket, room.id);
        }

        // Get user's coach if they have one
        const user = await User.findById(socket.userId);
        const coachId = user?.coachId?.toString();

        // Get user context
        const context = await aiService.getUserContext(socket.userId, coachId);

        // Send processing status
        socket.emit('ai_analysis_complete', {
          analysis: { status: 'processing', message: 'Analyzing video...' },
          type: data.analysisType,
        });

        // Analyze video (may return null if feedback should be suppressed)
        const analysis = await aiService.analyzeVideo({
          videoData: data.videoData,
          analysisType: data.analysisType as 'form' | 'progress' | 'technique' | 'general',
          userId: socket.userId,
          exerciseType: data.exerciseType,
          context,
        });

        // Only send feedback if analysis was provided (not suppressed)
        if (analysis) {
          // Get user's coach ID
          const user = await User.findById(socket.userId);
          const coachId = user?.coachId || null;

          // Save video analysis to database for coach viewing
          try {
            const videoAnalysis = new VideoAnalysis({
              userId: socket.userId,
              coachId: coachId,
              type: 'live',
              summary: analysis.analysis.formFeedback || 'Form analysis complete',
              feedback: analysis.analysis.formFeedback || null,
              poseData: data.videoData?.landmarks || null,
              metrics: {
                score: analysis.analysis.score || 75,
                exerciseType: data.exerciseType || 'general',
                analysisType: analysis.type,
              },
              duration: data.videoData?.duration || 0,
              coachVisible: true, // Live footage always visible to coach
              studentPermission: true,
              sessionId: data.videoData?.sessionId || `session-${Date.now()}`,
            });
            await videoAnalysis.save();
          } catch (saveError: any) {
            console.error('Failed to save video analysis:', saveError);
            // Don't fail the request if saving fails
          }

          // Send analysis results
          socket.emit('ai_analysis_complete', {
            analysis: analysis.analysis,
            type: analysis.type,
          });

          // Also create a message with the analysis for the chat
          const analysisMessage: SocketMessage = {
            id: `${Date.now()}-analysis-${socket.id}`,
            from: 'ai-coach',
            to: socket.userId,
            message: analysis.analysis.formFeedback || 'Form analysis complete',
            timestamp: analysis.timestamp,
            type: 'video',
          };

          socket.emit('new_message', analysisMessage);
        } else {
          // Feedback was suppressed (too soon or duplicate) - silently skip
          // Don't send any message to avoid spam
        }
      } catch (error: any) {
        console.error('AI video analysis error:', error);
        socket.emit('error', { error: error.message || 'Failed to analyze video' });
        socket.emit('ai_analysis_complete', {
          analysis: { status: 'error', error: error.message },
          type: data.analysisType || 'general',
        });
      }
    });

    /**
     * Coach message to student
     */
    socket.on('coach_message', async (data: { studentId: string; message: string }) => {
      try {
        if (!socket.userId || socket.userType !== 'coach') {
          socket.emit('error', { error: 'Only coaches can send coach messages' });
          return;
        }

        const { studentId, message } = data;

        // Verify coach has this student
        const coach = await Coach.findById(socket.userId);
        if (!coach || !coach.studentsId.some(id => id.toString() === studentId)) {
          socket.emit('error', { error: 'Student not found in your student list' });
          return;
        }

        // Create room for user-coach chat
        const room = getOrCreateRoom(studentId, socket.userId, 'user-coach');
        
        // Create message
        const socketMessage: SocketMessage = {
          id: `${Date.now()}-${socket.id}`,
          from: socket.userId,
          to: studentId,
          message,
          timestamp: new Date(),
          type: 'text',
        };

        // Send to student if they're connected
        io.to(room.id).emit('coach_message_received', socketMessage);
        socket.emit('coach_message_received', socketMessage);
      } catch (error: any) {
        socket.emit('error', { error: error.message });
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id} (User: ${socket.userName})`);
      cleanupSocket(socket);
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
      socket.emit('error', { error: error.message || 'An error occurred' });
    });
  });
};

