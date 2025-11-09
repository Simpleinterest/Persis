import mongoose, { Schema } from 'mongoose';

/**
 * Video Analysis Model
 * Stores AI-generated summaries and analysis from live footage and uploaded videos
 */
const VideoAnalysisSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coachId: {
      type: Schema.Types.ObjectId,
      ref: 'Coach',
      default: null,
    },
    type: {
      type: String,
      enum: ['live', 'uploaded'],
      required: true,
    },
    videoUrl: {
      type: String,
      default: null, // For uploaded videos, null for live sessions
    },
    summary: {
      type: String,
      required: true,
    },
    feedback: {
      type: String,
      default: null,
    },
    poseData: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metrics: {
      type: Schema.Types.Mixed,
      default: {}, // Can store form scores, exercise type, etc.
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0,
    },
    coachVisible: {
      type: Boolean,
      default: true, // For live footage, always visible to coach
    },
    studentPermission: {
      type: Boolean,
      default: true, // For uploaded videos, student can grant/revoke permission
    },
    sessionId: {
      type: String,
      default: null, // For grouping multiple analyses from the same session
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
VideoAnalysisSchema.index({ userId: 1, createdAt: -1 });
VideoAnalysisSchema.index({ coachId: 1, createdAt: -1 });
VideoAnalysisSchema.index({ type: 1 });
VideoAnalysisSchema.index({ coachVisible: 1, studentPermission: 1 });

const VideoAnalysis = mongoose.model('VideoAnalysis', VideoAnalysisSchema);

export default VideoAnalysis;

