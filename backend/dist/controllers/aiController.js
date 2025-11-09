"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdvice = exports.analyzeVideo = void 0;
const xaiService_1 = require("../services/xaiService");
const User_1 = __importDefault(require("../models/User"));
/**
 * Analyze uploaded video for form correction
 */
const analyzeVideo = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { videoDescription, exercise } = req.body;
        if (!videoDescription || !exercise) {
            res.status(400).json({ error: 'Video description and exercise are required' });
            return;
        }
        // Verify user exists
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Analyze video with XAI
        const analysis = await (0, xaiService_1.analyzeVideoForm)(userId, videoDescription, exercise);
        res.json({
            success: true,
            analysis: analysis,
            exercise: exercise,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error analyzing video:', error);
        res.status(500).json({ error: 'Failed to analyze video. Please try again.' });
    }
};
exports.analyzeVideo = analyzeVideo;
/**
 * Get exercise advice from AI
 */
const getAdvice = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { exercise, question } = req.body;
        if (!exercise || !question) {
            res.status(400).json({ error: 'Exercise and question are required' });
            return;
        }
        // Verify user exists
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Get advice from XAI
        const advice = await (0, xaiService_1.getExerciseAdvice)(userId, exercise, question);
        res.json({
            success: true,
            advice: advice,
            exercise: exercise,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error getting advice:', error);
        res.status(500).json({ error: 'Failed to get advice. Please try again.' });
    }
};
exports.getAdvice = getAdvice;
//# sourceMappingURL=aiController.js.map