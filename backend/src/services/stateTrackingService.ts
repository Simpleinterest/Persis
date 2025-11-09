/**
 * State Tracking Service
 * Tracks user's exercise state and previous feedback to avoid spam
 */

interface UserState {
  userId: string;
  currentState: string; // e.g., "squatting", "standing", "at_rest", "lifting"
  previousState?: string;
  previousFeedback: string | null;
  lastStateChange: Date;
  lastFeedbackTime: Date | null;
  repetitionCount: number;
  stateHistory: Array<{ state: string; timestamp: Date }>;
}

// In-memory storage for user states (in production, use Redis or database)
const userStates = new Map<string, UserState>();

/**
 * Get or create user state
 */
export const getUserState = (userId: string): UserState => {
  if (!userStates.has(userId)) {
    userStates.set(userId, {
      userId,
      currentState: 'at_rest',
      previousFeedback: null,
      lastStateChange: new Date(),
      lastFeedbackTime: null,
      repetitionCount: 0,
      stateHistory: [{ state: 'at_rest', timestamp: new Date() }],
    });
  }
  return userStates.get(userId)!;
};

/**
 * Detect user state from pose landmarks
 */
export const detectStateFromPose = (landmarks: any[], poseDescription: string): string => {
  if (!landmarks || landmarks.length === 0) {
    return 'no_pose_detected';
  }

  // Convert landmarks to a more usable format
  const landmarkMap: { [key: number]: { x: number; y: number; z?: number } } = {};
  landmarks.forEach((lm: any, index: number) => {
    if (typeof lm === 'object' && lm.x !== undefined && lm.y !== undefined) {
      landmarkMap[index] = lm;
    } else if (Array.isArray(lm) && lm.length >= 2) {
      landmarkMap[index] = { x: lm[0], y: lm[1], z: lm[2] || 0 };
    }
  });

  // MediaPipe Pose landmark indices (simplified detection)
  // Key points: 11=left_shoulder, 12=right_shoulder, 23=left_hip, 24=right_hip, 25=left_knee, 26=right_knee
  const leftShoulder = landmarkMap[11];
  const rightShoulder = landmarkMap[12];
  const leftHip = landmarkMap[23];
  const rightHip = landmarkMap[24];
  const leftKnee = landmarkMap[25];
  const rightKnee = landmarkMap[26];

  // Simple state detection based on key point positions
  if (!leftHip || !rightHip || !leftKnee || !rightKnee) {
    return 'pose_incomplete';
  }

  // Calculate approximate body position
  const avgHipY = (leftHip.y + rightHip.y) / 2;
  const avgKneeY = (leftKnee.y + rightKnee.y) / 2;
  const kneeHipDistance = Math.abs(avgKneeY - avgHipY);

  // Detect squat-like movement (knees bent, hips lower)
  if (kneeHipDistance < 0.15 && avgHipY > 0.6) {
    return 'squatting_down';
  } else if (kneeHipDistance < 0.18 && avgHipY > 0.55) {
    return 'squatting_bottom';
  } else if (kneeHipDistance < 0.20 && avgHipY < 0.55) {
    return 'squatting_up';
  } else if (kneeHipDistance > 0.25 && avgHipY < 0.5) {
    return 'standing';
  }

  // Check for other exercises based on pose description
  const descLower = poseDescription.toLowerCase();
  if (descLower.includes('push') || descLower.includes('press')) {
    return 'pushing';
  } else if (descLower.includes('pull') || descLower.includes('row')) {
    return 'pulling';
  } else if (descLower.includes('lift') || descLower.includes('raise')) {
    return 'lifting';
  }

  // Default state
  return 'active';
};

/**
 * Update user state
 */
export const updateUserState = (userId: string, newState: string): boolean => {
  const userState = getUserState(userId);
  const stateChanged = userState.currentState !== newState;

  if (stateChanged) {
    userState.previousState = userState.currentState;
    userState.currentState = newState;
    userState.lastStateChange = new Date();

    // Add to history (keep last 10 states)
    userState.stateHistory.push({ state: newState, timestamp: new Date() });
    if (userState.stateHistory.length > 10) {
      userState.stateHistory.shift();
    }

    // Increment repetition count for squat-like movements
    if (
      (newState === 'squatting_down' && userState.previousState === 'standing') ||
      (newState === 'standing' && userState.previousState === 'squatting_up')
    ) {
      userState.repetitionCount++;
    }
  }

  return stateChanged;
};

/**
 * Check if feedback should be provided
 */
export const shouldProvideFeedback = (
  userId: string,
  newFeedback: string,
  minTimeBetweenFeedback: number = 5000 // 5 seconds minimum
): boolean => {
  const userState = getUserState(userId);
  const now = new Date();

  // Don't provide feedback if it's the same as the previous feedback
  if (userState.previousFeedback && 
      userState.previousFeedback.toLowerCase().trim() === newFeedback.toLowerCase().trim()) {
    return false;
  }

  // Don't provide feedback if it's too soon after the last feedback
  if (userState.lastFeedbackTime) {
    const timeSinceLastFeedback = now.getTime() - userState.lastFeedbackTime.getTime();
    if (timeSinceLastFeedback < minTimeBetweenFeedback) {
      return false;
    }
  }

  return true;
};

/**
 * Record feedback
 */
export const recordFeedback = (userId: string, feedback: string): void => {
  const userState = getUserState(userId);
  userState.previousFeedback = feedback;
  userState.lastFeedbackTime = new Date();
};

/**
 * Get state context for AI
 */
export const getStateContext = (userId: string): string => {
  const userState = getUserState(userId);
  const context = [
    `Current State: ${userState.currentState}`,
    `Repetition Count: ${userState.repetitionCount}`,
    `Last State Change: ${userState.lastStateChange.toISOString()}`,
  ];

  if (userState.previousState) {
    context.push(`Previous State: ${userState.previousState}`);
  }

  if (userState.stateHistory.length > 1) {
    const recentStates = userState.stateHistory.slice(-3).map(s => s.state).join(' → ');
    context.push(`Recent States: ${recentStates}`);
  }

  return context.join('\n');
};

/**
 * Reset user state (e.g., when workout ends)
 */
export const resetUserState = (userId: string): void => {
  userStates.delete(userId);
};

/**
 * Clear old states (cleanup for memory management)
 */
export const clearOldStates = (maxAge: number = 3600000): void => {
  // Clear states older than maxAge (default 1 hour)
  const now = new Date();
  for (const [userId, state] of userStates.entries()) {
    if (state.lastStateChange.getTime() + maxAge < now.getTime()) {
      userStates.delete(userId);
    }
  }
};

