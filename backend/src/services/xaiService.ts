import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import { XAIChatRequest, XAIChatResponse, XAIChatMessage } from '../types/ai.types';

dotenv.config();

const XAI_API_KEY = process.env.XAI_API_KEY || '';
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

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
        model: request.model || 'grok-3',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 1000,
        stream: request.stream ?? false,
      };

      const response = await this.axiosInstance.post<XAIChatResponse>('', payload);
      return response.data;
    } catch (error: any) {
      console.error('XAI API Error:', error.response?.data || error.message);
      throw new Error(`XAI API request failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async *streamChatCompletion(request: XAIChatRequest): AsyncGenerator<string, void, unknown> {
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
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.error('XAI Stream Error:', error.response?.data || error.message);
      throw new Error(`XAI stream request failed: ${error.message}`);
    }
  }

  async analyzeVideo(description: string, context: string): Promise<string> {
    try {
      const systemPrompt = `You are Persis, a friendly fitness coach. Provide concise, conversational feedback on workout form and technique. Keep responses to 3-5 sentences maximum. Be direct, encouraging, and actionable.`;

      const userPrompt = `Video Description: ${description}\n\nContext: ${context}\n\nProvide a concise analysis of the workout form, technique, and recommendations for improvement. Keep it brief and conversational.`;

      const messages: XAIChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await this.chatCompletion({
        messages,
        model: 'grok-3',
        temperature: 0.7,
        max_tokens: 300, // Reduced for more concise video analysis
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

