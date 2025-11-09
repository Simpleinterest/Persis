import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import coachRoutes from './routes/coachRoutes';
import { setupSocketAuth } from './middleware/socketAuth';
import { setupSocketHandlers } from './handlers/socketHandlers';

// Load environment variables
dotenv.config();

// Import models to ensure they are registered
import './models/User';
import './models/Coach';

const app = express();
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const io = new Server(httpServer, {
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

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/auth', authRoutes);

// User routes (protected)
app.use('/api/user', userRoutes);

// Coach routes (protected)
app.use('/api/coach', coachRoutes);

// WebSocket authentication
setupSocketAuth(io);

// WebSocket event handlers
setupSocketHandlers(io);

// Connect to MongoDB and start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Persis API Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready for connections`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, io };

