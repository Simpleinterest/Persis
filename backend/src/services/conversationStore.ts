import { XAIMessage } from './xaiService';

// Store conversation history for AI chat
const aiConversationHistory = new Map<string, XAIMessage[]>();
// Store video analysis history
const videoAnalysisHistory = new Map<string, string[]>();

/**
 * Get conversation history for a user
 */
export const getConversationHistory = (userId: string): XAIMessage[] => {
  return aiConversationHistory.get(userId) || [];
};

/**
 * Add message to conversation history
 */
export const addToConversationHistory = (userId: string, message: XAIMessage): void => {
  if (!aiConversationHistory.has(userId)) {
    aiConversationHistory.set(userId, []);
  }

  const history = aiConversationHistory.get(userId)!;
  history.push(message);

  // Keep only last 20 messages to avoid token limits
  if (history.length > 20) {
    history.shift();
  }
};

/**
 * Clear conversation history for a user
 */
export const clearConversationHistory = (userId: string): void => {
  aiConversationHistory.delete(userId);
};

/**
 * Get video analysis history
 */
export const getVideoAnalysisHistory = (userId: string): string[] => {
  return videoAnalysisHistory.get(userId) || [];
};

/**
 * Add correction to video analysis history
 */
export const addToVideoAnalysisHistory = (userId: string, correction: string): void => {
  if (!videoAnalysisHistory.has(userId)) {
    videoAnalysisHistory.set(userId, []);
  }

  const history = videoAnalysisHistory.get(userId)!;
  history.push(correction);

  // Keep only last 10 corrections
  if (history.length > 10) {
    history.shift();
  }
};

/**
 * Clear video analysis history
 */
export const clearVideoAnalysisHistory = (userId: string): void => {
  videoAnalysisHistory.delete(userId);
};

