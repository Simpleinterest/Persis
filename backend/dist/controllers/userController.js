"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCoach = exports.requestCoach = exports.updateUserProfile = exports.getUserProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const Coach_1 = __importDefault(require("../models/Coach"));
const password_1 = require("../utils/password");
const mongoose_1 = __importDefault(require("mongoose"));
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
        const user = await User_1.default.findById(userId).select('-passWord').populate('coachId', 'userName profile');
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
        const { userName, passWord, profile, bodyWeight, height, gender, sports, age, coachId, } = req.body;
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
        if (bodyWeight !== undefined)
            updateData.bodyWeight = bodyWeight;
        if (height !== undefined)
            updateData.height = height;
        if (gender !== undefined)
            updateData.gender = gender;
        if (sports !== undefined)
            updateData.sports = sports;
        if (age !== undefined)
            updateData.age = age;
        if (coachId !== undefined) {
            if (coachId === null) {
                updateData.coachId = null;
            }
            else {
                // Verify coach exists
                const coach = await Coach_1.default.findById(coachId);
                if (!coach) {
                    res.status(404).json({ error: 'Coach not found' });
                    return;
                }
                updateData.coachId = coachId;
            }
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
 * Request to join a coach
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
            res.status(400).json({ error: 'No coach assigned' });
            return;
        }
        const coachId = user.coachId;
        // Remove user from coach's student list
        const coach = await Coach_1.default.findById(coachId);
        if (coach) {
            coach.studentsId = coach.studentsId.filter(id => id.toString() !== userId);
            await coach.save();
        }
        // Remove coach from user
        user.coachId = undefined;
        await user.save();
        res.json({ message: 'Coach removed successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.removeCoach = removeCoach;
//# sourceMappingURL=userController.js.map