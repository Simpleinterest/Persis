import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types/socket.types';
/**
 * Authenticate socket connection using JWT token
 */
export declare const authenticateSocket: (socket: AuthenticatedSocket, token: string) => Promise<boolean>;
/**
 * Socket authentication middleware
 */
export declare const socketAuthMiddleware: (io: Server) => void;
//# sourceMappingURL=socketAuth.d.ts.map