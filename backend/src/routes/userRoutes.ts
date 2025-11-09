import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  requestCoach,
  removeCoach,
  getCoachRequests,
  acceptCoachRequest,
  rejectCoachRequest,
  uploadVideo,
  updateVideoPermission,
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

// Coach request routes
router.get('/coach-requests', getCoachRequests);
router.post('/coach-requests/:requestId/accept', acceptCoachRequest);
router.post('/coach-requests/:requestId/reject', rejectCoachRequest);

// Video upload routes
router.post('/videos/upload', uploadVideo);
router.put('/videos/:videoId/permission', updateVideoPermission);

export default router;

