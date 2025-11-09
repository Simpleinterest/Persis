"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVideoPermission = exports.uploadVideo = exports.removeCoach = exports.requestCoach = exports.rejectCoachRequest = exports.acceptCoachRequest = exports.getCoachRequests = exports.updateUserProfile = exports.getUserProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const Coach_1 = __importDefault(require("../models/Coach"));
const CoachRequest_1 = __importDefault(require("../models/CoachRequest"));
const VideoAnalysis_1 = __importDefault(require("../models/VideoAnalysis"));
const password_1 = require("../utils/password");
const mongoose_1 = __importDefault(require("mongoose"));
const aiService_1 = require("../services/aiService");
const multer_1 = __importDefault(require("multer"));
// Configure Multer for video uploads
const storage = multer_1.default.memoryStorage(); // Store video in memory as a Buffer
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only video files are allowed!'));
        }
    },
});
/**
 * Get user profile
 */
const getUserProfile = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const user = await User_1.default.findById(userId).select('-passWord');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserProfile = getUserProfile;
/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { userName, passWord, profile, bodyWeight, height, gender, sports, age, } = req.body;
        const updateData = {};
        if (userName) {
            // Check if username is already taken by another user
            const existingUser = await User_1.default.findOne({ userName, _id: { $ne: userId } });
            if (existingUser) {
                res.status(400).json({ error: 'Username already taken' });
                return;
            }
            updateData.userName = userName;
        }
        if (passWord) {
            updateData.passWord = await (0, password_1.hashPassword)(passWord);
        }
        if (profile !== undefined) {
            updateData.profile = profile;
        }
        if (bodyWeight !== undefined) {
            updateData.bodyWeight = bodyWeight;
        }
        if (height !== undefined) {
            updateData.height = height;
        }
        if (gender !== undefined) {
            updateData.gender = gender;
        }
        if (sports !== undefined) {
            updateData.sports = sports;
        }
        if (age !== undefined) {
            updateData.age = age;
        }
        const user = await User_1.default.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true }).select('-passWord');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ message: 'Profile updated successfully', user });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateUserProfile = updateUserProfile;
/**
 * Get pending coach requests for the user
 */
const getCoachRequests = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const requests = await CoachRequest_1.default.find({ studentId: userId, status: 'pending' })
            .populate('coachId', 'userName profile')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ requests });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCoachRequests = getCoachRequests;
/**
 * Accept a coach request
 */
const acceptCoachRequest = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?.id;
        const { requestId } = req.params;
        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            res.status(400).json({ error: 'Invalid request ID' });
            return;
        }
        const request = await CoachRequest_1.default.findOne({
            _id: requestId,
            studentId: userId,
            status: 'pending',
        });
        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }
        const coach = await Coach_1.default.findById(request.coachId);
        const student = await User_1.default.findById(userId);
        if (!coach || !student) {
            res.status(404).json({ error: 'Coach or student not found' });
            return;
        }
        // Add student to coach's list
        if (!coach.studentsId.some(id => id.toString() === userId)) {
            coach.studentsId.push(userId);
            await coach.save();
        }
        // Update student's coachId
        student.coachId = request.coachId;
        await student.save();
        // Update request status
        request.status = 'accepted';
        await request.save();
        res.json({ message: 'Coach request accepted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.acceptCoachRequest = acceptCoachRequest;
/**
 * Reject a coach request
 */
const rejectCoachRequest = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?.id;
        const { requestId } = req.params;
        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            res.status(400).json({ error: 'Invalid request ID' });
            return;
        }
        const request = await CoachRequest_1.default.findOne({
            _id: requestId,
            studentId: userId,
            status: 'pending',
        });
        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }
        // Update request status
        request.status = 'rejected';
        await request.save();
        res.json({ message: 'Coach request rejected successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.rejectCoachRequest = rejectCoachRequest;
/**
 * Request to join a coach (legacy - kept for backward compatibility)
 */
const requestCoach = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?.id;
        const { coachId } = req.params;
        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(coachId)) {
            res.status(400).json({ error: 'Invalid coach ID' });
            return;
        }
        // Verify coach exists
        const coach = await Coach_1.default.findById(coachId);
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        // Check if user already has a coach
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (user.coachId && user.coachId.toString() === coachId) {
            res.status(400).json({ error: 'You are already assigned to this coach' });
            return;
        }
        // Check if coach already has this student
        if (coach.studentsId.some(id => id.toString() === userId)) {
            res.status(400).json({ error: 'You are already in this coach\'s student list' });
            return;
        }
        // For now, we'll add the student directly. In a real system, this might go through a request/approval system
        // Add student to coach's list
        coach.studentsId.push(userId);
        await coach.save();
        // Update user's coachId
        user.coachId = coachId;
        await user.save();
        res.json({ message: 'Successfully requested and added to coach' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requestCoach = requestCoach;
/**
 * Remove coach assignment
 */
const removeCoach = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (!user.coachId) {
            res.status(400).json({ error: 'You do not have a coach assigned' });
            return;
        }
        const coachId = user.coachId;
        user.coachId = undefined;
        await user.save();
        // Remove user from coach's list
        const coach = await Coach_1.default.findById(coachId);
        if (coach) {
            coach.studentsId = coach.studentsId.filter(id => id.toString() !== userId);
            await coach.save();
        }
        res.json({ message: 'Coach removed successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.removeCoach = removeCoach;
/**
 * Upload video for AI analysis (with multer middleware)
 */
exports.uploadVideo = [
    upload.single('video'), // Multer middleware to handle file upload
    async (req, res) => {
        try {
            const authReq = req;
            const userId = authReq.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            if (!req.file) {
                res.status(400).json({ error: 'No video file uploaded' });
                return;
            }
            const { analysisType, exerciseType, studentPermission } = req.body;
            if (!analysisType || !['form', 'progress', 'technique', 'general'].includes(analysisType)) {
                res.status(400).json({ error: 'Invalid analysis type' });
                return;
            }
            // Get user's coach ID
            const user = await User_1.default.findById(userId);
            const coachId = user?.coachId || null;
            // In a real application, you would upload this to cloud storage (e.g., S3, Cloudinary)
            // For now, we'll simulate by storing a placeholder URL and the buffer for AI analysis
            const videoUrl = `https://example.com/videos/${userId}-${Date.now()}.mp4`; // Placeholder URL
            const thumbnailUrl = `https://example.com/thumbnails/${userId}-${Date.now()}.jpg`; // Placeholder thumbnail
            // Convert studentPermission string to boolean
            const hasPermission = studentPermission === 'true' || studentPermission === true;
            const videoAnalysis = new VideoAnalysis_1.default({
                userId: userId,
                coachId: coachId,
                type: 'uploaded',
                videoUrl: videoUrl,
                thumbnailUrl: thumbnailUrl,
                metrics: {
                    exerciseType: exerciseType || 'general',
                    analysisType: analysisType,
                },
                coachVisible: hasPermission, // Coach can see if student gave permission
                studentPermission: hasPermission,
            });
            await videoAnalysis.save();
            // Trigger AI analysis in the background
            try {
                const context = await aiService_1.aiService.getUserContext(userId, coachId?.toString());
                // For uploaded videos, we'll analyze using the video URL or buffer
                // For now, we'll use a placeholder analysis since we don't have actual video processing
                const analysis = await aiService_1.aiService.analyzeVideo({
                    videoData: { videoUrl, type: 'uploaded' }, // Pass video URL for analysis
                    analysisType: analysisType || 'form',
                    exerciseType: exerciseType,
                    userId: userId,
                    context: context,
                });
                if (analysis) {
                    // Update video analysis with AI feedback
                    videoAnalysis.summary = analysis.analysis.formFeedback || 'Video analysis complete';
                    videoAnalysis.feedback = analysis.analysis.formFeedback || null;
                    const currentMetrics = videoAnalysis.metrics || {};
                    videoAnalysis.metrics = {
                        ...currentMetrics,
                        score: analysis.analysis.score || 75,
                    };
                    await videoAnalysis.save();
                }
            }
            catch (analysisError) {
                console.error('Failed to analyze uploaded video:', analysisError);
                // Don't fail the request if analysis fails
            }
            res.status(201).json({
                message: 'Video uploaded successfully',
                videoAnalysis: {
                    _id: videoAnalysis._id,
                    videoUrl: videoAnalysis.videoUrl,
                    summary: videoAnalysis.summary,
                    feedback: videoAnalysis.feedback,
                    studentPermission: videoAnalysis.studentPermission,
                    createdAt: videoAnalysis.createdAt,
                },
            });
        }
        catch (error) {
            console.error('Video upload error:', error);
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
];
/**
 * Update video permission for coach viewing
 */
const updateVideoPermission = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?.id;
        const { videoId } = req.params;
        const { studentPermission } = req.body;
        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(videoId)) {
            res.status(400).json({ error: 'Invalid video ID' });
            return;
        }
        const videoAnalysis = await VideoAnalysis_1.default.findOne({
            _id: videoId,
            userId: userId,
            type: 'uploaded',
        });
        if (!videoAnalysis) {
            res.status(404).json({ error: 'Video not found' });
            return;
        }
        // Update permission
        videoAnalysis.studentPermission = studentPermission !== false;
        videoAnalysis.coachVisible = studentPermission !== false;
        await videoAnalysis.save();
        res.json({
            message: 'Video permission updated successfully',
            videoAnalysis: {
                _id: videoAnalysis._id,
                studentPermission: videoAnalysis.studentPermission,
                coachVisible: videoAnalysis.coachVisible,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateVideoPermission = updateVideoPermission;
//# sourceMappingURL=userController.js.map