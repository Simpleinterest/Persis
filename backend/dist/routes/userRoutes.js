"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateUser);
// User profile routes
router.get('/profile', userController_1.getUserProfile);
router.put('/profile', userController_1.updateUserProfile);
// Progress routes
router.get('/progress', userController_1.getUserProgress);
// Coach routes
router.get('/coaches', userController_1.getUserCoaches);
router.post('/request-coach/:coachId', userController_1.requestCoach);
router.delete('/coach', userController_1.removeCoach);
// Coach request routes
router.get('/coach-requests', userController_1.getCoachRequests);
router.post('/coach-requests/:requestId/accept', userController_1.acceptCoachRequest);
router.post('/coach-requests/:requestId/reject', userController_1.rejectCoachRequest);
// Video upload routes
router.post('/videos/upload', userController_1.uploadVideo);
router.put('/videos/:videoId/permission', userController_1.updateVideoPermission);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map