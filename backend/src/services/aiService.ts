import { AIChatRequest, AIChatResponse, AIChatContext, VideoAnalysisRequest, VideoAnalysisResponse, XAIChatMessage } from '../types/ai.types';
import xaiService from './xaiService';
import User from '../models/User';
import Coach from '../models/Coach';
import { getOrCreateRoom, generateRoomId } from './socketService';

/**
 * AI Service
 * Handles AI coaching logic, context building, and response generation
 */
class AIService {
  /**
   * Build system prompt with user context and coach parameters
   */
  private buildSystemPrompt(context: AIChatContext): string {
    let prompt = `You are Persis, a friendly and conversational AI fitness coach. You chat like a supportive friend who knows fitness, not a formal trainer.`;

    // Add user profile context
    if (context.userProfile) {
      const profile = context.userProfile;
      prompt += `\n\nUser Profile:`;
      if (context.userName) prompt += `\n- Name: ${context.userName}`;
      if (profile.age) prompt += `\n- Age: ${profile.age}`;
      if (profile.weight) prompt += `\n- Weight: ${profile.weight} lbs`;
      if (profile.height) prompt += `\n- Height: ${profile.height} inches`;
      if (profile.gender) prompt += `\n- Gender: ${profile.gender}`;
      if (profile.sports && profile.sports.length > 0) {
        prompt += `\n- Sports/Activities: ${profile.sports.join(', ')}`;
      }
      if (profile.goals) prompt += `\n- Goals: ${profile.goals}`;
    }

    // Add coach parameters if available
    if (context.coachParameters) {
      prompt += `\n\nCoach Instructions:\n${context.coachParameters}`;
    }

    prompt += `\n\nCRITICAL: Keep responses SHORT and CONVERSATIONAL:
- 2-4 sentences maximum (50-150 words)
- Write like you're texting a friend
- Get straight to the point, no fluff
- Be friendly, casual, and encouraging
- Use simple language, avoid jargon
- Be direct with actionable advice

Guidelines:
- Focus on safety and proper form
- Be motivating but realistic
- For medical questions, suggest consulting a healthcare professional
- Use the user's name occasionally (not every message)
- Keep it simple and easy to understand`;

    return prompt;
  }

  /**
   * Get user context from database
   */
  async getUserContext(userId: string, coachId?: string): Promise<AIChatContext> {
    const user = await User.findById(userId).select('-passWord');
    if (!user) {
      throw new Error('User not found');
    }

    let coachParameters: string | undefined;
    if (coachId) {
      const coach = await Coach.findById(coachId);
      if (coach && coach.aiParameters) {
        coachParameters = coach.aiParameters[userId] as string;
      }
    }

    const context: AIChatContext = {
      userId: user._id.toString(),
      userName: user.userName,
      userProfile: {
        age: user.age,
        weight: user.bodyWeight,
        height: user.height,
        gender: user.gender,
        sports: user.sports,
        goals: user.profile?.bio,
      },
      coachParameters,
    };

    return context;
  }

  /**
   * Process AI chat message
   */
  async processChatMessage(request: AIChatRequest): Promise<AIChatResponse> {
    try {
      // Get user context
      const context = request.context || await this.getUserContext(request.userId || '');

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(context);

      // Build conversation messages
      const messages: XAIChatMessage[] = [
        { role: 'system', content: systemPrompt },
      ];

      // Add conversation history if available
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        // Keep last 10 messages for context (to avoid token limits)
        const recentHistory = context.conversationHistory.slice(-10);
        messages.push(...recentHistory);
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: request.message,
      });

      // Get AI response
      const response = await xaiService.chatCompletion({
        messages,
        model: 'grok-3',
        temperature: 0.8, // Higher for more conversational tone
        max_tokens: 200, // Reduced to enforce conciseness
      });

      const aiMessage = response.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your message.';

      return {
        message: aiMessage,
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('AI chat processing error:', error);
      throw new Error(`Failed to process AI chat: ${error.message}`);
    }
  }

  /**
   * Stream AI chat response (for real-time responses)
   */
  async *streamChatMessage(request: AIChatRequest): AsyncGenerator<string, void, unknown> {
    try {
      // Get user context
      const context = request.context || await this.getUserContext(request.userId || '');

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(context);

      // Build conversation messages
      const messages: XAIChatMessage[] = [
        { role: 'system', content: systemPrompt },
      ];

      // Add conversation history if available
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        const recentHistory = context.conversationHistory.slice(-10);
        messages.push(...recentHistory);
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: request.message,
      });

      // Stream AI response
      yield* xaiService.streamChatCompletion({
        messages,
        model: 'grok-3',
        temperature: 0.8, // Slightly higher for more conversational tone
        max_tokens: 200, // Reduced from 1000 to enforce conciseness
      });
    } catch (error: any) {
      console.error('AI stream processing error:', error);
      throw new Error(`Failed to stream AI chat: ${error.message}`);
    }
  }

  /**
   * Analyze video for form and technique
   */
  async analyzeVideo(request: VideoAnalysisRequest): Promise<VideoAnalysisResponse> {
    try {
      // Get user context
      const context = request.context || await this.getUserContext(request.userId);

      // Build context string
      let contextString = `Analyzing workout video for ${context.userName}`;
      if (context.userProfile) {
        const profile = context.userProfile;
        if (profile.age) contextString += `, age ${profile.age}`;
        if (profile.sports && profile.sports.length > 0) {
          contextString += `, sports: ${profile.sports.join(', ')}`;
        }
      }
      if (request.exerciseType) {
        contextString += `, exercise: ${request.exerciseType}`;
      }
      if (context.coachParameters) {
        contextString += `\nCoach notes: ${context.coachParameters}`;
      }

      // For now, we'll use a text description approach
      // In a full implementation, you would:
      // 1. Extract frames from video
      // 2. Use computer vision to analyze form
      // 3. Generate description
      // 4. Send to AI for analysis

      // Simulated video description (replace with actual CV processing)
      const videoDescription = request.videoData instanceof Buffer
        ? 'Video frame data received for analysis'
        : 'Video analysis requested';

      // Analyze using XAI
      const analysisText = await xaiService.analyzeVideo(videoDescription, contextString);

      // Parse analysis into structured response
      const analysis = this.parseVideoAnalysis(analysisText, request.analysisType);

      return {
        analysis,
        type: request.analysisType,
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('Video analysis error:', error);
      throw new Error(`Failed to analyze video: ${error.message}`);
    }
  }

  /**
   * Parse AI analysis text into structured format
   */
  private parseVideoAnalysis(analysisText: string, analysisType: string): VideoAnalysisResponse['analysis'] {
    // Simple parsing - in production, you might use more sophisticated NLP
    const analysis: VideoAnalysisResponse['analysis'] = {
      formFeedback: analysisText,
      score: 75, // Default score, would be calculated from CV analysis
    };

    // Extract tips and recommendations (simple pattern matching)
    const tipsMatch = analysisText.match(/(?:tip|recommendation|suggestion):\s*(.+?)(?:\.|$)/gi);
    if (tipsMatch && tipsMatch.length > 0) {
      analysis.techniqueTips = tipsMatch.slice(0, 5).map(tip => tip.replace(/^(?:tip|recommendation|suggestion):\s*/i, '').trim());
    }

    // Extract recommendations
    const recMatch = analysisText.match(/(?:recommend|suggest|consider):\s*(.+?)(?:\.|$)/gi);
    if (recMatch && recMatch.length > 0) {
      analysis.recommendations = recMatch.slice(0, 3).map(rec => rec.replace(/^(?:recommend|suggest|consider):\s*/i, '').trim());
    }

    return analysis;
  }

  /**
   * Get AI room ID for user
   */
  getAIRoomId(userId: string): string {
    // Generate room ID for user-ai chat
    const sortedIds = [userId, 'ai-coach'].sort();
    return `user-ai:${sortedIds.join(':')}`;
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;

