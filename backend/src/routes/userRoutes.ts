import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  requestCoach,
  removeCoach,
} from '../controllers/userController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Coach assignment routes
router.post('/request-coach/:coachId', requestCoach);
router.delete('/coach', removeCoach);

export default router;

