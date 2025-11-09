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
// Coach assignment routes
router.post('/request-coach/:coachId', userController_1.requestCoach);
router.delete('/coach', userController_1.removeCoach);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map