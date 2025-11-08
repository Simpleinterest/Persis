import axios from 'axios';
import dotenv from 'dotenv';
import Coach from '../models/Coach';
import User from '../models/User';

dotenv.config();

const XAI_API_KEY = process.env.XAI_API_KEY || 'xai-WoNFXR8GXe1L4MfvIFLXkb2U36e5zWSBiewmOcQ5ACf4mzxyYmnaRxzPz6CGeIa8cKfHlkYlgiCYVB4v';
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_MODEL = 'grok-4-latest';

export interface XAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface XAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Get AI parameters for a user from their coach
 */
export const getAIParametersForUser = async (userId: string): Promise<string> => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.coachId) {
      return '';
    }

    const coach = await Coach.findById(user.coachId);
    if (!coach || !coach.aiParameters) {
      return '';
    }

    return coach.aiParameters[userId] || '';
  } catch (error) {
    console.error('Error getting AI parameters:', error);
    return '';
  }
};

/**
 * Build system prompt for AI coach
 */
export const buildSystemPrompt = async (userId: string): Promise<string> => {
  try {
    const user = await User.findById(userId);
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
    const coachParameters = await getAIParametersForUser(userId);
    if (coachParameters) {
      systemPrompt += `\n\nCoach Instructions:\n${coachParameters}`;
    }

    systemPrompt += `\n\nAlways provide helpful, accurate, and motivating advice. Be concise but thorough. Focus on safety and proper form.`;

    return systemPrompt;
  } catch (error) {
    console.error('Error building system prompt:', error);
    return 'You are an AI fitness coach. Help users with their fitness goals, form corrections, and training advice.';
  }
};

/**
 * Call XAI API for chat completion
 */
export const callXAI = async (
  messages: XAIMessage[],
  temperature: number = 0.7,
  stream: boolean = false
): Promise<string> => {
  try {
    const response = await axios.post<XAIResponse>(
      XAI_API_URL,
      {
        messages,
        model: XAI_MODEL,
        stream,
        temperature,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XAI_API_KEY}`,
        },
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    }

    throw new Error('No response from XAI API');
  } catch (error: any) {
    console.error('XAI API Error:', error.response?.data || error.message);
    throw new Error(`XAI API Error: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Get AI chat response for user
 */
export const getAIChatResponse = async (
  userId: string,
  userMessage: string,
  conversationHistory: XAIMessage[] = []
): Promise<string> => {
  try {
    // Build system prompt
    const systemPrompt = await buildSystemPrompt(userId);

    // Construct messages array
    const messages: XAIMessage[] = [
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

    // Call XAI API
    const response = await callXAI(messages, 0.7, false);

    return response;
  } catch (error: any) {
    console.error('Error getting AI chat response:', error);
    throw error;
  }
};

/**
 * Analyze video for form correction
 */
export const analyzeVideoForm = async (
  userId: string,
  videoDescription: string,
  exercise: string
): Promise<string> => {
  try {
    const systemPrompt = await buildSystemPrompt(userId);

    const analysisPrompt = `Analyze the following exercise form for ${exercise}. 
    
Video Description: ${videoDescription}

Provide:
1. Form assessment (good points and areas for improvement)
2. Specific corrections needed
3. Safety concerns if any
4. Tips for improvement

Be concise and actionable.`;

    const messages: XAIMessage[] = [
      {
        role: 'system',
        content: systemPrompt + '\n\nYou are an expert in exercise form analysis and biomechanics.',
      },
      {
        role: 'user',
        content: analysisPrompt,
      },
    ];

    const response = await callXAI(messages, 0.5, false);

    return response;
  } catch (error: any) {
    console.error('Error analyzing video form:', error);
    throw error;
  }
};

/**
 * Analyze live video frame for real-time form correction
 */
export const analyzeLiveVideoFrame = async (
  userId: string,
  frameDescription: string,
  exercise: string,
  previousCorrections: string[] = []
): Promise<{ correction: string; severity: 'info' | 'warning' | 'error' }> => {
  try {
    const systemPrompt = await buildSystemPrompt(userId);

    let prompt = `Analyze the current exercise form for ${exercise} based on this frame description: ${frameDescription}`;

    if (previousCorrections.length > 0) {
      prompt += `\n\nPrevious corrections given:\n${previousCorrections.join('\n')}`;
    }

    prompt += `\n\nProvide a brief, real-time correction if needed. Format: [SEVERITY: info/warning/error] [CORRECTION TEXT]`;

    const messages: XAIMessage[] = [
      {
        role: 'system',
        content: systemPrompt + '\n\nYou are providing real-time form corrections during a live workout.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await callXAI(messages, 0.3, false);

    // Parse response for severity and correction
    const severityMatch = response.match(/\[SEVERITY:\s*(info|warning|error)\]/i);
    const severity = severityMatch
      ? (severityMatch[1].toLowerCase() as 'info' | 'warning' | 'error')
      : 'info';

    const correction = response.replace(/\[SEVERITY:\s*(info|warning|error)\]/i, '').trim();

    return {
      correction,
      severity,
    };
  } catch (error: any) {
    console.error('Error analyzing live video frame:', error);
    // Return a safe default response
    return {
      correction: 'Keep focusing on proper form. Continue your workout.',
      severity: 'info',
    };
  }
};

/**
 * Get exercise-specific advice
 */
export const getExerciseAdvice = async (
  userId: string,
  exercise: string,
  question: string
): Promise<string> => {
  try {
    const systemPrompt = await buildSystemPrompt(userId);

    const messages: XAIMessage[] = [
      {
        role: 'system',
        content: systemPrompt + `\n\nYou are an expert in ${exercise} technique and programming.`,
      },
      {
        role: 'user',
        content: `Exercise: ${exercise}\n\nQuestion: ${question}`,
      },
    ];

    const response = await callXAI(messages, 0.7, false);

    return response;
  } catch (error: any) {
    console.error('Error getting exercise advice:', error);
    throw error;
  }
};

