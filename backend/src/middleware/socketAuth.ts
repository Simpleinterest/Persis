import { Server, Socket } from 'socket.io';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { AuthenticatedSocket } from '../types/socket.types';
import User from '../models/User';
import Coach from '../models/Coach';

/**
 * Authenticate socket connection using JWT token
 */
export const authenticateSocket = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    // Get token from handshake auth or query
    const token = 
      socket.handshake.auth?.token || 
      socket.handshake.query?.token ||
      extractTokenFromHeader(socket.handshake.headers.authorization);

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = verifyToken(token as string);

    // Verify user/coach exists
    if (decoded.type === 'user') {
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.userId = decoded.id;
      socket.userType = 'user';
      socket.userName = user.userName;
    } else if (decoded.type === 'coach') {
      const coach = await Coach.findById(decoded.id);
      if (!coach) {
        return next(new Error('Authentication error: Coach not found'));
      }
      socket.userId = decoded.id;
      socket.userType = 'coach';
      socket.userName = coach.userName;
    } else {
      return next(new Error('Authentication error: Invalid user type'));
    }

    next();
  } catch (error: any) {
    next(new Error(`Authentication error: ${error.message}`));
  }
};

/**
 * Setup socket authentication middleware
 */
export const setupSocketAuth = (io: Server) => {
  io.use(authenticateSocket);
};

