import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { analyzeVideoForm, getExerciseAdvice } from '../services/xaiService';
import User from '../models/User';

/**
 * Analyze uploaded video for form correction
 */
export const analyzeVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
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
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Analyze video with XAI
    const analysis = await analyzeVideoForm(userId, videoDescription, exercise);

    res.json({
      success: true,
      analysis: analysis,
      exercise: exercise,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error analyzing video:', error);
    res.status(500).json({ error: 'Failed to analyze video. Please try again.' });
  }
};

/**
 * Get exercise advice from AI
 */
export const getAdvice = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
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
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get advice from XAI
    const advice = await getExerciseAdvice(userId, exercise, question);

    res.json({
      success: true,
      advice: advice,
      exercise: exercise,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting advice:', error);
    res.status(500).json({ error: 'Failed to get advice. Please try again.' });
  }
};

