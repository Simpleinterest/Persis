import { Request, Response } from 'express';
/**
 * Register a new user
 */
export declare const registerUser: (req: Request, res: Response) => Promise<void>;
/**
 * Login user
 */
export declare const loginUser: (req: Request, res: Response) => Promise<void>;
/**
 * Register a new coach
 */
export declare const registerCoach: (req: Request, res: Response) => Promise<void>;
/**
 * Login coach
 */
export declare const loginCoach: (req: Request, res: Response) => Promise<void>;
/**
 * Get current user (for authenticated user routes)
 */
export declare const getCurrentUser: (req: Request, res: Response) => Promise<void>;
/**
 * Get current coach (for authenticated coach routes)
 */
export declare const getCurrentCoach: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map