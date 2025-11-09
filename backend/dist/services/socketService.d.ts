import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket, ChatRoom } from '../types/socket.types';
/**
 * Generate room ID for user-coach or user-ai chat
 */
export declare const generateRoomId: (userId: string, otherId: string, type: "user-coach" | "user-ai") => string;
/**
 * Create or get chat room
 */
export declare const getOrCreateRoom: (userId: string, otherId: string, type: "user-coach" | "user-ai") => ChatRoom;
/**
 * Join a room
 */
export declare const joinRoom: (socket: AuthenticatedSocket, roomId: string) => void;
/**
 * Leave a room
 */
export declare const leaveRoom: (socket: AuthenticatedSocket, roomId: string) => void;
/**
 * Broadcast message to room
 */
export declare const broadcastToRoom: (io: SocketIOServer, roomId: string, event: string, data: any, excludeSocketId?: string) => void;
/**
 * Get user's rooms
 */
export declare const getUserRooms: (userId: string) => string[];
/**
 * Register a socket for a user
 */
export declare const registerUserSocket: (socket: AuthenticatedSocket) => void;
/**
 * Unregister a socket for a user
 */
export declare const unregisterUserSocket: (socket: AuthenticatedSocket) => void;
/**
 * Get all sockets for a user
 */
export declare const getUserSockets: (userId: string) => Set<string>;
/**
 * Disconnect all sockets for a user (except the current one)
 */
export declare const disconnectOtherUserSockets: (io: SocketIOServer, userId: string, keepSocketId: string) => void;
/**
 * Cleanup on disconnect
 */
export declare const cleanupSocket: (socket: AuthenticatedSocket) => void;
/**
 * Verify user has access to room
 */
export declare const verifyRoomAccess: (socket: AuthenticatedSocket, roomId: string) => Promise<boolean>;
//# sourceMappingURL=socketService.d.ts.map