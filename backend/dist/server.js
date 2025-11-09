"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = __importDefault(require("./config/database"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const coachRoutes_1 = __importDefault(require("./routes/coachRoutes"));
const socketAuth_1 = require("./middleware/socketAuth");
const socketHandlers_1 = require("./handlers/socketHandlers");
// Load environment variables
dotenv_1.default.config();
// Import models to ensure they are registered
require("./models/User");
require("./models/Coach");
require("./models/CoachRequest");
require("./models/VideoAnalysis");
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Authorization"],
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
});
exports.io = io;
const PORT = process.env.PORT || 5001;
// Middleware
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'Persis API Server is running!',
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});
// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});
// Authentication routes
app.use('/api/auth', authRoutes_1.default);
// User routes (protected)
app.use('/api/user', userRoutes_1.default);
// Coach routes (protected)
app.use('/api/coach', coachRoutes_1.default);
// WebSocket authentication
(0, socketAuth_1.setupSocketAuth)(io);
// WebSocket event handlers
(0, socketHandlers_1.setupSocketHandlers)(io);
// Connect to MongoDB and start server
async function startServer() {
    try {
        // Connect to database
        await (0, database_1.default)();
        // Start server
        httpServer.listen(PORT, () => {
            console.log(`🚀 Persis API Server running on port ${PORT}`);
            console.log(`📡 WebSocket server ready for connections`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map