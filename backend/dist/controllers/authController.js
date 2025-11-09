"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentCoach = exports.getCurrentUser = exports.loginCoach = exports.registerCoach = exports.loginUser = exports.registerUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const Coach_1 = __importDefault(require("../models/Coach"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
/**
 * Register a new user
 */
const registerUser = async (req, res) => {
    try {
        const { userName, passWord, ...userData } = req.body;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ userName });
        if (existingUser) {
            res.status(400).json({ error: 'Username already exists' });
            return;
        }
        // Hash password
        const hashedPassword = await (0, password_1.hashPassword)(passWord);
        // Create new user
        const user = new User_1.default({
            userName,
            passWord: hashedPassword,
            ...userData,
        });
        await user.save();
        // Generate token
        const token = (0, jwt_1.generateToken)({
            id: user._id.toString(),
            userName: user.userName,
            type: 'user',
        });
        // Remove password from response
        const userResponse = user.toObject();
        const { passWord: _, ...userWithoutPassword } = userResponse;
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: userWithoutPassword,
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.registerUser = registerUser;
/**
 * Login user
 */
const loginUser = async (req, res) => {
    try {
        const { userName, passWord } = req.body;
        if (!userName || !passWord) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        // Find user
        const user = await User_1.default.findOne({ userName });
        if (!user) {
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }
        // Compare password
        const isPasswordValid = await (0, password_1.comparePassword)(passWord, user.passWord);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }
        // Generate token
        const token = (0, jwt_1.generateToken)({
            id: user._id.toString(),
            userName: user.userName,
            type: 'user',
        });
        // Remove password from response
        const userResponse = user.toObject();
        const { passWord: _pw, ...userWithoutPassword } = userResponse;
        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.loginUser = loginUser;
/**
 * Register a new coach
 */
const registerCoach = async (req, res) => {
    try {
        const { userName, passWord, ...coachData } = req.body;
        // Check if coach already exists
        const existingCoach = await Coach_1.default.findOne({ userName });
        if (existingCoach) {
            res.status(400).json({ error: 'Username already exists' });
            return;
        }
        // Hash password
        const hashedPassword = await (0, password_1.hashPassword)(passWord);
        // Create new coach
        const coach = new Coach_1.default({
            userName,
            passWord: hashedPassword,
            ...coachData,
        });
        await coach.save();
        // Generate token
        const token = (0, jwt_1.generateToken)({
            id: coach._id.toString(),
            userName: coach.userName,
            type: 'coach',
        });
        // Remove password from response
        const coachResponse = coach.toObject();
        const { passWord: _pwd, ...coachWithoutPassword } = coachResponse;
        res.status(201).json({
            message: 'Coach registered successfully',
            token,
            coach: coachWithoutPassword,
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.registerCoach = registerCoach;
/**
 * Login coach
 */
const loginCoach = async (req, res) => {
    try {
        const { userName, passWord } = req.body;
        if (!userName || !passWord) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        // Find coach
        const coach = await Coach_1.default.findOne({ userName });
        if (!coach) {
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }
        // Compare password
        const isPasswordValid = await (0, password_1.comparePassword)(passWord, coach.passWord);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }
        // Generate token
        const token = (0, jwt_1.generateToken)({
            id: coach._id.toString(),
            userName: coach.userName,
            type: 'coach',
        });
        // Remove password from response
        const coachResponse = coach.toObject();
        const { passWord: _password, ...coachWithoutPassword } = coachResponse;
        res.json({
            message: 'Login successful',
            token,
            coach: coachWithoutPassword,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.loginCoach = loginCoach;
/**
 * Get current user (for authenticated user routes)
 */
const getCurrentUser = async (req, res) => {
    try {
        const authReq = req; // Type assertion for AuthRequest
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
exports.getCurrentUser = getCurrentUser;
/**
 * Get current coach (for authenticated coach routes)
 */
const getCurrentCoach = async (req, res) => {
    try {
        const authReq = req; // Type assertion for AuthRequest
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
exports.getCurrentCoach = getCurrentCoach;
//# sourceMappingURL=authController.js.map