import { Request, Response } from 'express';
/**
 * Get user profile
 */
export declare const getUserProfile: (req: Request, res: Response) => Promise<void>;
/**
 * Update user profile
 */
export declare const updateUserProfile: (req: Request, res: Response) => Promise<void>;
/**
 * Request to join a coach
 */
export declare const requestCoach: (req: Request, res: Response) => Promise<void>;
/**
 * Remove coach assignment
 */
export declare const removeCoach: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=userController.d.ts.map