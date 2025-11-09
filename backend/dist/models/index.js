"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoAnalysis = exports.CoachRequest = exports.Coach = exports.User = void 0;
// Export all models from a central location
var User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return __importDefault(User_1).default; } });
var Coach_1 = require("./Coach");
Object.defineProperty(exports, "Coach", { enumerable: true, get: function () { return __importDefault(Coach_1).default; } });
var CoachRequest_1 = require("./CoachRequest");
Object.defineProperty(exports, "CoachRequest", { enumerable: true, get: function () { return __importDefault(CoachRequest_1).default; } });
var VideoAnalysis_1 = require("./VideoAnalysis");
Object.defineProperty(exports, "VideoAnalysis", { enumerable: true, get: function () { return __importDefault(VideoAnalysis_1).default; } });
//# sourceMappingURL=index.js.map