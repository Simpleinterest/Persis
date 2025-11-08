import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

export interface JWTPayload {
  id: string;
  userName: string;
  type: 'user' | 'coach';
}

/**
 * Generate JWT token with 1 month expiration
 */
export const generateToken = (payload: JWTPayload): string => {
  // 1 month = 30 days = 30 * 24 * 60 * 60 seconds
  const expiresIn = '30d';
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

