import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt';
import User from '../models/User';
import Coach from '../models/Coach';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    userName: string;
    type: 'user' | 'coach';
  };
}

/**
 * Authentication middleware for users
 */
export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = verifyToken(token) as JWTPayload;

    if (decoded.type !== 'user') {
      res.status(403).json({ error: 'Invalid token type for user route' });
      return;
    }

    // Verify user still exists
    const user = await User.findById(decoded.id);
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
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Authentication failed' });
  }
};

/**
 * Authentication middleware for coaches
 */
export const authenticateCoach = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = verifyToken(token) as JWTPayload;

    if (decoded.type !== 'coach') {
      res.status(403).json({ error: 'Invalid token type for coach route' });
      return;
    }

    // Verify coach still exists
    const coach = await Coach.findById(decoded.id);
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
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token) as JWTPayload;
      req.user = {
        id: decoded.id,
        userName: decoded.userName,
        type: decoded.type,
      };
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without auth
    next();
  }
};

