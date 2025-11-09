"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearVideoAnalysisHistory = exports.addToVideoAnalysisHistory = exports.getVideoAnalysisHistory = exports.clearConversationHistory = exports.addToConversationHistory = exports.getConversationHistory = void 0;
// Store conversation history for AI chat
const aiConversationHistory = new Map();
// Store video analysis history
const videoAnalysisHistory = new Map();
/**
 * Get conversation history for a user
 */
const getConversationHistory = (userId) => {
    return aiConversationHistory.get(userId) || [];
};
exports.getConversationHistory = getConversationHistory;
/**
 * Add message to conversation history
 */
const addToConversationHistory = (userId, message) => {
    if (!aiConversationHistory.has(userId)) {
        aiConversationHistory.set(userId, []);
    }
    const history = aiConversationHistory.get(userId);
    history.push(message);
    // Keep only last 20 messages to avoid token limits
    if (history.length > 20) {
        history.shift();
    }
};
exports.addToConversationHistory = addToConversationHistory;
/**
 * Clear conversation history for a user
 */
const clearConversationHistory = (userId) => {
    aiConversationHistory.delete(userId);
};
exports.clearConversationHistory = clearConversationHistory;
/**
 * Get video analysis history
 */
const getVideoAnalysisHistory = (userId) => {
    return videoAnalysisHistory.get(userId) || [];
};
exports.getVideoAnalysisHistory = getVideoAnalysisHistory;
/**
 * Add correction to video analysis history
 */
const addToVideoAnalysisHistory = (userId, correction) => {
    if (!videoAnalysisHistory.has(userId)) {
        videoAnalysisHistory.set(userId, []);
    }
    const history = videoAnalysisHistory.get(userId);
    history.push(correction);
    // Keep only last 10 corrections
    if (history.length > 10) {
        history.shift();
    }
};
exports.addToVideoAnalysisHistory = addToVideoAnalysisHistory;
/**
 * Clear video analysis history
 */
const clearVideoAnalysisHistory = (userId) => {
    videoAnalysisHistory.delete(userId);
};
exports.clearVideoAnalysisHistory = clearVideoAnalysisHistory;
//# sourceMappingURL=conversationStore.js.map