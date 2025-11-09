import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types/socket.types';
/**
 * Authenticate socket connection using JWT token
 */
export declare const authenticateSocket: (socket: AuthenticatedSocket, next: (err?: Error) => void) => Promise<void>;
/**
 * Setup socket authentication middleware
 */
export declare const setupSocketAuth: (io: Server) => void;
//# sourceMappingURL=socketAuth.d.ts.map