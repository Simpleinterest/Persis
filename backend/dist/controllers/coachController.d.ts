import { Request, Response } from 'express';
/**
 * Get coach profile
 */
export declare const getCoachProfile: (req: Request, res: Response) => Promise<void>;
/**
 * Get all students for the coach
 */
export declare const getStudents: (req: Request, res: Response) => Promise<void>;
/**
 * Get a specific student's details
 */
export declare const getStudent: (req: Request, res: Response) => Promise<void>;
/**
 * Request to add a student by username
 */
export declare const requestStudentByUsername: (req: Request, res: Response) => Promise<void>;
/**
 * Add a student to coach's list (after request is accepted)
 */
export declare const addStudent: (req: Request, res: Response) => Promise<void>;
/**
 * Remove a student from coach's list
 */
export declare const removeStudent: (req: Request, res: Response) => Promise<void>;
/**
 * Get coach's sports
 */
export declare const getSports: (req: Request, res: Response) => Promise<void>;
/**
 * Add sports to coach's specialization
 */
export declare const addSports: (req: Request, res: Response) => Promise<void>;
/**
 * Remove a sport from coach's specialization
 */
export declare const removeSport: (req: Request, res: Response) => Promise<void>;
/**
 * Update coach profile
 */
export declare const updateCoachProfile: (req: Request, res: Response) => Promise<void>;
/**
 * Update AI parameters for a specific student
 */
export declare const updateStudentAIParameters: (req: Request, res: Response) => Promise<void>;
/**
 * Get AI parameters for a specific student
 */
export declare const getStudentAIParameters: (req: Request, res: Response) => Promise<void>;
/**
 * Get video analyses for a specific student (live footage summaries)
 */
export declare const getStudentVideoAnalyses: (req: Request, res: Response) => Promise<void>;
/**
 * Get uploaded videos for a specific student (with permission)
 */
export declare const getStudentVideos: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=coachController.d.ts.map