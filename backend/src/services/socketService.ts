import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket, ChatRoom } from '../types/socket.types';
import Coach from '../models/Coach';

// In-memory storage for rooms (in production, use Redis or database)
const rooms = new Map<string, ChatRoom>();
const userRooms = new Map<string, Set<string>>(); // userId -> Set of roomIds
const roomSockets = new Map<string, Set<string>>(); // roomId -> Set of socketIds
const userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds (track all sockets for a user)

/**
 * Generate room ID for user-coach or user-ai chat
 */
export const generateRoomId = (userId: string, otherId: string, type: 'user-coach' | 'user-ai'): string => {
  const sortedIds = [userId, otherId].sort();
  return `${type}:${sortedIds.join(':')}`;
};

/**
 * Create or get chat room
 */
export const getOrCreateRoom = (
  userId: string,
  otherId: string,
  type: 'user-coach' | 'user-ai'
): ChatRoom => {
  const roomId = generateRoomId(userId, otherId, type);
  
  if (rooms.has(roomId)) {
    return rooms.get(roomId)!;
  }

  const room: ChatRoom = {
    id: roomId,
    participants: [userId, otherId],
    type,
    createdAt: new Date(),
  };

  rooms.set(roomId, room);
  return room;
};

/**
 * Join a room
 */
export const joinRoom = (socket: AuthenticatedSocket, roomId: string): void => {
  socket.join(roomId);
  
  // Track room membership
  if (!roomSockets.has(roomId)) {
    roomSockets.set(roomId, new Set());
  }
  roomSockets.get(roomId)!.add(socket.id);

  // Track user's rooms
  if (socket.userId) {
    if (!userRooms.has(socket.userId)) {
      userRooms.set(socket.userId, new Set());
    }
    userRooms.get(socket.userId)!.add(roomId);
  }

  console.log(`Socket ${socket.id} joined room ${roomId}`);
};

/**
 * Leave a room
 */
export const leaveRoom = (socket: AuthenticatedSocket, roomId: string): void => {
  socket.leave(roomId);

  // Remove from room tracking
  if (roomSockets.has(roomId)) {
    roomSockets.get(roomId)!.delete(socket.id);
    if (roomSockets.get(roomId)!.size === 0) {
      roomSockets.delete(roomId);
    }
  }

  // Remove from user's rooms
  if (socket.userId && userRooms.has(socket.userId)) {
    userRooms.get(socket.userId)!.delete(roomId);
    if (userRooms.get(socket.userId)!.size === 0) {
      userRooms.delete(socket.userId);
    }
  }

  console.log(`Socket ${socket.id} left room ${roomId}`);
};

/**
 * Broadcast message to room
 */
export const broadcastToRoom = (
  io: SocketIOServer,
  roomId: string,
  event: string,
  data: any,
  excludeSocketId?: string
): void => {
  if (excludeSocketId) {
    io.to(roomId).except(excludeSocketId).emit(event, data);
  } else {
    io.to(roomId).emit(event, data);
  }
};

/**
 * Get user's rooms
 */
export const getUserRooms = (userId: string): string[] => {
  const userRoomSet = userRooms.get(userId);
  return userRoomSet ? Array.from(userRoomSet) : [];
};

/**
 * Register a socket for a user
 */
export const registerUserSocket = (socket: AuthenticatedSocket): void => {
  if (socket.userId) {
    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId)!.add(socket.id);
    console.log(`Registered socket ${socket.id} for user ${socket.userId} (Total: ${userSockets.get(socket.userId)!.size})`);
  }
};

/**
 * Unregister a socket for a user
 */
export const unregisterUserSocket = (socket: AuthenticatedSocket): void => {
  if (socket.userId && userSockets.has(socket.userId)) {
    userSockets.get(socket.userId)!.delete(socket.id);
    if (userSockets.get(socket.userId)!.size === 0) {
      userSockets.delete(socket.userId);
    }
    console.log(`Unregistered socket ${socket.id} for user ${socket.userId} (Remaining: ${userSockets.get(socket.userId)?.size || 0})`);
  }
};

/**
 * Get all sockets for a user
 */
export const getUserSockets = (userId: string): Set<string> => {
  return userSockets.get(userId) || new Set();
};

/**
 * Disconnect all sockets for a user (except the current one)
 */
export const disconnectOtherUserSockets = (io: SocketIOServer, userId: string, keepSocketId: string): void => {
  const sockets = getUserSockets(userId);
  let disconnectedCount = 0;
  sockets.forEach(socketId => {
    if (socketId !== keepSocketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        disconnectedCount++;
      }
    }
  });
  if (disconnectedCount > 0) {
    console.log(`Disconnected ${disconnectedCount} duplicate socket(s) for user ${userId}, keeping ${keepSocketId}`);
  }
};

/**
 * Cleanup on disconnect
 */
export const cleanupSocket = (socket: AuthenticatedSocket): void => {
  if (socket.userId && userRooms.has(socket.userId)) {
    const roomIds = Array.from(userRooms.get(socket.userId)!);
    roomIds.forEach(roomId => {
      leaveRoom(socket, roomId);
    });
  }
  unregisterUserSocket(socket);
};

/**
 * Verify user has access to room
 */
export const verifyRoomAccess = async (
  socket: AuthenticatedSocket,
  roomId: string
): Promise<boolean> => {
  const room = rooms.get(roomId);
  if (!room) {
    return false;
  }

  // Check if user is a participant
  if (!socket.userId || !room.participants.includes(socket.userId)) {
    // For user-coach rooms, verify coach-student relationship
    if (room.type === 'user-coach' && socket.userType === 'coach') {
      const userId = room.participants.find(id => id !== socket.userId);
      if (userId) {
        const coach = await Coach.findById(socket.userId);
        if (coach && coach.studentsId.some(id => id.toString() === userId)) {
          return true;
        }
      }
    }
    return false;
  }

  return true;
};

