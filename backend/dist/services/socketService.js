"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRoomAccess = exports.cleanupSocket = exports.disconnectOtherUserSockets = exports.getUserSockets = exports.unregisterUserSocket = exports.registerUserSocket = exports.getUserRooms = exports.broadcastToRoom = exports.leaveRoom = exports.joinRoom = exports.getOrCreateRoom = exports.generateRoomId = void 0;
const Coach_1 = __importDefault(require("../models/Coach"));
// In-memory storage for rooms (in production, use Redis or database)
const rooms = new Map();
const userRooms = new Map(); // userId -> Set of roomIds
const roomSockets = new Map(); // roomId -> Set of socketIds
const userSockets = new Map(); // userId -> Set of socketIds (track all sockets for a user)
/**
 * Generate room ID for user-coach or user-ai chat
 */
const generateRoomId = (userId, otherId, type) => {
    const sortedIds = [userId, otherId].sort();
    return `${type}:${sortedIds.join(':')}`;
};
exports.generateRoomId = generateRoomId;
/**
 * Create or get chat room
 */
const getOrCreateRoom = (userId, otherId, type) => {
    const roomId = (0, exports.generateRoomId)(userId, otherId, type);
    if (rooms.has(roomId)) {
        return rooms.get(roomId);
    }
    const room = {
        id: roomId,
        participants: [userId, otherId],
        type,
        createdAt: new Date(),
    };
    rooms.set(roomId, room);
    return room;
};
exports.getOrCreateRoom = getOrCreateRoom;
/**
 * Join a room
 */
const joinRoom = (socket, roomId) => {
    socket.join(roomId);
    // Track room membership
    if (!roomSockets.has(roomId)) {
        roomSockets.set(roomId, new Set());
    }
    roomSockets.get(roomId).add(socket.id);
    // Track user's rooms
    if (socket.userId) {
        if (!userRooms.has(socket.userId)) {
            userRooms.set(socket.userId, new Set());
        }
        userRooms.get(socket.userId).add(roomId);
    }
    console.log(`Socket ${socket.id} joined room ${roomId}`);
};
exports.joinRoom = joinRoom;
/**
 * Leave a room
 */
const leaveRoom = (socket, roomId) => {
    socket.leave(roomId);
    // Remove from room tracking
    if (roomSockets.has(roomId)) {
        roomSockets.get(roomId).delete(socket.id);
        if (roomSockets.get(roomId).size === 0) {
            roomSockets.delete(roomId);
        }
    }
    // Remove from user's rooms
    if (socket.userId && userRooms.has(socket.userId)) {
        userRooms.get(socket.userId).delete(roomId);
        if (userRooms.get(socket.userId).size === 0) {
            userRooms.delete(socket.userId);
        }
    }
    console.log(`Socket ${socket.id} left room ${roomId}`);
};
exports.leaveRoom = leaveRoom;
/**
 * Broadcast message to room
 */
const broadcastToRoom = (io, roomId, event, data, excludeSocketId) => {
    if (excludeSocketId) {
        io.to(roomId).except(excludeSocketId).emit(event, data);
    }
    else {
        io.to(roomId).emit(event, data);
    }
};
exports.broadcastToRoom = broadcastToRoom;
/**
 * Get user's rooms
 */
const getUserRooms = (userId) => {
    const userRoomSet = userRooms.get(userId);
    return userRoomSet ? Array.from(userRoomSet) : [];
};
exports.getUserRooms = getUserRooms;
/**
 * Register a socket for a user
 */
const registerUserSocket = (socket) => {
    if (socket.userId) {
        if (!userSockets.has(socket.userId)) {
            userSockets.set(socket.userId, new Set());
        }
        userSockets.get(socket.userId).add(socket.id);
        console.log(`Registered socket ${socket.id} for user ${socket.userId} (Total: ${userSockets.get(socket.userId).size})`);
    }
};
exports.registerUserSocket = registerUserSocket;
/**
 * Unregister a socket for a user
 */
const unregisterUserSocket = (socket) => {
    if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
            userSockets.delete(socket.userId);
        }
        console.log(`Unregistered socket ${socket.id} for user ${socket.userId} (Remaining: ${userSockets.get(socket.userId)?.size || 0})`);
    }
};
exports.unregisterUserSocket = unregisterUserSocket;
/**
 * Get all sockets for a user
 */
const getUserSockets = (userId) => {
    return userSockets.get(userId) || new Set();
};
exports.getUserSockets = getUserSockets;
/**
 * Disconnect all sockets for a user (except the current one)
 */
const disconnectOtherUserSockets = (io, userId, keepSocketId) => {
    const sockets = (0, exports.getUserSockets)(userId);
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
exports.disconnectOtherUserSockets = disconnectOtherUserSockets;
/**
 * Cleanup on disconnect
 */
const cleanupSocket = (socket) => {
    if (socket.userId && userRooms.has(socket.userId)) {
        const roomIds = Array.from(userRooms.get(socket.userId));
        roomIds.forEach(roomId => {
            (0, exports.leaveRoom)(socket, roomId);
        });
    }
    (0, exports.unregisterUserSocket)(socket);
};
exports.cleanupSocket = cleanupSocket;
/**
 * Verify user has access to room
 */
const verifyRoomAccess = async (socket, roomId) => {
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
                const coach = await Coach_1.default.findById(socket.userId);
                if (coach && coach.studentsId.some(id => id.toString() === userId)) {
                    return true;
                }
            }
        }
        return false;
    }
    return true;
};
exports.verifyRoomAccess = verifyRoomAccess;
//# sourceMappingURL=socketService.js.map