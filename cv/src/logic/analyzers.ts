import { calculate_angle_2d, calculate_vertical_angle } from '../utils/cvUtils';

// A generic landmark map from MediaPipe
type LandmarkMap = { [key: number]: { x: number, y: number, z: number, visibility?: number } };

// The standard data packet our analyzers will return
export interface AnalysisResult {
  counter: number;
  stage: string;
  feedback: string;
  [key: string]: any; // To allow for extra data
}

// ## 1. The Base Class ##
// All exercises will inherit from this
export class ExerciseAnalyzer {
  protected counter: number = 0;
  protected stage: string = "";
  protected feedback: string = "";
  protected landmarks: LandmarkMap = {};

  /**
   * Returns the current state of the analysis.
   * 
   * Designed to be sent to the React UI or the backend.
   */
  getResults(): AnalysisResult {
    return {
      counter: this.counter,
      stage: this.stage,
      feedback: this.feedback,
    };
  }

  /**
   * Main update loop, called on every frame.
   * 
   * @param landmarks The landmark results from MediaPipe
   * @returns The latest AnalysisResult
   */
  update(landmarks: LandmarkMap): AnalysisResult {
    this.landmarks = landmarks;
    try {
      this._update_logic();
    } catch (e) {
      this.feedback = "Error: Landmarks not visible.";
    }
    return this.getResults();
  }

  /**
   * The exercise-specific logic. MUST be overridden by child classes.
   */
  protected _update_logic() {
    throw new Error("'_update_logic' must be implemented by the child class.");
  }
}

// ## 2. The Sprint Analyzer ##
// This implements the logic for a sprint start.
export class SprintStartAnalyzer extends ExerciseAnalyzer {

  // -- Editable Parameters --
  private readonly SET_HIP_KNEE_ANGLE = 95; // Angle for "SET"
  private readonly DRIVE_LEAN_ANGLE_GOOD = 50; // Max angle for "good" lean
  private readonly DRIVE_LEAN_ANGLE_BAD = 65; // Angle for "bad" (pop up)
  private readonly EXTENSION_THRESHOLD = 165; // Angle for "triple extension"
  // -------------------------

  constructor() {
    super();
    this.stage = "IDLE";
    // Note: MediaPipe landmark indices are needed here
    // We'll use 23 (left hip), 25 (left knee), etc.
  }

  protected _update_logic() {
    // --- Define landmark indices ---
    const L_SHOULDER = 11;
    const L_HIP = 23;
    const L_KNEE = 25;
    const L_ANKLE = 27;
    const L_FOOT_INDEX = 31; // Toe
    const R_HIP = 24;

    // --- Get Landmarks ---
    // Check if all needed landmarks are visible
    const req_landmarks = [L_SHOULDER, L_HIP, L_KNEE, L_ANKLE, L_FOOT_INDEX, R_HIP];
    for (let idx of req_landmarks) {
      if (!this.landmarks[idx]) {
        this.feedback = "Position in frame";
        return; // Exit if we can't see the athlete
      }
    }

    const shoulder = this.landmarks[L_SHOULDER];
    const hip = this.landmarks[L_HIP];
    const knee = this.landmarks[L_KNEE];
    const ankle = this.landmarks[L_ANKLE];
    const toe = this.landmarks[L_FOOT_INDEX];

    // --- Calculate Key Angles (using our 2D optimization) ---
    const hipKneeAngle = calculate_angle_2d(hip, knee, ankle);
    const bodyLeanAngle = calculate_angle_2d(shoulder, hip, knee);

    // --- State Machine Logic ---

    // 1. "IDLE" State: Waiting for the user to get into position
    if (this.stage === "IDLE") {
      this.feedback = "Get into your blocks";
      // Check if hips are high and knee is bent, approx "SET"
      if (hipKneeAngle < (this.SET_HIP_KNEE_ANGLE + 10) && hip.y < shoulder.y) {
        this.stage = "SET";
      }
    }

    // 2. "SET" State: User is in the blocks, waiting for the "go"
    if (this.stage === "SET") {
      this.feedback = "SET";
      
      // How to detect "DRIVE"? 
      // We check for rapid extension of the front leg.
      if (hipKneeAngle > (this.SET_HIP_KNEE_ANGLE + 20)) {
        this.stage = "DRIVE";
      }
    }

    // 3. "DRIVE" State: Analyze the first push
    if (this.stage === "DRIVE") {
      // Check 1: Body Lean (Back Angle)
      if (bodyLeanAngle > this.DRIVE_LEAN_ANGLE_BAD) {
        this.feedback = "Popping up too fast!";
      } else if (bodyLeanAngle < this.DRIVE_LEAN_ANGLE_GOOD) {
        this.feedback = "Excellent drive angle!";
      } else {
        this.feedback = "Good lean";
      }

      // Check 2: Triple Extension
      // Check the *back* leg (not implemented here, would need to track both)
      // For now, we'll check the front leg's final extension
      if (hipKneeAngle > this.EXTENSION_THRESHOLD) {
        this.feedback += " Full Extension!";
        this.stage = "IDLE"; // Reset after one rep
        this.counter += 1; // Count one "rep"
      }
    }
  }
}

// ## 3. The Squat Analyzer ##
// This implements the logic for analyzing squats.
export class SquatAnalyzer extends ExerciseAnalyzer {

  // -- Editable Parameters --
  private readonly DEPTH_THRESHOLD = 100; // Angle for a rep to count
  private readonly UP_THRESHOLD = 160;    // Angle to be considered "standing up"
  private readonly BACK_ANGLE_THRESHOLD = 150; // The *minimum* angle for good back form
  private readonly TORSO_ANGLE_THRESHOLD = 45; // Max allowed forward lean
  private readonly VISIBILITY_THRESHOLD = 0.6; // Confidence threshold for landmarks
  private readonly GRACE_PERIOD_MS = 1500; // 1.5 seconds
  private detectionStartTime: number | null = null;
  private lastValidLandmarks: LandmarkMap | null = null;
  private readonly VELOCITY_THRESHOLD = 0.1; // Max allowed distance (normalized)
  private activeSide: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE';
  // -------------------------

  constructor() {
    super();
    this.stage = "UP"; 
  }

  protected _update_logic() {
    // --- 1. Define ALL Landmarks (Left and Right) ---
    const L_SHOULDER = 11, R_SHOULDER = 12;
    const L_HIP = 23, R_HIP = 24;
    const L_KNEE = 25, R_KNEE = 26;
    const L_ANKLE = 27, R_ANKLE = 28;

    const REQ_LANDMARKS_LEFT = [L_SHOULDER, L_HIP, L_KNEE, L_ANKLE];
    const REQ_LANDMARKS_RIGHT = [R_SHOULDER, R_HIP, R_KNEE, R_ANKLE];

    // --- 2. Side-Selection Logic ---
    let hip: { x: number; y: number; z: number; visibility?: number } | undefined;
    let knee: { x: number; y: number; z: number; visibility?: number } | undefined;
    let ankle: { x: number; y: number; z: number; visibility?: number } | undefined;
    let shoulder: { x: number; y: number; z: number; visibility?: number } | undefined;
    let primaryHipIndex: number | undefined;
    let currentSide: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE';

    // Check visibility of the LEFT side
    const leftVisible = REQ_LANDMARKS_LEFT.every(idx => 
      this.landmarks[idx] && this.landmarks[idx].visibility !== undefined && this.landmarks[idx].visibility! > this.VISIBILITY_THRESHOLD
    );

    // Check visibility of the RIGHT side
    const rightVisible = REQ_LANDMARKS_RIGHT.every(idx => 
      this.landmarks[idx] && this.landmarks[idx].visibility !== undefined && this.landmarks[idx].visibility! > this.VISIBILITY_THRESHOLD
    );

    // Prioritize the currently active side, then left, then right.
    if (this.activeSide === 'LEFT' && leftVisible) {
      currentSide = 'LEFT';
    } else if (this.activeSide === 'RIGHT' && rightVisible) {
      currentSide = 'RIGHT';
    } else if (leftVisible) {
      currentSide = 'LEFT';
    } else if (rightVisible) {
      currentSide = 'RIGHT';
    }

    // --- 3. Grace Period & Stability Logic ---
    if (currentSide === 'NONE') {
      this.detectionStartTime = null; 
      this.lastValidLandmarks = null; 
      this.activeSide = 'NONE';
      this.stage = "UP";
      this.feedback = "Make sure your full body is visible (side view)";
      return;
    }

    if (this.detectionStartTime === null) {
      this.detectionStartTime = Date.now();
      this.feedback = "Hold still, detecting...";
      return;
    }

    const timeElapsed = Date.now() - this.detectionStartTime;
    if (timeElapsed < this.GRACE_PERIOD_MS) {
      this.feedback = `Stabilizing... (${((this.GRACE_PERIOD_MS - timeElapsed) / 1000).toFixed(1)}s)`;
      return;
    }

    // --- 4. Jitter Protection (Handling Side-Switch) ---
    if (this.activeSide !== currentSide) {
      this.lastValidLandmarks = null;
      this.activeSide = currentSide; 
      this.feedback = "Switched tracking side. Hold.";
      return;
    }

    if (this.activeSide === 'LEFT') {
      shoulder = this.landmarks[L_SHOULDER];
      hip = this.landmarks[L_HIP];
      knee = this.landmarks[L_KNEE];
      ankle = this.landmarks[L_ANKLE];
      primaryHipIndex = L_HIP;
    } else { // 'RIGHT'
      shoulder = this.landmarks[R_SHOULDER];
      hip = this.landmarks[R_HIP];
      knee = this.landmarks[R_KNEE];
      ankle = this.landmarks[R_ANKLE];
      primaryHipIndex = R_HIP;
    }

    if (this.lastValidLandmarks === null) {
      this.lastValidLandmarks = this.landmarks;
      this.feedback = "Tracking stable. Begin squat.";
      return;
    }

    if (primaryHipIndex === undefined) {
      this.feedback = "Make sure your full body is visible (side view)";
      return;
    }

    const oldHip = this.lastValidLandmarks[primaryHipIndex];
    const newHip = this.landmarks[primaryHipIndex];

    if (!oldHip || !newHip) {
      this.feedback = "Make sure your full body is visible (side view)";
      return;
    }

    const distance = Math.sqrt(
      Math.pow(newHip.x - oldHip.x, 2) + 
      Math.pow(newHip.y - oldHip.y, 2)
    );

    if (distance > this.VELOCITY_THRESHOLD) {
      this.feedback = "Jitter detected. Hold.";
      return; 
    }

    // --- 5. Run Squat Logic (Frame is VALID) ---
    this.lastValidLandmarks = this.landmarks;

    if (!hip || !knee || !ankle || !shoulder) {
      this.feedback = "Make sure your full body is visible (side view)";
      return;
    }

    const kneeAngle = calculate_angle_2d(hip, knee, ankle);
    const torsoAngle = calculate_vertical_angle(shoulder, hip);

    // --- State Machine (Rep Counting) ---
    if (kneeAngle < this.DEPTH_THRESHOLD) {
      this.stage = "DOWN";
    }
    if (kneeAngle > this.UP_THRESHOLD && this.stage === "DOWN") {
      this.stage = "UP";
      this.counter += 1;
    }

    // --- State-Based Feedback ---
    if (this.stage === "DOWN") {
      if (torsoAngle > this.TORSO_ANGLE_THRESHOLD) {
        this.feedback = "Keep your chest up!"; 
      } else {
        this.feedback = "Good depth!"; 
      }
    } else { // i.e., stage is "UP"
      this.feedback = "Begin Squat"; 
    }
  }
}

