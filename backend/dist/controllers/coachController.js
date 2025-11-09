"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentVideos = exports.getStudentVideoAnalyses = exports.getStudentAIParameters = exports.updateStudentAIParameters = exports.updateCoachProfile = exports.removeSport = exports.addSports = exports.getSports = exports.removeStudent = exports.addStudent = exports.requestStudentByUsername = exports.getStudent = exports.getStudents = exports.getCoachProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const Coach_1 = __importDefault(require("../models/Coach"));
const CoachRequest_1 = __importDefault(require("../models/CoachRequest"));
const VideoAnalysis_1 = __importDefault(require("../models/VideoAnalysis"));
const password_1 = require("../utils/password");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Get coach profile
 */
const getCoachProfile = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId).select('-passWord');
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        res.json({ coach });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCoachProfile = getCoachProfile;
/**
 * Get all students for the coach
 */
const getStudents = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId);
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        // Get all students with their basic info
        const students = await User_1.default.find({ _id: { $in: coach.studentsId } })
            .select('-passWord')
            .lean();
        res.json({ students });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStudents = getStudents;
/**
 * Get a specific student's details
 */
const getStudent = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        const { studentId } = req.params;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
            res.status(400).json({ error: 'Invalid student ID' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId);
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        // Verify student belongs to this coach
        if (!coach.studentsId.some(id => id.toString() === studentId)) {
            res.status(403).json({ error: 'Student not found in your student list' });
            return;
        }
        const student = await User_1.default.findById(studentId).select('-passWord');
        if (!student) {
            res.status(404).json({ error: 'Student not found' });
            return;
        }
        // Get performance data (mock data for now - in production, this would come from a Performance model)
        const performanceData = generateMockPerformanceData();
        const goals = generateMockGoals();
        res.json({
            student,
            performanceData,
            goals,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStudent = getStudent;
/**
 * Generate mock performance data for a student
 */
const generateMockPerformanceData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
        date: day,
        score: 75 + Math.floor(Math.random() * 20), // 75-95
        formScore: 70 + Math.floor(Math.random() * 25), // 70-95
        goalProgress: 60 + Math.floor(Math.random() * 25), // 60-85
    }));
};
/**
 * Generate mock goals for a student
 */
const generateMockGoals = () => {
    return [
        { id: '1', title: 'Squat Form Improvement', target: 100, current: 75, unit: '%' },
        { id: '2', title: 'Weight Loss', target: 20, current: 12, unit: 'lbs' },
        { id: '3', title: 'Strength Increase', target: 50, current: 35, unit: 'lbs' },
        { id: '4', title: 'Endurance', target: 30, current: 22, unit: 'min' },
    ];
};
/**
 * Request to add a student by username
 */
const requestStudentByUsername = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        const { username, message } = req.body;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!username) {
            res.status(400).json({ error: 'Username is required' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId);
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        // Find student by username
        const student = await User_1.default.findOne({ userName: username });
        if (!student) {
            res.status(404).json({ error: 'Student not found' });
            return;
        }
        // Check if student is already in the list
        if (coach.studentsId.some(id => id.toString() === student._id.toString())) {
            res.status(400).json({ error: 'Student already in your list' });
            return;
        }
        // Check if there's already a pending request
        const existingRequest = await CoachRequest_1.default.findOne({
            coachId,
            studentId: student._id,
            status: 'pending',
        });
        if (existingRequest) {
            res.status(400).json({ error: 'Request already pending' });
            return;
        }
        // Create request
        const request = new CoachRequest_1.default({
            coachId,
            studentId: student._id,
            status: 'pending',
            message: message || '',
        });
        await request.save();
        res.json({ message: 'Request sent successfully', request });
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: 'Request already exists' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requestStudentByUsername = requestStudentByUsername;
/**
 * Add a student to coach's list (after request is accepted)
 */
const addStudent = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        const { studentId } = req.params;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
            res.status(400).json({ error: 'Invalid student ID' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId);
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        const student = await User_1.default.findById(studentId);
        if (!student) {
            res.status(404).json({ error: 'Student not found' });
            return;
        }
        // Check if student is already in the list
        if (coach.studentsId.some(id => id.toString() === studentId)) {
            res.status(400).json({ error: 'Student already in your list' });
            return;
        }
        // Add student to coach's list
        coach.studentsId.push(studentId);
        await coach.save();
        // Update student's coachId
        student.coachId = coachId;
        await student.save();
        // Update request status if exists
        await CoachRequest_1.default.updateMany({ coachId, studentId, status: 'pending' }, { status: 'accepted' });
        res.json({ message: 'Student added successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addStudent = addStudent;
/**
 * Remove a student from coach's list
 */
const removeStudent = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        const { studentId } = req.params;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
            res.status(400).json({ error: 'Invalid student ID' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId);
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        // Check if student is in the list
        if (!coach.studentsId.some(id => id.toString() === studentId)) {
            res.status(400).json({ error: 'Student not in your list' });
            return;
        }
        // Remove student from coach's list
        coach.studentsId = coach.studentsId.filter(id => id.toString() !== studentId);
        await coach.save();
        // Remove coach from student
        const student = await User_1.default.findById(studentId);
        if (student) {
            student.coachId = undefined;
            await student.save();
        }
        res.json({ message: 'Student removed successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.removeStudent = removeStudent;
/**
 * Get coach's sports
 */
const getSports = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId).select('sports');
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        res.json({ sports: coach.sports });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSports = getSports;
/**
 * Add sports to coach's specialization
 */
const addSports = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        const { sports } = req.body;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!sports || !Array.isArray(sports)) {
            res.status(400).json({ error: 'Sports must be an array' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId);
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        // Add new sports (avoid duplicates)
        const newSports = sports.filter((sport) => !coach.sports.includes(sport));
        coach.sports = [...coach.sports, ...newSports];
        await coach.save();
        res.json({ message: 'Sports added successfully', sports: coach.sports });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addSports = addSports;
/**
 * Remove a sport from coach's specialization
 */
const removeSport = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        const { sport } = req.body;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!sport) {
            res.status(400).json({ error: 'Sport name is required' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId);
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        coach.sports = coach.sports.filter(s => s !== sport);
        await coach.save();
        res.json({ message: 'Sport removed successfully', sports: coach.sports });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.removeSport = removeSport;
/**
 * Update coach profile
 */
const updateCoachProfile = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { userName, passWord, profile, sports, } = req.body;
        const updateData = {};
        if (userName) {
            // Check if username is already taken by another coach
            const existingCoach = await Coach_1.default.findOne({ userName, _id: { $ne: coachId } });
            if (existingCoach) {
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
        if (sports !== undefined) {
            updateData.sports = sports;
        }
        const coach = await Coach_1.default.findByIdAndUpdate(coachId, { $set: updateData }, { new: true, runValidators: true }).select('-passWord');
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        res.json({ message: 'Profile updated successfully', coach });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateCoachProfile = updateCoachProfile;
/**
 * Update AI parameters for a specific student
 */
const updateStudentAIParameters = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        const { studentId } = req.params;
        const { parameters } = req.body;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
            res.status(400).json({ error: 'Invalid student ID' });
            return;
        }
        if (!parameters || typeof parameters !== 'string') {
            res.status(400).json({ error: 'Parameters must be a string' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId);
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        // Verify student belongs to this coach
        if (!coach.studentsId.some(id => id.toString() === studentId)) {
            res.status(403).json({ error: 'Student not found in your student list' });
            return;
        }
        // Update AI parameters
        if (!coach.aiParameters) {
            coach.aiParameters = {};
        }
        coach.aiParameters[studentId] = parameters;
        await coach.save();
        res.json({ message: 'AI parameters updated successfully', aiParameters: coach.aiParameters });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateStudentAIParameters = updateStudentAIParameters;
/**
 * Get AI parameters for a specific student
 */
const getStudentAIParameters = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        const { studentId } = req.params;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
            res.status(400).json({ error: 'Invalid student ID' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId).select('aiParameters studentsId');
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        // Verify student belongs to this coach
        if (!coach.studentsId.some(id => id.toString() === studentId)) {
            res.status(403).json({ error: 'Student not found in your student list' });
            return;
        }
        const parameters = coach.aiParameters?.[studentId] || '';
        res.json({ parameters });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStudentAIParameters = getStudentAIParameters;
/**
 * Get video analyses for a specific student (live footage summaries)
 */
const getStudentVideoAnalyses = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        const { studentId } = req.params;
        const { type, limit = 50 } = req.query;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
            res.status(400).json({ error: 'Invalid student ID' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId);
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        // Verify student belongs to this coach
        if (!coach.studentsId.some(id => id.toString() === studentId)) {
            res.status(403).json({ error: 'Student not found in your student list' });
            return;
        }
        // Build query
        const query = {
            userId: studentId,
            coachId: coachId,
            coachVisible: true,
        };
        if (type === 'live' || type === 'uploaded') {
            query.type = type;
        }
        // For uploaded videos, check student permission
        if (type === 'uploaded') {
            query.studentPermission = true;
        }
        // Get video analyses
        const analyses = await VideoAnalysis_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .lean();
        res.json({ analyses });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStudentVideoAnalyses = getStudentVideoAnalyses;
/**
 * Get uploaded videos for a specific student (with permission)
 */
const getStudentVideos = async (req, res) => {
    try {
        const authReq = req;
        const coachId = authReq.user?.id;
        const { studentId } = req.params;
        const { limit = 50 } = req.query;
        if (!coachId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
            res.status(400).json({ error: 'Invalid student ID' });
            return;
        }
        const coach = await Coach_1.default.findById(coachId);
        if (!coach) {
            res.status(404).json({ error: 'Coach not found' });
            return;
        }
        // Verify student belongs to this coach
        if (!coach.studentsId.some(id => id.toString() === studentId)) {
            res.status(403).json({ error: 'Student not found in your student list' });
            return;
        }
        // Get uploaded videos that student has given permission to view
        const videos = await VideoAnalysis_1.default.find({
            userId: studentId,
            coachId: coachId,
            type: 'uploaded',
            videoUrl: { $ne: null },
            studentPermission: true,
            coachVisible: true,
        })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .lean();
        res.json({ videos });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStudentVideos = getStudentVideos;
//# sourceMappingURL=coachController.js.map