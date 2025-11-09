import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.CV_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection (optional - only connects if MONGODB_URI is provided)
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_DATABASE;
  
  if (!mongoURI) {
    console.log('⚠️  No MongoDB URI provided - CV service running without database');
    return;
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('⚠️  MongoDB connection error:', err);
    console.log('⚠️  CV service continuing without database connection');
  }
};

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'CV Service is running' });
});

// Start server
const startServer = async () => {
  // Try to connect to database, but don't block server startup
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 CV Service is running on port ${PORT}`);
  });
};

startServer();

