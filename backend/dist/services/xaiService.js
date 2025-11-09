"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xaiService = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const XAI_API_KEY = process.env.XAI_API_KEY || '';
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
if (!XAI_API_KEY) {
    console.warn('⚠️  XAI_API_KEY not found in environment variables');
}
class XAIService {
    constructor() {
        this.apiKey = XAI_API_KEY;
        this.apiUrl = XAI_API_URL;
        this.axiosInstance = axios_1.default.create({
            baseURL: this.apiUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            timeout: 60000,
        });
    }
    async chatCompletion(request) {
        try {
            if (!this.apiKey) {
                throw new Error('XAI API key is not configured');
            }
            const payload = {
                model: request.model || 'grok-3',
                messages: request.messages,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.max_tokens ?? 1000,
                stream: request.stream ?? false,
            };
            const response = await this.axiosInstance.post('', payload);
            return response.data;
        }
        catch (error) {
            console.error('XAI API Error:', error.response?.data || error.message);
            throw new Error(`XAI API request failed: ${error.response?.data?.error?.message || error.message}`);
        }
    }
    async *streamChatCompletion(request) {
        try {
            if (!this.apiKey) {
                throw new Error('XAI API key is not configured');
            }
            const payload = {
                model: request.model || 'grok-3',
                messages: request.messages,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.max_tokens ?? 1000,
                stream: true,
            };
            const response = await this.axiosInstance.post('', payload, {
                responseType: 'stream',
            });
            for await (const chunk of response.data) {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.choices?.[0]?.delta?.content) {
                                yield parsed.choices[0].delta.content;
                            }
                        }
                        catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('XAI Stream Error:', error.response?.data || error.message);
            throw new Error(`XAI stream request failed: ${error.message}`);
        }
    }
    async analyzeVideo(description, context, aiContext) {
        try {
            // Build system prompt with stateful behavior guidelines
            let systemPrompt = `You are Persis, a professional AI fitness coach specializing in real-time form analysis. Your feedback is technical, specific, and actionable.`;
            // Use the system prompt from AI context if available (it includes state tracking info)
            if (aiContext && aiContext.systemPrompt) {
                systemPrompt = aiContext.systemPrompt;
            }
            else {
                systemPrompt += `\n\nCRITICAL VIDEO ANALYSIS GUIDELINES:
- Provide SPECIFIC, TECHNICAL feedback based on pose landmarks and body position
- Focus on FORM CORRECTIONS: alignment, posture, joint angles, movement patterns
- Be ACTIONABLE: Tell the user exactly what to change and how
- AVOID generic encouragement like "Good job!" or "Keep it up!"
- Instead of "Good form!", say "Your back is straight and knees are aligned with toes - excellent"
- Instead of "Try harder!", say "Your left shoulder is dropping 3 inches. Engage your core and pull it level with your right shoulder"
- Only provide feedback when there's a SIGNIFICANT observation or correction needed
- Keep feedback to 1-2 sentences maximum (20-50 words)
- Use anatomical terms: "knees", "hips", "spine", "shoulders", "elbows"
- Focus on safety: point out potential injury risks immediately
- Be precise: "Your knee is caving inward 5 degrees" is better than "Watch your knee alignment"`;
            }
            const userPrompt = `Video Description: ${description}\n\nContext: ${context}\n\nAnalyze the workout form and provide SPECIFIC, TECHNICAL feedback. Focus on actionable corrections based on what you observe in the pose data. Only provide feedback if there's a significant form issue, state change, or safety concern.`;
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ];
            const response = await this.chatCompletion({
                messages,
                model: 'grok-3',
                temperature: 0.6, // Lower temperature for more consistent, technical responses
                max_tokens: 100, // Very short for live feedback
            });
            return response.choices[0]?.message?.content || 'Unable to analyze video at this time.';
        }
        catch (error) {
            console.error('Video analysis error:', error);
            throw error;
        }
    }
}
exports.xaiService = new XAIService();
exports.default = exports.xaiService;
//# sourceMappingURL=xaiService.js.map