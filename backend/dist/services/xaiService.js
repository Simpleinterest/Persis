"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExerciseAdvice = exports.analyzeLiveVideoFrame = exports.analyzeVideoForm = exports.getAIChatResponse = exports.callXAI = exports.buildSystemPrompt = exports.getAIParametersForUser = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const Coach_1 = __importDefault(require("../models/Coach"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1/chat/completions';
const XAI_MODEL = process.env.XAI_MODEL || 'grok-3';
// Validate API key
if (!XAI_API_KEY) {
    console.warn('⚠️  WARNING: XAI_API_KEY is not set in environment variables. AI features will not work.');
    console.warn('   Please set XAI_API_KEY in your .env file.');
}
/**
 * Get AI parameters for a user from their coach
 */
const getAIParametersForUser = async (userId) => {
    try {
        const user = await User_1.default.findById(userId);
        if (!user || !user.coachId) {
            return '';
        }
        const coach = await Coach_1.default.findById(user.coachId);
        if (!coach || !coach.aiParameters) {
            return '';
        }
        return coach.aiParameters[userId] || '';
    }
    catch (error) {
        console.error('Error getting AI parameters:', error);
        return '';
    }
};
exports.getAIParametersForUser = getAIParametersForUser;
/**
 * Build system prompt for AI coach
 */
const buildSystemPrompt = async (userId) => {
    try {
        const user = await User_1.default.findById(userId);
        if (!user) {
            return 'You are an AI fitness coach. Help users with their fitness goals, form corrections, and training advice.';
        }
        let systemPrompt = `You are an AI fitness coach for Persis, an AI-powered fitness coaching platform. Your role is to help users with:
- Form corrections and technique improvements
- Workout planning and programming
- Nutrition advice
- Progress tracking and motivation
- Injury prevention and recovery

User Profile:
- Name: ${user.profile?.fullName || user.userName}
- Age: ${user.age || 'Not specified'}
- Weight: ${user.bodyWeight || 'Not specified'} lbs
- Height: ${user.height || 'Not specified'} inches
- Gender: ${user.gender || 'Not specified'}
- Sports: ${user.sports.join(', ') || 'Not specified'}
- Goal: ${user.profile?.bio || 'Not specified'}`;
        // Add coach parameters if available
        const coachParameters = await (0, exports.getAIParametersForUser)(userId);
        if (coachParameters) {
            systemPrompt += `\n\nCoach Instructions:\n${coachParameters}`;
        }
        systemPrompt += `\n\nAlways provide helpful, accurate, and motivating advice. Be concise but thorough. Focus on safety and proper form.`;
        return systemPrompt;
    }
    catch (error) {
        console.error('Error building system prompt:', error);
        return 'You are an AI fitness coach. Help users with their fitness goals, form corrections, and training advice.';
    }
};
exports.buildSystemPrompt = buildSystemPrompt;
/**
 * Call XAI API for chat completion
 */
const callXAI = async (messages, temperature = 0.7, stream = false) => {
    // Check if API key is configured
    if (!XAI_API_KEY) {
        const errorMsg = 'XAI API key is not configured. Please set XAI_API_KEY in your .env file.';
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
    }
    try {
        console.log(`📡 Calling XAI API with model: ${XAI_MODEL}`);
        console.log(`📝 Messages: ${messages.length} message(s)`);
        const response = await axios_1.default.post(XAI_API_URL, {
            messages,
            model: XAI_MODEL,
            stream,
            temperature,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${XAI_API_KEY}`,
            },
            timeout: 30000, // 30 second timeout
        });
        if (response.data.choices && response.data.choices.length > 0) {
            const content = response.data.choices[0].message.content;
            console.log('✅ XAI API response received');
            return content;
        }
        throw new Error('No response from XAI API - empty choices array');
    }
    catch (error) {
        // Detailed error logging
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('❌ XAI API Error Response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers,
            });
            const errorMessage = error.response.data?.error?.message ||
                error.response.data?.message ||
                `HTTP ${error.response.status}: ${error.response.statusText}`;
            throw new Error(`XAI API Error: ${errorMessage}`);
        }
        else if (error.request) {
            // The request was made but no response was received
            console.error('❌ XAI API No Response:', {
                message: error.message,
                code: error.code,
            });
            throw new Error(`XAI API Error: No response from server. Please check your internet connection and API endpoint: ${XAI_API_URL}`);
        }
        else {
            // Something happened in setting up the request that triggered an Error
            console.error('❌ XAI API Request Error:', error.message);
            throw new Error(`XAI API Error: ${error.message}`);
        }
    }
};
exports.callXAI = callXAI;
/**
 * Get AI chat response for user
 */
const getAIChatResponse = async (userId, userMessage, conversationHistory = []) => {
    try {
        // Validate API key before proceeding
        if (!XAI_API_KEY) {
            throw new Error('XAI API key is not configured. Please set XAI_API_KEY in your .env file.');
        }
        // Build system prompt
        const systemPrompt = await (0, exports.buildSystemPrompt)(userId);
        console.log(`📋 System prompt built for user ${userId}`);
        // Construct messages array
        const messages = [
            {
                role: 'system',
                content: systemPrompt,
            },
            ...conversationHistory,
            {
                role: 'user',
                content: userMessage,
            },
        ];
        console.log(`💬 Sending message to XAI: "${userMessage.substring(0, 50)}..."`);
        // Call XAI API
        const response = await (0, exports.callXAI)(messages, 0.7, false);
        console.log(`✅ Received response from XAI: "${response.substring(0, 50)}..."`);
        return response;
    }
    catch (error) {
        console.error('❌ Error getting AI chat response:', error);
        // Re-throw with more context
        if (error.message.includes('API key')) {
            throw new Error('XAI API key is not configured. Please set XAI_API_KEY in your .env file and restart the server.');
        }
        throw error;
    }
};
exports.getAIChatResponse = getAIChatResponse;
/**
 * Analyze video for form correction
 */
const analyzeVideoForm = async (userId, videoDescription, exercise) => {
    try {
        const systemPrompt = await (0, exports.buildSystemPrompt)(userId);
        const analysisPrompt = `Analyze the following exercise form for ${exercise}. 
    
Video Description: ${videoDescription}

Provide:
1. Form assessment (good points and areas for improvement)
2. Specific corrections needed
3. Safety concerns if any
4. Tips for improvement

Be concise and actionable.`;
        const messages = [
            {
                role: 'system',
                content: systemPrompt + '\n\nYou are an expert in exercise form analysis and biomechanics.',
            },
            {
                role: 'user',
                content: analysisPrompt,
            },
        ];
        const response = await (0, exports.callXAI)(messages, 0.5, false);
        return response;
    }
    catch (error) {
        console.error('Error analyzing video form:', error);
        throw error;
    }
};
exports.analyzeVideoForm = analyzeVideoForm;
/**
 * Analyze live video frame for real-time form correction
 */
const analyzeLiveVideoFrame = async (userId, frameDescription, exercise, previousCorrections = []) => {
    try {
        const systemPrompt = await (0, exports.buildSystemPrompt)(userId);
        let prompt = `Analyze the current exercise form for ${exercise} based on this frame description: ${frameDescription}`;
        if (previousCorrections.length > 0) {
            prompt += `\n\nPrevious corrections given:\n${previousCorrections.join('\n')}`;
        }
        prompt += `\n\nProvide a brief, real-time correction if needed. Format: [SEVERITY: info/warning/error] [CORRECTION TEXT]`;
        const messages = [
            {
                role: 'system',
                content: systemPrompt + '\n\nYou are providing real-time form corrections during a live workout.',
            },
            {
                role: 'user',
                content: prompt,
            },
        ];
        const response = await (0, exports.callXAI)(messages, 0.3, false);
        // Parse response for severity and correction
        const severityMatch = response.match(/\[SEVERITY:\s*(info|warning|error)\]/i);
        const severity = severityMatch
            ? severityMatch[1].toLowerCase()
            : 'info';
        const correction = response.replace(/\[SEVERITY:\s*(info|warning|error)\]/i, '').trim();
        return {
            correction,
            severity,
        };
    }
    catch (error) {
        console.error('Error analyzing live video frame:', error);
        // Return a safe default response
        return {
            correction: 'Keep focusing on proper form. Continue your workout.',
            severity: 'info',
        };
    }
};
exports.analyzeLiveVideoFrame = analyzeLiveVideoFrame;
/**
 * Get exercise-specific advice
 */
const getExerciseAdvice = async (userId, exercise, question) => {
    try {
        const systemPrompt = await (0, exports.buildSystemPrompt)(userId);
        const messages = [
            {
                role: 'system',
                content: systemPrompt + `\n\nYou are an expert in ${exercise} technique and programming.`,
            },
            {
                role: 'user',
                content: `Exercise: ${exercise}\n\nQuestion: ${question}`,
            },
        ];
        const response = await (0, exports.callXAI)(messages, 0.7, false);
        return response;
    }
    catch (error) {
        console.error('Error getting exercise advice:', error);
        throw error;
    }
};
exports.getExerciseAdvice = getExerciseAdvice;
//# sourceMappingURL=xaiService.js.map