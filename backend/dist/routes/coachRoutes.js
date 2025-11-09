"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coachController_1 = require("../controllers/coachController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require coach authentication
router.use(auth_1.authenticateCoach);
// Coach profile routes
router.get('/profile', coachController_1.getCoachProfile);
router.put('/profile', coachController_1.updateCoachProfile);
// Students routes
router.get('/students', coachController_1.getStudents);
router.get('/students/:studentId', coachController_1.getStudent);
router.post('/students/:studentId', coachController_1.addStudent);
router.delete('/students/:studentId', coachController_1.removeStudent);
// Sports routes
router.get('/sports', coachController_1.getSports);
router.post('/sports', coachController_1.addSports);
router.delete('/sports', coachController_1.removeSport);
// AI parameters routes
router.get('/students/:studentId/ai-parameters', coachController_1.getStudentAIParameters);
router.put('/students/:studentId/ai-parameters', coachController_1.updateStudentAIParameters);
exports.default = router;
//# sourceMappingURL=coachRoutes.js.map