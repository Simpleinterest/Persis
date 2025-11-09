import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import { XAIChatRequest, XAIChatResponse, XAIChatMessage } from '../types/ai.types';

dotenv.config();

const XAI_API_KEY = process.env.XAI_API_KEY || '';
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

// Validate API key format on startup
if (XAI_API_KEY && !XAI_API_KEY.startsWith('xai-')) {
  console.warn('⚠️  XAI_API_KEY format may be incorrect. Expected format: xai-...');
}

if (!XAI_API_KEY) {
  console.warn('⚠️  XAI_API_KEY not found in environment variables');
}

class XAIService {
  private apiKey: string;
  private apiUrl: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.apiKey = XAI_API_KEY;
    this.apiUrl = XAI_API_URL;
    
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      timeout: 60000,
    });
  }

  async chatCompletion(request: XAIChatRequest): Promise<XAIChatResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('XAI API key is not configured');
      }

      const payload = {
        model: request.model || 'grok-2',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 1000,
        stream: request.stream ?? false,
      };

      const response = await this.axiosInstance.post<XAIChatResponse>('', payload);
      return response.data;
    } catch (error: any) {
      // Enhanced error logging
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      };
      console.error('XAI API Error Details:', JSON.stringify(errorDetails, null, 2));
      
      // Try to extract more specific error message
      let errorMessage = error.message;
      if (error.response?.status === 403) {
        errorMessage = 'XAI API returned 403 Forbidden. This usually means: 1) API key is invalid or revoked, 2) API key lacks required permissions, or 3) The endpoint/model is not accessible with this key. Please check your API key in the XAI console.';
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error?.message) {
          errorMessage = error.response.data.error.message;
        }
      }
      
      throw new Error(`XAI API request failed: ${errorMessage}`);
    }
  }

  async *streamChatCompletion(request: XAIChatRequest): AsyncGenerator<string, void, unknown> {
    try {
      if (!this.apiKey) {
        throw new Error('XAI API key is not configured');
      }

      const payload = {
        model: request.model || 'grok-2',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 1000,
        stream: true,
      };

      console.log('XAI Stream Request:', {
        model: payload.model,
        messageCount: payload.messages.length,
        hasApiKey: !!this.apiKey,
      });

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
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      // Enhanced error logging
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        apiKeyPresent: !!this.apiKey,
        apiKeyLength: this.apiKey?.length || 0,
      };
      console.error('XAI Stream Error Details:', JSON.stringify(errorDetails, null, 2));
      
      // Try to extract more specific error message
      let errorMessage = error.message;
      if (error.response?.status === 403) {
        errorMessage = 'XAI API returned 403 Forbidden. This usually means: 1) API key is invalid or revoked, 2) API key lacks required permissions, or 3) The endpoint/model is not accessible with this key. Please check your API key in the XAI console.';
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error?.message) {
          errorMessage = error.response.data.error.message;
        }
      }
      
      throw new Error(`XAI stream request failed: ${errorMessage}`);
    }
  }

  async analyzeVideo(description: string, context: string, aiContext?: any): Promise<string> {
    try {
      // Build system prompt with stateful behavior guidelines
      let systemPrompt = `You are Persis, a professional AI fitness coach specializing in real-time form analysis. Your feedback is technical, specific, and actionable.`;

      // Use the system prompt from AI context if available (it includes state tracking info and sport-specific instructions)
      if (aiContext && aiContext.systemPrompt) {
        systemPrompt = aiContext.systemPrompt;
      } else {
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

      // Increase max_tokens if structured output is requested
      const requestStructuredOutput = aiContext?.requestStructuredOutput || false;
      const maxTokens = requestStructuredOutput ? 500 : 100; // More tokens for structured JSON + feedback

      const userPrompt = `Video Description: ${description}\n\nContext: ${context}\n\nAnalyze the workout form and provide SPECIFIC, TECHNICAL feedback. Focus on actionable corrections based on what you observe in the pose data. Only provide feedback if there's a significant form issue, state change, or safety concern.${requestStructuredOutput ? '\n\nIMPORTANT: Return a JSON object with structured metrics followed by your feedback text.' : ''}`;

      const messages: XAIChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await this.chatCompletion({
        messages,
        model: 'grok-2',
        temperature: 0.6, // Lower temperature for more consistent, technical responses
        max_tokens: maxTokens,
      });

      return response.choices[0]?.message?.content || 'Unable to analyze video at this time.';
    } catch (error: any) {
      console.error('Video analysis error:', error);
      throw error;
    }
  }
}

export const xaiService = new XAIService();
export default xaiService;

