import { Request, Response } from 'express';
import User from '../models/User';
import Coach from '../models/Coach';
import { AuthRequest } from '../middleware/auth';
import { hashPassword } from '../utils/password';
import mongoose from 'mongoose';

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

    const user = await User.findById(userId).select('-passWord').populate('coachId', 'userName profile');
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
      coachId,
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

    if (bodyWeight !== undefined) updateData.bodyWeight = bodyWeight;
    if (height !== undefined) updateData.height = height;
    if (gender !== undefined) updateData.gender = gender;
    if (sports !== undefined) updateData.sports = sports;
    if (age !== undefined) updateData.age = age;
    if (coachId !== undefined) {
      if (coachId === null) {
        updateData.coachId = null;
      } else {
        // Verify coach exists
        const coach = await Coach.findById(coachId);
        if (!coach) {
          res.status(404).json({ error: 'Coach not found' });
          return;
        }
        updateData.coachId = coachId;
      }
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
 * Request to join a coach
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
      res.status(400).json({ error: 'No coach assigned' });
      return;
    }

    const coachId = user.coachId;

    // Remove user from coach's student list
    const coach = await Coach.findById(coachId);
    if (coach) {
      coach.studentsId = coach.studentsId.filter(id => id.toString() !== userId);
      await coach.save();
    }

    // Remove coach from user
    user.coachId = undefined;
    await user.save();

    res.json({ message: 'Coach removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

