import { AIChatRequest, AIChatResponse, AIChatContext, VideoAnalysisRequest, VideoAnalysisResponse, XAIChatMessage } from '../types/ai.types';
import xaiService from './xaiService';
import User from '../models/User';
import Coach from '../models/Coach';
import { getOrCreateRoom, generateRoomId } from './socketService';
import { detectStateFromPose, updateUserState, shouldProvideFeedback, recordFeedback, getStateContext } from './stateTrackingService';

/**
 * AI Service
 * Handles AI coaching logic, context building, and response generation
 */
class AIService {
  /**
   * Build system prompt with user context and coach parameters
   */
  private buildSystemPrompt(context: AIChatContext, isVideoAnalysis: boolean = false): string {
    let prompt = `You are Persis, a professional AI fitness coach. You provide technical, actionable feedback based on exercise form and technique.`;

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

    if (isVideoAnalysis) {
      prompt += `\n\nCRITICAL VIDEO ANALYSIS GUIDELINES:
- Provide SPECIFIC, TECHNICAL feedback based on what you observe in the pose/landmarks
- Focus on FORM CORRECTIONS: alignment, posture, joint angles, movement patterns
- Be ACTIONABLE: Tell the user exactly what to change and how
- AVOID generic encouragement like "Good job!" or "Keep it up!"
- Instead of "Good form!", say "Your back is straight and knees are aligned with toes - excellent"
- Instead of "Try harder!", say "Your left shoulder is dropping 3 inches. Engage your core and pull it level with your right shoulder"
- Only provide feedback when there's a SIGNIFICANT observation or correction needed
- Keep feedback to 1-2 sentences maximum (20-50 words)
- Use anatomical terms when helpful: "knees", "hips", "spine", "shoulders", "elbows"
- Focus on safety: point out potential injury risks immediately
- Be precise: "Your knee is caving inward 5 degrees" is better than "Watch your knee alignment"`;

      // Add state context if available
      if (context.stateContext) {
        prompt += `\n\nCurrent Exercise State:\n${context.stateContext}`;
        prompt += `\n\nIMPORTANT: Only provide feedback if:
1. The user's state has changed to a new phase (e.g., started a new repetition)
2. You detect a NEW, significant form issue that hasn't been addressed
3. There's a safety concern that needs immediate attention
DO NOT repeat the same feedback you gave before.`;
      }
    } else {
      prompt += `\n\nCRITICAL: Keep responses SHORT and CONVERSATIONAL:
- 2-4 sentences maximum (50-150 words)
- Write like a knowledgeable but friendly coach
- Get straight to the point, no fluff
- Be friendly, encouraging, but TECHNICAL when discussing form
- Use simple language, but include specific anatomical references when helpful
- Be direct with actionable advice

Guidelines:
- Focus on safety and proper form
- Provide specific, technical corrections when discussing exercises
- Be motivating but realistic
- For medical questions, suggest consulting a healthcare professional
- Use the user's name occasionally (not every message)
- Keep it simple and easy to understand, but include actionable details`;
    }

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
        temperature: 0.7, // Balanced for conversational but technical tone
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
        temperature: 0.7, // Balanced for conversational but technical tone
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
  async analyzeVideo(request: VideoAnalysisRequest): Promise<VideoAnalysisResponse | null> {
    try {
      // Get user context
      const context = request.context || await this.getUserContext(request.userId);

      // Extract pose data from videoData if available
      let landmarks: any[] = [];
      let poseDescription = '';
      
      if (request.videoData && typeof request.videoData === 'object') {
        const videoData = request.videoData as any;
        if (videoData.landmarks && Array.isArray(videoData.landmarks)) {
          landmarks = videoData.landmarks;
        }
        if (videoData.poseDescription && typeof videoData.poseDescription === 'string') {
          poseDescription = videoData.poseDescription;
        }
      }

      // Detect current state from pose
      const detectedState = detectStateFromPose(landmarks, poseDescription);
      const stateChanged = updateUserState(request.userId, detectedState);

      // Get state context for AI
      const stateContext = getStateContext(request.userId);
      context.stateContext = stateContext;

      // Build context string for AI analysis
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
      contextString += `\n\n${stateContext}`;

      // Build video description from pose data
      let videoDescription = '';
      if (poseDescription) {
        videoDescription = `Pose Description: ${poseDescription}`;
      }
      if (landmarks.length > 0) {
        videoDescription += `\nDetected ${landmarks.length} body landmarks`;
        // Add key landmark positions for analysis
        if (landmarks[11] && landmarks[12]) {
          videoDescription += `\nShoulders detected`;
        }
        if (landmarks[23] && landmarks[24]) {
          videoDescription += `\nHips detected`;
        }
        if (landmarks[25] && landmarks[26]) {
          videoDescription += `\nKnees detected`;
        }
      } else {
        videoDescription = 'Pose landmarks not detected - user may be out of frame or pose incomplete';
      }

      // Build system prompt for video analysis
      const systemPrompt = this.buildSystemPrompt(context, true);

      // Analyze using XAI with stateful context
      const analysisText = await xaiService.analyzeVideo(videoDescription, contextString, { systemPrompt });

      // Check if we should provide this feedback (avoid spam)
      if (!shouldProvideFeedback(request.userId, analysisText)) {
        // Don't provide feedback - it's too soon or duplicate
        return null;
      }

      // Record the feedback
      recordFeedback(request.userId, analysisText);

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

