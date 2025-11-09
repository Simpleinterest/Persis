import mongoose, { Schema } from 'mongoose';
import { ICoach } from '../types/coach.types';

const CoachSchema: Schema = new Schema(
  {
    userName: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
    },
    passWord: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    studentsId: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    sports: {
      type: [String],
      default: [],
    },
    aiParameters: {
      type: Schema.Types.Mixed,
      default: {}, // Will store { studentId: "parameter string" }
    },
    profile: {
      fullName: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      },
      phoneNumber: {
        type: String,
        trim: true,
      },
      bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
      },
      avatar: {
        type: String,
      },
      specialization: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// Index for faster queries
CoachSchema.index({ userName: 1 });
CoachSchema.index({ studentsId: 1 });

const Coach = mongoose.model<ICoach>('Coach', CoachSchema);

export default Coach;

