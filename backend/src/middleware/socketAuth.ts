import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { AuthenticatedSocket } from '../types/socket.types';
import User from '../models/User';
import Coach from '../models/Coach';

/**
 * Authenticate socket connection using JWT token
 */
export const authenticateSocket = async (socket: AuthenticatedSocket, token: string): Promise<boolean> => {
  try {
    const decoded = verifyToken(token);
    
    // Verify user/coach exists
    if (decoded.type === 'user') {
      const user = await User.findById(decoded.id);
      if (!user) {
        return false;
      }
      socket.userId = decoded.id;
      socket.userType = 'user';
      socket.userName = decoded.userName;
    } else if (decoded.type === 'coach') {
      const coach = await Coach.findById(decoded.id);
      if (!coach) {
        return false;
      }
      socket.userId = decoded.id;
      socket.userType = 'coach';
      socket.userName = decoded.userName;
    } else {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Socket authentication middleware
 */
export const socketAuthMiddleware = (io: Server) => {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const isAuthenticated = await authenticateSocket(socket, token);

      if (!isAuthenticated) {
        return next(new Error('Authentication error: Invalid token'));
      }

      next();
    } catch (error: any) {
      next(new Error('Authentication error: ' + error.message));
    }
  });
};

