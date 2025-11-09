"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const socketService_1 = require("../services/socketService");
const conversationStore_1 = require("../services/conversationStore");
const xaiService_1 = require("../services/xaiService");
const User_1 = __importDefault(require("../models/User"));
const Coach_1 = __importDefault(require("../models/Coach"));
/**
 * Setup socket event handlers
 */
const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        const userId = socket.userId;
        const userType = socket.userType;
        console.log(`✅ ${userType} connected: ${userId} (socket: ${socket.id})`);
        // Register user socket
        (0, socketService_1.registerUserSocket)(userId, socket.id);
        // Send authentication success
        socket.emit('auth-success', {
            userId: userId,
            userType: userType,
        });
        // Join user to their personal room
        const userRoom = `${userType}_${userId}`;
        (0, socketService_1.joinUserToRoom)(socket, userRoom);
        /**
         * Join conversation (User-Coach chat)
         */
        socket.on('join-conversation', async (data) => {
            try {
                let conversationUserId;
                let conversationCoachId;
                if (userType === 'user') {
                    // Verify user has relationship with coach
                    const user = await User_1.default.findById(userId);
                    if (!user || user.coachId?.toString() !== data.otherUserId) {
                        socket.emit('message-error', 'Not authorized to join this conversation');
                        return;
                    }
                    conversationUserId = userId;
                    conversationCoachId = data.otherUserId;
                }
                else if (userType === 'coach') {
                    // Verify coach has this student
                    const coach = await Coach_1.default.findById(userId);
                    if (!coach || !coach.studentsId.some(id => id.toString() === data.otherUserId)) {
                        socket.emit('message-error', 'Not authorized to join this conversation');
                        return;
                    }
                    conversationUserId = data.otherUserId;
                    conversationCoachId = userId;
                }
                else {
                    socket.emit('message-error', 'Invalid user type');
                    return;
                }
                const conversation = (0, socketService_1.getOrCreateConversation)(conversationUserId, conversationCoachId);
                (0, socketService_1.joinUserToRoom)(socket, conversation.id);
                socket.emit('joined-conversation', { conversationId: conversation.id });
            }
            catch (error) {
                socket.emit('message-error', error.message || 'Failed to join conversation');
            }
        });
        /**
         * Leave conversation
         */
        socket.on('leave-conversation', (data) => {
            (0, socketService_1.leaveUserFromRoom)(socket, data.conversationId);
            socket.emit('left-conversation', { conversationId: data.conversationId });
        });
        /**
         * Send message (User-Coach chat)
         */
        socket.on('send-message', async (messageData) => {
            await (0, socketService_1.handleChatMessage)(io, socket, messageData);
        });
        /**
         * Join AI chat
         */
        socket.on('join-ai-chat', async (data) => {
            try {
                if (userType !== 'user' || userId !== data.userId) {
                    socket.emit('message-error', 'Unauthorized');
                    return;
                }
                const aiRoomId = `ai_chat_${data.userId}`;
                (0, socketService_1.joinUserToRoom)(socket, aiRoomId);
                socket.emit('joined-ai-chat', { userId: data.userId });
            }
            catch (error) {
                socket.emit('message-error', error.message || 'Failed to join AI chat');
            }
        });
        /**
         * Leave AI chat
         */
        socket.on('leave-ai-chat', (data) => {
            const aiRoomId = `ai_chat_${data.userId}`;
            (0, socketService_1.leaveUserFromRoom)(socket, aiRoomId);
            socket.emit('left-ai-chat', { userId: data.userId });
        });
        /**
         * Send AI message
         */
        socket.on('send-ai-message', async (data) => {
            await (0, socketService_1.handleAIChatMessage)(io, socket, data);
        });
        /**
         * Start live video stream
         */
        socket.on('start-live-stream', async (data) => {
            try {
                if (userType !== 'user' || userId !== data.userId) {
                    socket.emit('message-error', 'Unauthorized');
                    return;
                }
                const streamRoomId = `live_stream_${data.userId}`;
                (0, socketService_1.joinUserToRoom)(socket, streamRoomId);
                (0, socketService_1.sendToUser)(io, data.userId, 'stream-status', {
                    userId: data.userId,
                    status: 'active',
                });
                socket.emit('live-stream-started', { userId: data.userId });
            }
            catch (error) {
                socket.emit('message-error', error.message || 'Failed to start live stream');
            }
        });
        /**
         * Stop live video stream
         */
        socket.on('stop-live-stream', (data) => {
            const streamRoomId = `live_stream_${data.userId}`;
            (0, socketService_1.leaveUserFromRoom)(socket, streamRoomId);
            // Clear video analysis history when stream stops
            (0, conversationStore_1.clearVideoAnalysisHistory)(data.userId);
            (0, socketService_1.sendToUser)(io, data.userId, 'stream-status', {
                userId: data.userId,
                status: 'inactive',
            });
            socket.emit('live-stream-stopped', { userId: data.userId });
        });
        /**
         * Send video frame
         */
        socket.on('video-frame', async (data) => {
            await (0, socketService_1.handleVideoFrame)(io, socket, data);
        });
        /**
         * Upload video
         */
        socket.on('upload-video', async (data) => {
            try {
                if (userType !== 'user' || userId !== data.userId) {
                    socket.emit('message-error', 'Unauthorized');
                    return;
                }
                const videoId = `video_${Date.now()}_${userId}`;
                // If exercise and description are provided, analyze the video
                if (data.exercise && data.videoDescription) {
                    try {
                        const analysis = await (0, xaiService_1.analyzeVideoForm)(data.userId, data.videoDescription, data.exercise);
                        // Send analysis result
                        socket.emit('video-analysis', {
                            userId: data.userId,
                            videoId: videoId,
                            analysis: analysis,
                            exercise: data.exercise,
                        });
                    }
                    catch (error) {
                        console.error('Error analyzing video:', error);
                        // Still acknowledge video upload even if analysis fails
                    }
                }
                socket.emit('video-uploaded', {
                    userId: data.userId,
                    videoId: videoId,
                });
            }
            catch (error) {
                socket.emit('message-error', error.message || 'Failed to upload video');
            }
        });
        /**
         * Disconnect handler
         */
        socket.on('disconnect', () => {
            console.log(`❌ ${userType} disconnected: ${userId} (socket: ${socket.id})`);
            (0, socketService_1.unregisterUserSocket)(userId, socket.id);
        });
        /**
         * Error handler
         */
        socket.on('error', (error) => {
            console.error(`Socket error for ${userId}:`, error);
            socket.emit('socket-error', error.message);
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=socketHandlers.js.map