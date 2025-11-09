import { Request, Response } from 'express';
import User from '../models/User';
import Coach from '../models/Coach';
import CoachRequest from '../models/CoachRequest';
import VideoAnalysis from '../models/VideoAnalysis';
import { AuthRequest } from '../middleware/auth';
import { hashPassword } from '../utils/password';
import mongoose from 'mongoose';
import { aiService } from '../services/aiService';
import multer from 'multer';

// Configure Multer for video uploads
const storage = multer.memoryStorage(); // Store video in memory as a Buffer
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  },
});

/**
 * Get user profile
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId).select('-passWord');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const {
      userName,
      passWord,
      profile,
      bodyWeight,
      height,
      gender,
      sports,
      age,
    } = req.body;

    const updateData: any = {};

    if (userName) {
      // Check if username is already taken by another user
      const existingUser = await User.findOne({ userName, _id: { $ne: userId } });
      if (existingUser) {
        res.status(400).json({ error: 'Username already taken' });
        return;
      }
      updateData.userName = userName;
    }

    if (passWord) {
      updateData.passWord = await hashPassword(passWord);
    }

    if (profile !== undefined) {
      updateData.profile = profile;
    }

    if (bodyWeight !== undefined) {
      updateData.bodyWeight = bodyWeight;
    }

    if (height !== undefined) {
      updateData.height = height;
    }

    if (gender !== undefined) {
      updateData.gender = gender;
    }

    if (sports !== undefined) {
      updateData.sports = sports;
    }

    if (age !== undefined) {
      updateData.age = age;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passWord');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get pending coach requests for the user
 */
export const getCoachRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const requests = await CoachRequest.find({ studentId: userId, status: 'pending' })
      .populate('coachId', 'userName profile')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Accept a coach request
 */
export const acceptCoachRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { requestId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      res.status(400).json({ error: 'Invalid request ID' });
      return;
    }

    const request = await CoachRequest.findOne({
      _id: requestId,
      studentId: userId,
      status: 'pending',
    });

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const coach = await Coach.findById(request.coachId);
    const student = await User.findById(userId);

    if (!coach || !student) {
      res.status(404).json({ error: 'Coach or student not found' });
      return;
    }

    // Add student to coach's list
    if (!coach.studentsId.some(id => id.toString() === userId)) {
      coach.studentsId.push(userId as any);
      await coach.save();
    }

    // Update student's coachId
    student.coachId = request.coachId as any;
    await student.save();

    // Update request status
    request.status = 'accepted';
    await request.save();

    res.json({ message: 'Coach request accepted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reject a coach request
 */
export const rejectCoachRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { requestId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      res.status(400).json({ error: 'Invalid request ID' });
      return;
    }

    const request = await CoachRequest.findOne({
      _id: requestId,
      studentId: userId,
      status: 'pending',
    });

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    // Update request status
    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Coach request rejected successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Request to join a coach (legacy - kept for backward compatibility)
 */
export const requestCoach = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { coachId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(coachId)) {
      res.status(400).json({ error: 'Invalid coach ID' });
      return;
    }

    // Verify coach exists
    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    // Check if user already has a coach
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.coachId && user.coachId.toString() === coachId) {
      res.status(400).json({ error: 'You are already assigned to this coach' });
      return;
    }

    // Check if coach already has this student
    if (coach.studentsId.some(id => id.toString() === userId)) {
      res.status(400).json({ error: 'You are already in this coach\'s student list' });
      return;
    }

    // For now, we'll add the student directly. In a real system, this might go through a request/approval system
    // Add student to coach's list
    coach.studentsId.push(userId as any);
    await coach.save();

    // Update user's coachId
    user.coachId = coachId as any;
    await user.save();

    res.json({ message: 'Successfully requested and added to coach' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Remove coach assignment
 */
export const removeCoach = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.coachId) {
      res.status(400).json({ error: 'You do not have a coach assigned' });
      return;
    }

    const coachId = user.coachId;
    user.coachId = undefined;
    await user.save();

    // Remove user from coach's list
    const coach = await Coach.findById(coachId);
    if (coach) {
      coach.studentsId = coach.studentsId.filter(id => id.toString() !== userId);
      await coach.save();
    }

    res.json({ message: 'Coach removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Upload video for AI analysis (with multer middleware)
 */
export const uploadVideo = [
  upload.single('video'), // Multer middleware to handle file upload
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No video file uploaded' });
        return;
      }

      const { analysisType, exerciseType, studentPermission } = req.body;

      if (!analysisType || !['form', 'progress', 'technique', 'general'].includes(analysisType)) {
        res.status(400).json({ error: 'Invalid analysis type' });
        return;
      }

      // Get user's coach ID
      const user = await User.findById(userId);
      const coachId = user?.coachId || null;

      // In a real application, you would upload this to cloud storage (e.g., S3, Cloudinary)
      // For now, we'll simulate by storing a placeholder URL and the buffer for AI analysis
      const videoUrl = `https://example.com/videos/${userId}-${Date.now()}.mp4`; // Placeholder URL
      const thumbnailUrl = `https://example.com/thumbnails/${userId}-${Date.now()}.jpg`; // Placeholder thumbnail

      // Convert studentPermission string to boolean
      const hasPermission = studentPermission === 'true' || studentPermission === true;

      const videoAnalysis = new VideoAnalysis({
        userId: userId,
        coachId: coachId,
        type: 'uploaded',
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        metrics: {
          exerciseType: exerciseType || 'general',
          analysisType: analysisType,
        },
        coachVisible: hasPermission, // Coach can see if student gave permission
        studentPermission: hasPermission,
      });
      await videoAnalysis.save();

      // Trigger AI analysis in the background
      try {
        const context = await aiService.getUserContext(userId, coachId?.toString());
        // For uploaded videos, we'll analyze using the video URL or buffer
        // For now, we'll use a placeholder analysis since we don't have actual video processing
        const analysis = await aiService.analyzeVideo({
          videoData: { videoUrl, type: 'uploaded' }, // Pass video URL for analysis
          analysisType: (analysisType as 'form' | 'progress' | 'technique' | 'general') || 'form',
          exerciseType: exerciseType,
          userId: userId,
          context: context,
        });

        if (analysis) {
          // Update video analysis with AI feedback
          videoAnalysis.summary = analysis.analysis.formFeedback || 'Video analysis complete';
          videoAnalysis.feedback = analysis.analysis.formFeedback || null;
          const currentMetrics = videoAnalysis.metrics || {};
          videoAnalysis.metrics = {
            ...currentMetrics,
            score: analysis.analysis.score || 75,
          };
          await videoAnalysis.save();
        }
      } catch (analysisError: any) {
        console.error('Failed to analyze uploaded video:', analysisError);
        // Don't fail the request if analysis fails
      }

      res.status(201).json({ 
        message: 'Video uploaded successfully',
        videoAnalysis: {
          _id: videoAnalysis._id,
          videoUrl: videoAnalysis.videoUrl,
          summary: videoAnalysis.summary,
          feedback: videoAnalysis.feedback,
          studentPermission: videoAnalysis.studentPermission,
          createdAt: videoAnalysis.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Video upload error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
];

/**
 * Update video permission for coach viewing
 */
export const updateVideoPermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { videoId } = req.params;
    const { studentPermission } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      res.status(400).json({ error: 'Invalid video ID' });
      return;
    }

    const videoAnalysis = await VideoAnalysis.findOne({
      _id: videoId,
      userId: userId,
      type: 'uploaded',
    });

    if (!videoAnalysis) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Update permission
    videoAnalysis.studentPermission = studentPermission !== false;
    videoAnalysis.coachVisible = studentPermission !== false;
    await videoAnalysis.save();

    res.json({ 
      message: 'Video permission updated successfully',
      videoAnalysis: {
        _id: videoAnalysis._id,
        studentPermission: videoAnalysis.studentPermission,
        coachVisible: videoAnalysis.coachVisible,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user progress data
 */
export const getUserProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { period } = req.query; // 'week', 'month', 'year', '2years'

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '2years':
        startDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to month
    }

    // Get video analyses for the user within the date range
    const { sport } = req.query; // Optional sport filter
    const query: any = {
      userId: userId,
      createdAt: { $gte: startDate, $lte: now },
    };
    
    // Filter by sport if provided
    if (sport && sport !== 'all') {
      query['metrics.exerciseType'] = sport;
    }
    
    const analyses = await VideoAnalysis.find(query)
      .sort({ createdAt: 1 })
      .lean();

    // Process data for charts
    const progressData = analyses.map((analysis: any) => {
      const metrics = analysis.metrics || {};
      return {
        date: analysis.createdAt,
        formScore: (metrics.score && typeof metrics.score === 'number') ? metrics.score : 75,
        exerciseType: (metrics.exerciseType && typeof metrics.exerciseType === 'string') ? metrics.exerciseType : 'general',
        analysisType: (metrics.analysisType && typeof metrics.analysisType === 'string') ? metrics.analysisType : 'form',
        duration: (analysis.duration && typeof analysis.duration === 'number') ? analysis.duration : 0,
        sportMetrics: analysis.sportMetrics || null,
        timestampedFeedback: analysis.timestampedFeedback || [],
        sessionId: analysis.sessionId || null,
      };
    });

    // Calculate statistics
    const formScores = progressData.map(d => d.formScore).filter(s => s > 0);
    const avgFormScore = formScores.length > 0
      ? Math.round(formScores.reduce((sum, score) => sum + score, 0) / formScores.length)
      : 0;
    
    const totalSessions = analyses.length;
    const totalDuration = progressData.reduce((sum, d) => sum + (d.duration || 0), 0);
    
    // Group by exercise type
    const exerciseCounts: { [key: string]: number } = {};
    progressData.forEach(d => {
      exerciseCounts[d.exerciseType] = (exerciseCounts[d.exerciseType] || 0) + 1;
    });

    // Calculate improvement trend
    let improvementTrend = 0;
    if (formScores.length >= 2) {
      const firstHalf = formScores.slice(0, Math.floor(formScores.length / 2));
      const secondHalf = formScores.slice(Math.floor(formScores.length / 2));
      const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
      improvementTrend = Math.round(secondAvg - firstAvg);
    }

    // Aggregate timestamped feedback for common mistakes analysis
    const allFeedback = analyses
      .flatMap((analysis: any) => analysis.timestampedFeedback || [])
      .filter((f: any) => f && f.feedback);
    
    // Extract common mistakes/feedback patterns
    const commonMistakes: { [key: string]: number } = {};
    allFeedback.forEach((f: any) => {
      if (f.category === 'form' || f.category === 'safety') {
        // Simple keyword extraction for common mistakes
        const keywords = extractMistakeKeywords(f.feedback);
        keywords.forEach(keyword => {
          commonMistakes[keyword] = (commonMistakes[keyword] || 0) + 1;
        });
      }
    });
    
    // Get session reviews (group by sessionId)
    const sessionReviews: { [sessionId: string]: any[] } = {};
    analyses.forEach((analysis: any) => {
      if (analysis.sessionId && analysis.timestampedFeedback && analysis.timestampedFeedback.length > 0) {
        if (!sessionReviews[analysis.sessionId]) {
          sessionReviews[analysis.sessionId] = [];
        }
        sessionReviews[analysis.sessionId].push(...analysis.timestampedFeedback);
      }
    });

    res.json({
      period,
      startDate,
      endDate: now,
      progressData,
      statistics: {
        avgFormScore,
        totalSessions,
        totalDuration,
        improvementTrend,
        exerciseCounts,
      },
      commonMistakes: Object.entries(commonMistakes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([mistake, count]) => ({ mistake, count })),
      sessionReviews: Object.entries(sessionReviews).map(([sessionId, feedback]) => ({
        sessionId,
        feedback: feedback.sort((a: any, b: any) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
        date: feedback[0]?.timestamp || new Date(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Extract mistake keywords from feedback text
 */
function extractMistakeKeywords(feedback: string): string[] {
  const keywords: string[] = [];
  const lower = feedback.toLowerCase();
  
  // Common mistake patterns
  const patterns = [
    { pattern: /knee.*cav/i, keyword: 'Knee Caving' },
    { pattern: /back.*round/i, keyword: 'Rounded Back' },
    { pattern: /shoulder.*drop/i, keyword: 'Shoulder Drop' },
    { pattern: /hip.*shift/i, keyword: 'Hip Shift' },
    { pattern: /overexten/i, keyword: 'Overextension' },
    { pattern: /depth.*shallow/i, keyword: 'Shallow Depth' },
    { pattern: /alignment/i, keyword: 'Poor Alignment' },
    { pattern: /balance/i, keyword: 'Balance Issues' },
    { pattern: /core.*engage/i, keyword: 'Weak Core' },
    { pattern: /posture/i, keyword: 'Posture Issues' },
  ];
  
  patterns.forEach(({ pattern, keyword }) => {
    if (pattern.test(lower)) {
      keywords.push(keyword);
    }
  });
  
  return keywords.length > 0 ? keywords : ['Form Issue'];
}

/**
 * Get user's coaches
 */
export const getUserCoaches = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId).populate('coachId', 'userName profile sports');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const coaches = [];
    if (user.coachId) {
      coaches.push(user.coachId);
    }

    res.json({ coaches });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
