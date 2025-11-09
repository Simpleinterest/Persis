"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVideoFrame = exports.handleAIChatMessage = exports.handleChatMessage = exports.sendToUser = exports.broadcastToConversation = exports.getUserSocketIds = exports.unregisterUserSocket = exports.registerUserSocket = exports.leaveUserFromRoom = exports.joinUserToRoom = exports.getOrCreateConversation = exports.generateConversationId = void 0;
const xaiService_1 = require("./xaiService");
const conversationStore_1 = require("./conversationStore");
// Store active conversations
const activeConversations = new Map();
// Store user socket connections
const userSockets = new Map(); // userId -> socketIds[]
/**
 * Generate conversation ID
 */
const generateConversationId = (userId, coachId) => {
    const ids = [userId, coachId].sort();
    return `conv_${ids[0]}_${ids[1]}`;
};
exports.generateConversationId = generateConversationId;
/**
 * Get or create conversation room
 */
const getOrCreateConversation = (userId, coachId) => {
    const conversationId = (0, exports.generateConversationId)(userId, coachId);
    if (!activeConversations.has(conversationId)) {
        const room = {
            id: conversationId,
            type: 'user-coach',
            participants: [userId, coachId],
            createdAt: new Date(),
        };
        activeConversations.set(conversationId, room);
    }
    return activeConversations.get(conversationId);
};
exports.getOrCreateConversation = getOrCreateConversation;
/**
 * Join user to socket room
 */
const joinUserToRoom = (socket, roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.userId} joined room ${roomId}`);
};
exports.joinUserToRoom = joinUserToRoom;
/**
 * Leave user from socket room
 */
const leaveUserFromRoom = (socket, roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.userId} left room ${roomId}`);
};
exports.leaveUserFromRoom = leaveUserFromRoom;
/**
 * Register user socket
 */
const registerUserSocket = (userId, socketId) => {
    if (!userSockets.has(userId)) {
        userSockets.set(userId, []);
    }
    userSockets.get(userId).push(socketId);
};
exports.registerUserSocket = registerUserSocket;
/**
 * Unregister user socket
 */
const unregisterUserSocket = (userId, socketId) => {
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
exports.unregisterUserSocket = unregisterUserSocket;
/**
 * Get user socket IDs
 */
const getUserSocketIds = (userId) => {
    return userSockets.get(userId) || [];
};
exports.getUserSocketIds = getUserSocketIds;
/**
 * Broadcast message to conversation room
 */
const broadcastToConversation = (io, conversationId, event, data) => {
    io.to(conversationId).emit(event, data);
};
exports.broadcastToConversation = broadcastToConversation;
/**
 * Send message to specific user
 */
const sendToUser = (io, userId, event, data) => {
    const socketIds = (0, exports.getUserSocketIds)(userId);
    socketIds.forEach(socketId => {
        io.to(socketId).emit(event, data);
    });
};
exports.sendToUser = sendToUser;
/**
 * Handle chat message
 */
const handleChatMessage = async (io, socket, messageData) => {
    try {
        // Validate message data
        if (!messageData.message || !messageData.conversationId) {
            socket.emit('message-error', 'Invalid message data');
            return;
        }
        // Create message object
        const message = {
            senderId: socket.userId,
            senderType: socket.userType,
            receiverId: messageData.receiverId,
            receiverType: socket.userType === 'user' ? 'coach' : 'user',
            message: messageData.message,
            timestamp: new Date(),
            conversationId: messageData.conversationId,
            type: 'text',
            id: `msg_${Date.now()}_${socket.userId}`,
        };
        // Broadcast to conversation room
        (0, exports.broadcastToConversation)(io, messageData.conversationId, 'receive-message', message);
        // Confirm message was sent
        socket.emit('message-sent', { messageId: message.id });
    }
    catch (error) {
        socket.emit('message-error', error.message || 'Failed to send message');
    }
};
exports.handleChatMessage = handleChatMessage;
/**
 * Handle AI chat message
 */
const handleAIChatMessage = async (io, socket, messageData) => {
    try {
        if (socket.userType !== 'user' || socket.userId !== messageData.userId) {
            socket.emit('message-error', 'Unauthorized');
            return;
        }
        const aiRoomId = `ai_chat_${messageData.userId}`;
        // Get conversation history
        const conversationHistory = (0, conversationStore_1.getConversationHistory)(messageData.userId);
        // Add user message to history
        (0, conversationStore_1.addToConversationHistory)(messageData.userId, {
            role: 'user',
            content: messageData.message,
        });
        try {
            // Get AI response from XAI
            console.log(`🤖 Getting AI response for user ${messageData.userId}`);
            const aiResponseText = await (0, xaiService_1.getAIChatResponse)(messageData.userId, messageData.message, conversationHistory);
            // Add AI response to history
            (0, conversationStore_1.addToConversationHistory)(messageData.userId, {
                role: 'assistant',
                content: aiResponseText,
            });
            // Send AI response to user
            (0, exports.sendToUser)(io, messageData.userId, 'receive-ai-message', {
                userId: messageData.userId,
                message: aiResponseText,
                from: 'ai',
            });
            console.log(`✅ AI response sent to user ${messageData.userId}`);
        }
        catch (error) {
            console.error('❌ XAI API Error in handleAIChatMessage:', error);
            const errorMessage = error.message || 'Failed to get AI response. Please try again.';
            // Send detailed error to user
            socket.emit('message-error', errorMessage);
            // Also send a user-friendly message in the chat
            (0, exports.sendToUser)(io, messageData.userId, 'receive-ai-message', {
                userId: messageData.userId,
                message: `I'm sorry, I'm having trouble connecting right now. ${errorMessage.includes('API key') ? 'Please contact support - the AI service may need configuration.' : 'Please try again in a moment.'}`,
                from: 'ai',
            });
        }
    }
    catch (error) {
        socket.emit('message-error', error.message || 'Failed to send AI message');
    }
};
exports.handleAIChatMessage = handleAIChatMessage;
/**
 * Handle video frame streaming
 */
const handleVideoFrame = async (io, socket, videoData) => {
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
                const previousCorrections = (0, conversationStore_1.getVideoAnalysisHistory)(videoData.userId);
                // Analyze frame with XAI
                const analysis = await (0, xaiService_1.analyzeLiveVideoFrame)(videoData.userId, videoData.frameDescription, videoData.exercise, previousCorrections);
                // Add correction to history if it's significant
                if (analysis.severity !== 'info' || analysis.correction.length > 50) {
                    (0, conversationStore_1.addToVideoAnalysisHistory)(videoData.userId, analysis.correction);
                }
                // Send form correction to user
                const correction = {
                    userId: videoData.userId,
                    exercise: videoData.exercise,
                    correction: analysis.correction,
                    timestamp: new Date(),
                    severity: analysis.severity,
                };
                (0, exports.sendToUser)(io, videoData.userId, 'form-correction', correction);
            }
            catch (error) {
                console.error('Error analyzing video frame:', error);
                // Don't emit error to user for video analysis failures, just log it
            }
        }
        // Acknowledge video frame received
        io.to(streamRoomId).emit('video-frame', {
            ...videoData,
            timestamp: new Date(),
        });
    }
    catch (error) {
        socket.emit('message-error', error.message || 'Failed to process video frame');
    }
};
exports.handleVideoFrame = handleVideoFrame;
//# sourceMappingURL=socketService.js.map