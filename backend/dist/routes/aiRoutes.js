"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_1 = require("../controllers/aiController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require user authentication
router.use(auth_1.authenticateUser);
// AI analysis routes
router.post('/analyze-video', aiController_1.analyzeVideo);
router.post('/advice', aiController_1.getAdvice);
exports.default = router;
//# sourceMappingURL=aiRoutes.js.map