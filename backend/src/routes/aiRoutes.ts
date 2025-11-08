import { Router } from 'express';
import { analyzeVideo, getAdvice } from '../controllers/aiController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// All routes require user authentication
router.use(authenticateUser);

// AI analysis routes
router.post('/analyze-video', analyzeVideo);
router.post('/advice', getAdvice);

export default router;

