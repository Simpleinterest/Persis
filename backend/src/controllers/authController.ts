import { Request, Response } from 'express';
import User from '../models/User';
import Coach from '../models/Coach';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { IUserCreate } from '../types/user.types';
import { ICoachCreate } from '../types/coach.types';

/**
 * Register a new user
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userName, passWord, ...userData }: IUserCreate = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(passWord);

    // Create new user
    const user = new User({
      userName,
      passWord: hashedPassword,
      ...userData,
    });

    await user.save();

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      userName: user.userName,
      type: 'user',
    });

    // Remove password from response
    const userResponse = user.toObject();
    const { passWord: _, ...userWithoutPassword } = userResponse;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Login user
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userName, passWord } = req.body;

    if (!userName || !passWord) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Find user
    const user = await User.findOne({ userName });
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(passWord, user.passWord);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      userName: user.userName,
      type: 'user',
    });

    // Remove password from response
    const userResponse = user.toObject();
    const { passWord: _pw, ...userWithoutPassword } = userResponse;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Register a new coach
 */
export const registerCoach = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userName, passWord, ...coachData }: ICoachCreate = req.body;

    // Check if coach already exists
    const existingCoach = await Coach.findOne({ userName });
    if (existingCoach) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(passWord);

    // Create new coach
    const coach = new Coach({
      userName,
      passWord: hashedPassword,
      ...coachData,
    });

    await coach.save();

    // Generate token
    const token = generateToken({
      id: coach._id.toString(),
      userName: coach.userName,
      type: 'coach',
    });

    // Remove password from response
    const coachResponse = coach.toObject();
    const { passWord: _pwd, ...coachWithoutPassword } = coachResponse;

    res.status(201).json({
      message: 'Coach registered successfully',
      token,
      coach: coachWithoutPassword,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Login coach
 */
export const loginCoach = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userName, passWord } = req.body;

    if (!userName || !passWord) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Find coach
    const coach = await Coach.findOne({ userName });
    if (!coach) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(passWord, coach.passWord);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Generate token
    const token = generateToken({
      id: coach._id.toString(),
      userName: coach.userName,
      type: 'coach',
    });

    // Remove password from response
    const coachResponse = coach.toObject();
    const { passWord: _password, ...coachWithoutPassword } = coachResponse;

    res.json({
      message: 'Login successful',
      token,
      coach: coachWithoutPassword,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get current user (for authenticated user routes)
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as any; // Type assertion for AuthRequest
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
 * Get current coach (for authenticated coach routes)
 */
export const getCurrentCoach = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as any; // Type assertion for AuthRequest
    const coachId = authReq.user?.id;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const coach = await Coach.findById(coachId).select('-passWord');
    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    res.json({ coach });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

