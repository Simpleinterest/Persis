"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentAIParameters = exports.updateStudentAIParameters = exports.updateCoachProfile = exports.removeSport = exports.addSports = exports.getSports = exports.removeStudent = exports.addStudent = exports.getStudent = exports.getStudents = exports.getCoachProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const Coach_1 = __importDefault(require("../models/Coach"));
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
        res.json({ student });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStudent = getStudent;
/**
 * Add a student to coach's list (student must request first, but for simplicity we'll allow direct addition)
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
//# sourceMappingURL=coachController.js.map