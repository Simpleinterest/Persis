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
 * Get pending coach requests for the user
 */
export declare const getCoachRequests: (req: Request, res: Response) => Promise<void>;
/**
 * Accept a coach request
 */
export declare const acceptCoachRequest: (req: Request, res: Response) => Promise<void>;
/**
 * Reject a coach request
 */
export declare const rejectCoachRequest: (req: Request, res: Response) => Promise<void>;
/**
 * Request to join a coach (legacy - kept for backward compatibility)
 */
export declare const requestCoach: (req: Request, res: Response) => Promise<void>;
/**
 * Remove coach assignment
 */
export declare const removeCoach: (req: Request, res: Response) => Promise<void>;
/**
 * Upload video for AI analysis (with multer middleware)
 */
export declare const uploadVideo: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>[];
/**
 * Update video permission for coach viewing
 */
export declare const updateVideoPermission: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=userController.d.ts.map