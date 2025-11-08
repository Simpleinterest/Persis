import { Router } from 'express';
import {
  getStudents,
  getStudent,
  addStudent,
  removeStudent,
  getSports,
  addSports,
  removeSport,
  updateCoachProfile,
  updateStudentAIParameters,
  getStudentAIParameters,
  getCoachProfile,
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
router.post('/students/:studentId', addStudent);
router.delete('/students/:studentId', removeStudent);

// Sports routes
router.get('/sports', getSports);
router.post('/sports', addSports);
router.delete('/sports', removeSport);

// AI parameters routes
router.get('/students/:studentId/ai-parameters', getStudentAIParameters);
router.put('/students/:studentId/ai-parameters', updateStudentAIParameters);

export default router;

