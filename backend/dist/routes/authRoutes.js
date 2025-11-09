"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// User authentication routes
router.post('/user/register', authController_1.registerUser);
router.post('/user/login', authController_1.loginUser);
router.get('/user/me', auth_1.authenticateUser, authController_1.getCurrentUser);
// Coach authentication routes
router.post('/coach/register', authController_1.registerCoach);
router.post('/coach/login', authController_1.loginCoach);
router.get('/coach/me', auth_1.authenticateCoach, authController_1.getCurrentCoach);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map