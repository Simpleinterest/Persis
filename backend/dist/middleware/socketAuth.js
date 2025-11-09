"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = exports.authenticateSocket = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
const Coach_1 = __importDefault(require("../models/Coach"));
/**
 * Authenticate socket connection using JWT token
 */
const authenticateSocket = async (socket, token) => {
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        // Verify user/coach exists
        if (decoded.type === 'user') {
            const user = await User_1.default.findById(decoded.id);
            if (!user) {
                return false;
            }
            socket.userId = decoded.id;
            socket.userType = 'user';
            socket.userName = decoded.userName;
        }
        else if (decoded.type === 'coach') {
            const coach = await Coach_1.default.findById(decoded.id);
            if (!coach) {
                return false;
            }
            socket.userId = decoded.id;
            socket.userType = 'coach';
            socket.userName = decoded.userName;
        }
        else {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.authenticateSocket = authenticateSocket;
/**
 * Socket authentication middleware
 */
const socketAuthMiddleware = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            const isAuthenticated = await (0, exports.authenticateSocket)(socket, token);
            if (!isAuthenticated) {
                return next(new Error('Authentication error: Invalid token'));
            }
            next();
        }
        catch (error) {
            next(new Error('Authentication error: ' + error.message));
        }
    });
};
exports.socketAuthMiddleware = socketAuthMiddleware;
//# sourceMappingURL=socketAuth.js.map