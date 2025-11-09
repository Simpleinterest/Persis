export interface JWTPayload {
    id: string;
    userName: string;
    type: 'user' | 'coach';
}
/**
 * Generate JWT token with 1 month expiration
 */
export declare const generateToken: (payload: JWTPayload) => string;
/**
 * Verify JWT token
 */
export declare const verifyToken: (token: string) => JWTPayload;
/**
 * Extract token from Authorization header
 */
export declare const extractTokenFromHeader: (authHeader: string | undefined) => string | null;
//# sourceMappingURL=jwt.d.ts.map