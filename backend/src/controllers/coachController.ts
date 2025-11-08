import { Request, Response } from 'express';
import User from '../models/User';
import Coach from '../models/Coach';
import { AuthRequest } from '../middleware/auth';
import { hashPassword } from '../utils/password';
import mongoose from 'mongoose';

/**
 * Get coach profile
 */
export const getCoachProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
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

/**
 * Get all students for the coach
 */
export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const coachId = authReq.user?.id;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    // Get all students with their basic info
    const students = await User.find({ _id: { $in: coach.studentsId } })
      .select('-passWord')
      .lean();

    res.json({ students });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a specific student's details
 */
export const getStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const coachId = authReq.user?.id;
    const { studentId } = req.params;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400).json({ error: 'Invalid student ID' });
      return;
    }

    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    // Verify student belongs to this coach
    if (!coach.studentsId.some(id => id.toString() === studentId)) {
      res.status(403).json({ error: 'Student not found in your student list' });
      return;
    }

    const student = await User.findById(studentId).select('-passWord');
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.json({ student });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add a student to coach's list (student must request first, but for simplicity we'll allow direct addition)
 */
export const addStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const coachId = authReq.user?.id;
    const { studentId } = req.params;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400).json({ error: 'Invalid student ID' });
      return;
    }

    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    const student = await User.findById(studentId);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Check if student is already in the list
    if (coach.studentsId.some(id => id.toString() === studentId)) {
      res.status(400).json({ error: 'Student already in your list' });
      return;
    }

    // Add student to coach's list
    coach.studentsId.push(studentId as any);
    await coach.save();

    // Update student's coachId
    student.coachId = coachId as any;
    await student.save();

    res.json({ message: 'Student added successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Remove a student from coach's list
 */
export const removeStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const coachId = authReq.user?.id;
    const { studentId } = req.params;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400).json({ error: 'Invalid student ID' });
      return;
    }

    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    // Check if student is in the list
    if (!coach.studentsId.some(id => id.toString() === studentId)) {
      res.status(400).json({ error: 'Student not in your list' });
      return;
    }

    // Remove student from coach's list
    coach.studentsId = coach.studentsId.filter(id => id.toString() !== studentId);
    await coach.save();

    // Remove coach from student
    const student = await User.findById(studentId);
    if (student) {
      student.coachId = undefined;
      await student.save();
    }

    res.json({ message: 'Student removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get coach's sports
 */
export const getSports = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const coachId = authReq.user?.id;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const coach = await Coach.findById(coachId).select('sports');
    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    res.json({ sports: coach.sports });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add sports to coach's specialization
 */
export const addSports = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const coachId = authReq.user?.id;
    const { sports } = req.body;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!sports || !Array.isArray(sports)) {
      res.status(400).json({ error: 'Sports must be an array' });
      return;
    }

    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    // Add new sports (avoid duplicates)
    const newSports = sports.filter((sport: string) => !coach.sports.includes(sport));
    coach.sports = [...coach.sports, ...newSports];
    await coach.save();

    res.json({ message: 'Sports added successfully', sports: coach.sports });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Remove a sport from coach's specialization
 */
export const removeSport = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const coachId = authReq.user?.id;
    const { sport } = req.body;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!sport) {
      res.status(400).json({ error: 'Sport name is required' });
      return;
    }

    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    coach.sports = coach.sports.filter(s => s !== sport);
    await coach.save();

    res.json({ message: 'Sport removed successfully', sports: coach.sports });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update coach profile
 */
export const updateCoachProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const coachId = authReq.user?.id;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const {
      userName,
      passWord,
      profile,
      sports,
    } = req.body;

    const updateData: any = {};

    if (userName) {
      // Check if username is already taken by another coach
      const existingCoach = await Coach.findOne({ userName, _id: { $ne: coachId } });
      if (existingCoach) {
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

    if (sports !== undefined) {
      updateData.sports = sports;
    }

    const coach = await Coach.findByIdAndUpdate(
      coachId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passWord');

    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    res.json({ message: 'Profile updated successfully', coach });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update AI parameters for a specific student
 */
export const updateStudentAIParameters = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const coachId = authReq.user?.id;
    const { studentId } = req.params;
    const { parameters } = req.body;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400).json({ error: 'Invalid student ID' });
      return;
    }

    if (!parameters || typeof parameters !== 'string') {
      res.status(400).json({ error: 'Parameters must be a string' });
      return;
    }

    const coach = await Coach.findById(coachId);
    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    // Verify student belongs to this coach
    if (!coach.studentsId.some(id => id.toString() === studentId)) {
      res.status(403).json({ error: 'Student not found in your student list' });
      return;
    }

    // Update AI parameters
    if (!coach.aiParameters) {
      coach.aiParameters = {};
    }
    coach.aiParameters[studentId] = parameters;
    await coach.save();

    res.json({ message: 'AI parameters updated successfully', aiParameters: coach.aiParameters });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get AI parameters for a specific student
 */
export const getStudentAIParameters = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const coachId = authReq.user?.id;
    const { studentId } = req.params;

    if (!coachId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400).json({ error: 'Invalid student ID' });
      return;
    }

    const coach = await Coach.findById(coachId).select('aiParameters studentsId');
    if (!coach) {
      res.status(404).json({ error: 'Coach not found' });
      return;
    }

    // Verify student belongs to this coach
    if (!coach.studentsId.some(id => id.toString() === studentId)) {
      res.status(403).json({ error: 'Student not found in your student list' });
      return;
    }

    const parameters = coach.aiParameters?.[studentId] || '';

    res.json({ parameters });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
