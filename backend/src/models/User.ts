import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/user.types';

const UserSchema: Schema = new Schema(
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
    },
    bodyWeight: {
      type: Number,
      min: [0, 'Body weight must be a positive number'],
    },
    height: {
      type: Number,
      min: [0, 'Height must be a positive number'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    },
    sports: {
      type: [String],
      default: [],
    },
    age: {
      type: Number,
      min: [0, 'Age must be a positive number'],
      max: [150, 'Age must be a valid number'],
    },
    coachId: {
      type: Schema.Types.ObjectId,
      ref: 'Coach',
      default: null,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// Index for faster queries
UserSchema.index({ userName: 1 });
UserSchema.index({ coachId: 1 });

const User = mongoose.model<IUser>('User', UserSchema);

export default User;

