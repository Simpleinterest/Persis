import { Request, Response, NextFunction } from 'express';
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
export declare const authenticateUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Authentication middleware for coaches
 */
export declare const authenticateCoach: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map