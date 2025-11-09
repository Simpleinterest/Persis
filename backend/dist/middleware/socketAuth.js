"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketAuth = exports.authenticateSocket = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
const Coach_1 = __importDefault(require("../models/Coach"));
/**
 * Authenticate socket connection using JWT token
 */
const authenticateSocket = async (socket, next) => {
    try {
        // Get token from handshake auth or query
        const token = socket.handshake.auth?.token ||
            socket.handshake.query?.token ||
            (0, jwt_1.extractTokenFromHeader)(socket.handshake.headers.authorization);
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        // Verify token
        const decoded = (0, jwt_1.verifyToken)(token);
        // Verify user/coach exists
        if (decoded.type === 'user') {
            const user = await User_1.default.findById(decoded.id);
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }
            socket.userId = decoded.id;
            socket.userType = 'user';
            socket.userName = user.userName;
        }
        else if (decoded.type === 'coach') {
            const coach = await Coach_1.default.findById(decoded.id);
            if (!coach) {
                return next(new Error('Authentication error: Coach not found'));
            }
            socket.userId = decoded.id;
            socket.userType = 'coach';
            socket.userName = coach.userName;
        }
        else {
            return next(new Error('Authentication error: Invalid user type'));
        }
        next();
    }
    catch (error) {
        next(new Error(`Authentication error: ${error.message}`));
    }
};
exports.authenticateSocket = authenticateSocket;
/**
 * Setup socket authentication middleware
 */
const setupSocketAuth = (io) => {
    io.use(exports.authenticateSocket);
};
exports.setupSocketAuth = setupSocketAuth;
//# sourceMappingURL=socketAuth.js.map