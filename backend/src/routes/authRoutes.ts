import { Router } from 'express';
import {
  registerUser,
  loginUser,
  registerCoach,
  loginCoach,
  getCurrentUser,
  getCurrentCoach,
} from '../controllers/authController';
import { authenticateUser, authenticateCoach } from '../middleware/auth';

const router = Router();

// User authentication routes
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);
router.get('/user/me', authenticateUser, getCurrentUser);

// Coach authentication routes
router.post('/coach/register', registerCoach);
router.post('/coach/login', loginCoach);
router.get('/coach/me', authenticateCoach, getCurrentCoach);

export default router;

