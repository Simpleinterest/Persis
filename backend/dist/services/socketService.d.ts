import { Server } from 'socket.io';
import { AuthenticatedSocket, ConversationRoom } from '../types/socket.types';
/**
 * Generate conversation ID
 */
export declare const generateConversationId: (userId: string, coachId: string) => string;
/**
 * Get or create conversation room
 */
export declare const getOrCreateConversation: (userId: string, coachId: string) => ConversationRoom;
/**
 * Join user to socket room
 */
export declare const joinUserToRoom: (socket: AuthenticatedSocket, roomId: string) => void;
/**
 * Leave user from socket room
 */
export declare const leaveUserFromRoom: (socket: AuthenticatedSocket, roomId: string) => void;
/**
 * Register user socket
 */
export declare const registerUserSocket: (userId: string, socketId: string) => void;
/**
 * Unregister user socket
 */
export declare const unregisterUserSocket: (userId: string, socketId: string) => void;
/**
 * Get user socket IDs
 */
export declare const getUserSocketIds: (userId: string) => string[];
/**
 * Broadcast message to conversation room
 */
export declare const broadcastToConversation: (io: Server, conversationId: string, event: string, data: any) => void;
/**
 * Send message to specific user
 */
export declare const sendToUser: (io: Server, userId: string, event: string, data: any) => void;
/**
 * Handle chat message
 */
export declare const handleChatMessage: (io: Server, socket: AuthenticatedSocket, messageData: {
    message: string;
    conversationId: string;
    receiverId?: string;
}) => Promise<void>;
/**
 * Handle AI chat message
 */
export declare const handleAIChatMessage: (io: Server, socket: AuthenticatedSocket, messageData: {
    userId: string;
    message: string;
}) => Promise<void>;
/**
 * Handle video frame streaming
 */
export declare const handleVideoFrame: (io: Server, socket: AuthenticatedSocket, videoData: {
    userId: string;
    videoData: string;
    frameNumber?: number;
    exercise?: string;
    frameDescription?: string;
}) => Promise<void>;
//# sourceMappingURL=socketService.d.ts.map