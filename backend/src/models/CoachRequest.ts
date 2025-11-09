import mongoose, { Schema } from 'mongoose';

/**
 * Coach Request Model
 * Tracks requests from coaches to add students
 */
const CoachRequestSchema: Schema = new Schema(
  {
    coachId: {
      type: Schema.Types.ObjectId,
      ref: 'Coach',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
CoachRequestSchema.index({ coachId: 1, studentId: 1 });
CoachRequestSchema.index({ studentId: 1, status: 1 });

// Prevent duplicate pending requests
CoachRequestSchema.index({ coachId: 1, studentId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

const CoachRequest = mongoose.model('CoachRequest', CoachRequestSchema);

export default CoachRequest;

