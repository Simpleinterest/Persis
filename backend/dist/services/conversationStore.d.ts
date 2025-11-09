import { XAIMessage } from './xaiService';
/**
 * Get conversation history for a user
 */
export declare const getConversationHistory: (userId: string) => XAIMessage[];
/**
 * Add message to conversation history
 */
export declare const addToConversationHistory: (userId: string, message: XAIMessage) => void;
/**
 * Clear conversation history for a user
 */
export declare const clearConversationHistory: (userId: string) => void;
/**
 * Get video analysis history
 */
export declare const getVideoAnalysisHistory: (userId: string) => string[];
/**
 * Add correction to video analysis history
 */
export declare const addToVideoAnalysisHistory: (userId: string, correction: string) => void;
/**
 * Clear video analysis history
 */
export declare const clearVideoAnalysisHistory: (userId: string) => void;
//# sourceMappingURL=conversationStore.d.ts.map