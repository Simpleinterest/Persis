import { AIChatRequest, AIChatResponse, AIChatContext, VideoAnalysisRequest, VideoAnalysisResponse, XAIChatMessage } from '../types/ai.types';
import xaiService from './xaiService';
import User from '../models/User';
import Coach from '../models/Coach';
import { getOrCreateRoom, generateRoomId } from './socketService';
import { detectStateFromPose, updateUserState, shouldProvideFeedback, recordFeedback, getStateContext } from './stateTrackingService';
import { getSportMetrics, parseSportMetrics, TimestampedFeedback } from '../types/sport.types';

/**
 * AI Service
 * Handles AI coaching logic, context building, and response generation
 */
class AIService {
  /**
   * Build system prompt with user context and coach parameters
   */
  private buildSystemPrompt(context: AIChatContext, isVideoAnalysis: boolean = false, exerciseType?: string): string {
    let prompt = `You are Persis, a professional AI fitness coach. You provide technical, actionable feedback based on exercise form and technique.`;
    
    // Add sport-specific context
    if (exerciseType && exerciseType !== 'general') {
      const sportMetrics = getSportMetrics(exerciseType);
      prompt += `\n\nYou are analyzing a ${exerciseType} exercise. Key metrics to evaluate: ${sportMetrics.join(', ')}.`;
    }

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

      // Add sport-specific analysis instructions
      if (exerciseType && exerciseType !== 'general') {
        prompt += `\n\nFor ${exerciseType} analysis, focus on:`;
        const metrics = getSportMetrics(exerciseType);
        metrics.forEach(metric => {
          prompt += `\n- ${metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: Evaluate and provide specific feedback`;
        });
        
        // Request structured output
        prompt += `\n\nIMPORTANT: When providing feedback, also return a JSON object with structured metrics in this format:
{
  "metrics": [
    {"name": "metric_name", "value": number, "unit": "unit", "target": number},
    ...
  ],
  "feedback": "Your feedback text here",
  "category": "form|safety|technique|encouragement",
  "severity": "low|medium|high"
}

Return the JSON object first, followed by the feedback text.`;
      }

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

      // Build system prompt for video analysis (with exercise type)
      const systemPrompt = this.buildSystemPrompt(context, true, request.exerciseType);

      // Analyze using XAI with stateful context and request structured output
      const analysisText = await xaiService.analyzeVideo(
        videoDescription, 
        contextString, 
        { 
          systemPrompt,
          exerciseType: request.exerciseType,
          requestStructuredOutput: true,
        }
      );

      // Check if we should provide this feedback to the user (avoid spam in UI)
      // But we'll always save the analysis for progress tracking
      const shouldShowFeedback = shouldProvideFeedback(request.userId, analysisText);
      const isSuppressed = !shouldShowFeedback;

      // Parse structured metrics from AI response
      const { metrics: sportMetrics, feedback: feedbackText } = parseSportMetrics(
        request.exerciseType || 'general',
        analysisText || 'Form analysis complete',
        landmarks
      );
      
      // Record the feedback only if we're going to show it to the user
      if (shouldShowFeedback && feedbackText) {
        recordFeedback(request.userId, feedbackText);
      }

      // Create timestamped feedback entry
      const timestampedFeedback: TimestampedFeedback = {
        timestamp: new Date(),
        feedback: feedbackText,
        category: this.categorizeFeedback(feedbackText),
        severity: this.assessSeverity(feedbackText),
      };
      
      // Always parse analysis (for progress tracking), even if feedback is suppressed
      const finalFeedbackText = isSuppressed 
        ? 'Form analysis in progress - monitoring form' 
        : feedbackText;
      
      const analysis = this.parseVideoAnalysis(
        finalFeedbackText, 
        request.analysisType,
        landmarks,
        request.exerciseType,
        sportMetrics,
        timestampedFeedback
      );

      return {
        analysis,
        type: request.analysisType,
        timestamp: new Date(),
        suppressed: isSuppressed, // Mark if feedback should be suppressed from UI
      };
    } catch (error: any) {
      console.error('Video analysis error:', error);
      throw new Error(`Failed to analyze video: ${error.message}`);
    }
  }

  /**
   * Calculate form score from pose landmarks
   */
  private calculateFormScore(landmarks: any[], poseDescription: string, exerciseType?: string): number {
    if (!landmarks || landmarks.length === 0) {
      return 50; // Low score if no pose detected
    }

    let score = 75; // Base score
    let deductions = 0;
    let bonuses = 0;

    try {
      // Convert landmarks to a more usable format
      const landmarkMap: { [key: number]: { x: number; y: number; z?: number; visibility?: number } } = {};
      landmarks.forEach((lm: any, index: number) => {
        if (typeof lm === 'object' && lm.x !== undefined && lm.y !== undefined) {
          landmarkMap[index] = {
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility || 1,
          };
        }
      });

      // Check key body parts visibility
      const keyPoints = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26]; // Key body landmarks
      const visiblePoints = keyPoints.filter(idx => {
        const point = landmarkMap[idx];
        return point && (point.visibility === undefined || point.visibility > 0.5);
      }).length;
      
      const visibilityScore = (visiblePoints / keyPoints.length) * 100;
      if (visibilityScore < 70) {
        deductions += (70 - visibilityScore) * 0.3; // Deduct for poor visibility
      }

      // Exercise-specific scoring
      if (exerciseType === 'squats' || exerciseType === 'lunges') {
        // Check knee alignment (landmarks 25, 26 are knees; 23, 24 are hips)
        if (landmarkMap[25] && landmarkMap[26] && landmarkMap[23] && landmarkMap[24]) {
          const leftKneeX = landmarkMap[25].x;
          const leftHipX = landmarkMap[23].x;
          const rightKneeX = landmarkMap[26].x;
          const rightHipX = landmarkMap[24].x;
          
          const leftAlignment = Math.abs(leftKneeX - leftHipX);
          const rightAlignment = Math.abs(rightKneeX - rightHipX);
          
          // Good alignment (knee over hip) should have small difference
          if (leftAlignment > 0.1 || rightAlignment > 0.1) {
            deductions += 5; // Deduct for poor knee alignment
          } else {
            bonuses += 5; // Bonus for good alignment
          }
        }

        // Check depth (hip y position relative to knee)
        if (landmarkMap[23] && landmarkMap[24] && landmarkMap[25] && landmarkMap[26]) {
          const avgHipY = (landmarkMap[23].y + landmarkMap[24].y) / 2;
          const avgKneeY = (landmarkMap[25].y + landmarkMap[26].y) / 2;
          const depth = avgHipY - avgKneeY;
          
          if (depth > 0.1) {
            bonuses += 3; // Bonus for good depth
          } else if (depth < 0.05) {
            deductions += 5; // Deduct for shallow depth
          }
        }
      }

      // Check spine alignment (landmarks 11, 12 are shoulders; 23, 24 are hips)
      if (landmarkMap[11] && landmarkMap[12] && landmarkMap[23] && landmarkMap[24]) {
        const shoulderMidX = (landmarkMap[11].x + landmarkMap[12].x) / 2;
        const hipMidX = (landmarkMap[23].x + landmarkMap[24].x) / 2;
        const alignment = Math.abs(shoulderMidX - hipMidX);
        
        if (alignment < 0.05) {
          bonuses += 5; // Bonus for good spine alignment
        } else if (alignment > 0.1) {
          deductions += 5; // Deduct for poor alignment
        }
      }

      // Check shoulder level (for upper body exercises)
      if (exerciseType === 'pushups' || exerciseType === 'planks' || exerciseType === 'overhead_press') {
        if (landmarkMap[11] && landmarkMap[12]) {
          const shoulderLevel = Math.abs(landmarkMap[11].y - landmarkMap[12].y);
          if (shoulderLevel < 0.03) {
            bonuses += 5; // Bonus for level shoulders
          } else if (shoulderLevel > 0.1) {
            deductions += 8; // Deduct for uneven shoulders
          }
        }
      }

      // Calculate final score
      score = Math.max(0, Math.min(100, score + bonuses - deductions));
      
      // Adjust based on visibility
      score = score * (visibilityScore / 100);
      score = Math.round(score);
    } catch (error) {
      console.error('Error calculating form score:', error);
      // Return base score if calculation fails
    }

    return Math.max(50, Math.min(100, score)); // Clamp between 50-100
  }

  /**
   * Categorize feedback into types
   */
  private categorizeFeedback(feedback: string): 'form' | 'safety' | 'technique' | 'encouragement' {
    const lower = feedback.toLowerCase();
    if (lower.includes('danger') || lower.includes('risk') || lower.includes('injury') || lower.includes('unsafe')) {
      return 'safety';
    }
    if (lower.includes('good') || lower.includes('excellent') || lower.includes('great') || lower.includes('well')) {
      return 'encouragement';
    }
    if (lower.includes('technique') || lower.includes('method') || lower.includes('approach')) {
      return 'technique';
    }
    return 'form';
  }

  /**
   * Assess feedback severity
   */
  private assessSeverity(feedback: string): 'low' | 'medium' | 'high' {
    const lower = feedback.toLowerCase();
    if (lower.includes('critical') || lower.includes('danger') || lower.includes('immediate') || lower.includes('stop')) {
      return 'high';
    }
    if (lower.includes('significant') || lower.includes('major') || lower.includes('important')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Parse AI analysis text into structured format
   */
  private parseVideoAnalysis(
    analysisText: string, 
    analysisType: string, 
    landmarks?: any[], 
    exerciseType?: string,
    sportMetrics?: any[],
    timestampedFeedback?: TimestampedFeedback
  ): VideoAnalysisResponse['analysis'] {
    // Calculate form score from pose data or sport metrics
    let calculatedScore = 75;
    if (sportMetrics && sportMetrics.length > 0) {
      // Calculate average from sport metrics
      const scores = sportMetrics.map(m => {
        if (m.target !== undefined && m.value !== undefined) {
          const ratio = m.value / m.target;
          return Math.min(100, ratio * 100);
        }
        return m.value || 75;
      });
      calculatedScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    } else if (landmarks && landmarks.length > 0) {
      calculatedScore = this.calculateFormScore(landmarks, '', exerciseType);
    }

    // Simple parsing - in production, you might use more sophisticated NLP
    const analysis: VideoAnalysisResponse['analysis'] = {
      formFeedback: analysisText,
      score: Math.round(calculatedScore), // Use calculated score instead of default
      sportMetrics: sportMetrics || [],
      timestampedFeedback: timestampedFeedback ? [timestampedFeedback] : [],
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

