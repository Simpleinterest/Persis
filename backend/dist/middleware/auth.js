"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateCoach = exports.authenticateUser = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
const Coach_1 = __importDefault(require("../models/Coach"));
/**
 * Authentication middleware for users
 */
const authenticateUser = async (req, res, next) => {
    try {
        const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        if (decoded.type !== 'user') {
            res.status(403).json({ error: 'Invalid token type for user route' });
            return;
        }
        // Verify user still exists
        const user = await User_1.default.findById(decoded.id);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        req.user = {
            id: decoded.id,
            userName: decoded.userName,
            type: 'user',
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: error.message || 'Authentication failed' });
    }
};
exports.authenticateUser = authenticateUser;
/**
 * Authentication middleware for coaches
 */
const authenticateCoach = async (req, res, next) => {
    try {
        const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        if (decoded.type !== 'coach') {
            res.status(403).json({ error: 'Invalid token type for coach route' });
            return;
        }
        // Verify coach still exists
        const coach = await Coach_1.default.findById(decoded.id);
        if (!coach) {
            res.status(401).json({ error: 'Coach not found' });
            return;
        }
        req.user = {
            id: decoded.id,
            userName: decoded.userName,
            type: 'coach',
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: error.message || 'Authentication failed' });
    }
};
exports.authenticateCoach = authenticateCoach;
/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
        if (token) {
            const decoded = (0, jwt_1.verifyToken)(token);
            req.user = {
                id: decoded.id,
                userName: decoded.userName,
                type: decoded.type,
            };
        }
        next();
    }
    catch (error) {
        // If token is invalid, just continue without auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map