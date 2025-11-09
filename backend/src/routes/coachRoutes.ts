import { Router } from 'express';
import {
  getStudents,
  getStudent,
  addStudent,
  requestStudentByUsername,
  removeStudent,
  getSports,
  addSports,
  removeSport,
  updateCoachProfile,
  updateStudentAIParameters,
  getStudentAIParameters,
  getCoachProfile,
  getStudentVideoAnalyses,
  getStudentVideos,
} from '../controllers/coachController';
import { authenticateCoach } from '../middleware/auth';

const router = Router();

// All routes require coach authentication
router.use(authenticateCoach);

// Coach profile routes
router.get('/profile', getCoachProfile);
router.put('/profile', updateCoachProfile);

// Students routes
router.get('/students', getStudents);
router.get('/students/:studentId', getStudent);
router.post('/students/request', requestStudentByUsername); // Request student by username
router.post('/students/:studentId', addStudent); // Accept request and add student
router.delete('/students/:studentId', removeStudent);

// Sports routes
router.get('/sports', getSports);
router.post('/sports', addSports);
router.delete('/sports', removeSport);

// AI parameters routes
router.get('/students/:studentId/ai-parameters', getStudentAIParameters);
router.put('/students/:studentId/ai-parameters', updateStudentAIParameters);

// Video analysis routes
router.get('/students/:studentId/video-analyses', getStudentVideoAnalyses);
router.get('/students/:studentId/videos', getStudentVideos);

export default router;

