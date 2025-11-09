export interface XAIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
/**
 * Get AI parameters for a user from their coach
 */
export declare const getAIParametersForUser: (userId: string) => Promise<string>;
/**
 * Build system prompt for AI coach
 */
export declare const buildSystemPrompt: (userId: string) => Promise<string>;
/**
 * Call XAI API for chat completion
 */
export declare const callXAI: (messages: XAIMessage[], temperature?: number, stream?: boolean) => Promise<string>;
/**
 * Get AI chat response for user
 */
export declare const getAIChatResponse: (userId: string, userMessage: string, conversationHistory?: XAIMessage[]) => Promise<string>;
/**
 * Analyze video for form correction
 */
export declare const analyzeVideoForm: (userId: string, videoDescription: string, exercise: string) => Promise<string>;
/**
 * Analyze live video frame for real-time form correction
 */
export declare const analyzeLiveVideoFrame: (userId: string, frameDescription: string, exercise: string, previousCorrections?: string[]) => Promise<{
    correction: string;
    severity: "info" | "warning" | "error";
}>;
/**
 * Get exercise-specific advice
 */
export declare const getExerciseAdvice: (userId: string, exercise: string, question: string) => Promise<string>;
//# sourceMappingURL=xaiService.d.ts.map