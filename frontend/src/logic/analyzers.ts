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

// ## 1. The NEW Base Class ##
// All exercises will inherit from this
export class ExerciseAnalyzer {
  // -- Child classes MUST override these --
  protected requiredLandmarkIndices: { left: number[], right: number[] } = { left: [], right: [] };
  protected stage: string = "";

  // -- Editable Thresholds (Universal) --
  protected readonly VISIBILITY_THRESHOLD = 0.6;
  protected readonly GRACE_PERIOD_MS = 1500;
  protected readonly VELOCITY_THRESHOLD = 0.1; // Increased from 0.05 to be less strict

  // -- Internal State --
  protected counter: number = 0;
  protected feedback: string = "";
  protected landmarks: LandmarkMap = {}; // For backward compatibility with existing child classes
  protected activeSide: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE'; // Protected for child class access during transition
  protected detectionStartTime: number | null = null; // Protected for child class access during transition
  protected lastValidLandmarks: LandmarkMap | null = null; // Protected for child class access during transition
  protected isJittery: boolean = false; // Protected for child class access during transition

  /**
   * Returns the current state of the analysis.
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
   * This function now handles ALL boilerplate checks.
   */
  update(landmarks: LandmarkMap): AnalysisResult {
    // Store landmarks for backward compatibility
    this.landmarks = landmarks;
    
    // --- 1. Side-Selection Logic ---
    let currentSide: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE';
    const leftVisible = this.requiredLandmarkIndices.left.every(idx => 
      landmarks[idx] && landmarks[idx].visibility !== undefined && landmarks[idx].visibility! > this.VISIBILITY_THRESHOLD
    );
    const rightVisible = this.requiredLandmarkIndices.right.every(idx => 
      landmarks[idx] && landmarks[idx].visibility !== undefined && landmarks[idx].visibility! > this.VISIBILITY_THRESHOLD
    );

    if (this.activeSide === 'LEFT' && leftVisible) {
      currentSide = 'LEFT';
    } else if (this.activeSide === 'RIGHT' && rightVisible) {
      currentSide = 'RIGHT';
    } else if (leftVisible) {
      currentSide = 'LEFT';
    } else if (rightVisible) {
      currentSide = 'RIGHT';
    }

    // --- 2. Grace Period Logic ---
    if (currentSide === 'NONE') {
      this.detectionStartTime = null; 
      this.lastValidLandmarks = null; 
      this.activeSide = 'NONE';
      // Don't reset stage - let child class manage its own initial stage
      this.feedback = "Make sure your full body is visible";
      return this.getResults();
    }

    if (this.detectionStartTime === null) {
      this.detectionStartTime = Date.now();
      this.feedback = "Hold still, detecting...";
      return this.getResults();
    }

    const timeElapsed = Date.now() - this.detectionStartTime;
    if (timeElapsed < this.GRACE_PERIOD_MS) {
      this.feedback = `Stabilizing... (${((this.GRACE_PERIOD_MS - timeElapsed) / 1000).toFixed(1)}s)`;
      return this.getResults();
    }

    // --- 3. Jitter Protection (Handling Side-Switch) ---
    this.isJittery = false;
    if (this.activeSide !== currentSide) {
      this.lastValidLandmarks = null;
      this.activeSide = currentSide; 
      this.feedback = "Switched tracking side. Hold.";
      return this.getResults();
    }

    const primaryHipIndex = this.activeSide === 'LEFT' ? 23 : 24; // Standard hip indices

    if (this.lastValidLandmarks === null) {
      this.lastValidLandmarks = landmarks;
      this.feedback = "Tracking stable. Begin.";
      return this.getResults();
    }

    const oldHip = this.lastValidLandmarks[primaryHipIndex];
    const newHip = landmarks[primaryHipIndex];

    if (!oldHip || !newHip) {
      this.feedback = "Hip not visible";
      return this.getResults();
    }

    const distance = Math.sqrt(
      Math.pow(newHip.x - oldHip.x, 2) + 
      Math.pow(newHip.y - oldHip.y, 2)
    );

    if (distance > this.VELOCITY_THRESHOLD) {
      this.isJittery = true;
    } else {
      this.lastValidLandmarks = landmarks;
    }

    // --- 4. Call Child Logic ---
    if (this.isJittery) {
      this.feedback = "Jitter detected. Hold.";
    } else {
      // This frame is VALID. Run the specific exercise logic.
      this._runExerciseLogic(landmarks, this.activeSide);
    }

    return this.getResults();
  }

  /**
   * The exercise-specific logic. Child classes MUST override this.
   */
  protected _runExerciseLogic(landmarks: LandmarkMap, activeSide: 'LEFT' | 'RIGHT') {
    throw new Error("'_runExerciseLogic' must be implemented by the child class.");
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

  // --- 1. Define required landmarks ---
  protected requiredLandmarkIndices = {
    left: [11, 23, 25, 27, 29, 31], // L_SHOULDER, L_HIP, L_KNEE, L_ANKLE, L_HEEL, L_FOOT_INDEX
    right: [12, 24, 26, 28, 30, 32] // R_SHOULDER, R_HIP, R_KNEE, R_ANKLE, R_HEEL, R_FOOT_INDEX
  };

  // --- 2. Define editable parameters for THIS exercise ---
  private readonly DEPTH_THRESHOLD = 90;
  private readonly UP_THRESHOLD = 160;
  private readonly TORSO_ANGLE_THRESHOLD = 30;

  constructor() {
    super();
    this.stage = "UP";
  }

  /**
   * This is the only logic we need to write!
   * 
   * All checks (jitter, grace period, etc.) have already passed.
   */
  protected _runExerciseLogic(landmarks: LandmarkMap, activeSide: 'LEFT' | 'RIGHT') {
    // --- 1. Get Landmarks ---
    const shoulder = (activeSide === 'LEFT') ? landmarks[11] : landmarks[12];
    const hip = (activeSide === 'LEFT') ? landmarks[23] : landmarks[24];
    const knee = (activeSide === 'LEFT') ? landmarks[25] : landmarks[26];
    const ankle = (activeSide === 'LEFT') ? landmarks[27] : landmarks[28];
    const heel = (activeSide === 'LEFT') ? landmarks[29] : landmarks[30];
    const toe = (activeSide === 'LEFT') ? landmarks[31] : landmarks[32];

    // --- 2. Calculate Angles ---
    const kneeAngle = calculate_angle_2d(hip, knee, ankle);
    const torsoAngle = calculate_vertical_angle(shoulder, hip);

    // --- 3. State Machine (Rep Counting) ---
    if (kneeAngle < this.DEPTH_THRESHOLD) {
      this.stage = "DOWN";
    }
    if (kneeAngle > this.UP_THRESHOLD && this.stage === "DOWN") {
      this.stage = "UP";
      this.counter += 1;
    }

    // --- 4. State-Based Feedback ---
    if (this.stage === "DOWN") {
      // Check 1: Heel Lift (Corrected)
      // We check if the heel's y is higher than the toe's y.
      // A threshold of 0.02 (2% of video height) prevents
      // false positives from small angles.
      if (heel.y < (toe.y - 0.02)) { 
        this.feedback = "Keep your heels down!";
      } 
      // Check 2: Back Angle
      else if (torsoAngle > this.TORSO_ANGLE_THRESHOLD) {
        this.feedback = "Keep your chest up!"; // Bad form
      } 
      // Check 3: Good Form
      else {
        this.feedback = "Good depth!"; // Good form
      }
    } else { // i.e., stage is "UP"
      this.feedback = "Begin Squat"; // Clear feedback
    }
  }
}

// ## 4. The Rowing Analyzer ##
// This implements the logic for analyzing rowing (erg) form.
export class RowingAnalyzer extends ExerciseAnalyzer {

  // --- 1. Define required landmarks (CORE ONLY) ---
  protected requiredLandmarkIndices = {
    left: [11, 23, 25, 27], // SHOULDER, HIP, KNEE, ANKLE
    right: [12, 24, 26, 28]
  };

  // --- 2. Define editable parameters (Hybrid) ---
  
  // -- State Thresholds (Angles) --
  private readonly CATCH_KNEE_ANGLE = 110;  // Max angle for legs "bent"
  private readonly CATCH_ELBOW_ANGLE = 140; // Min angle for arms "straight"
  
  private readonly FINISH_KNEE_ANGLE = 150; // Min angle for legs "straight"
  private readonly FINISH_ELBOW_ANGLE = 100; // Max angle for arms "bent"

  // -- Flaw Thresholds (Positions & Angles) --
  private readonly LEG_STRAIGHT_THRESHOLD = 145; // Angle for "legs not straight yet"
  private readonly ARM_STRAIGHT_THRESHOLD = 130; // Angle for "arms not straight yet"
  // Max allowed hip angle (openness) at the catch
  private readonly CATCH_HIP_ANGLE_MAX = 55;
  
  // Store hip angle at the catch
  private hipAngleAtCatch: number = 75;
  // Store shoulder X position at the catch
  private shoulderXAtCatch: number = 0; 

  constructor() {
    super();
    // Start at CATCH, waiting for the drive
    this.stage = "CATCH"; 
  }

  protected _runExerciseLogic(landmarks: LandmarkMap, activeSide: 'LEFT' | 'RIGHT') {
    // --- 1. Get Landmarks ---
    const shoulder = (activeSide === 'LEFT') ? landmarks[11] : landmarks[12];
    const elbow = (activeSide === 'LEFT') ? landmarks[13] : landmarks[14];
    const wrist = (activeSide === 'LEFT') ? landmarks[15] : landmarks[16];
    const hip = (activeSide === 'LEFT') ? landmarks[23] : landmarks[24];
    const knee = (activeSide === 'LEFT') ? landmarks[25] : landmarks[26];
    const ankle = (activeSide === 'LEFT') ? landmarks[27] : landmarks[28];

    // --- 2. Calculate Angles & Positions ---
    const kneeAngle = calculate_angle_2d(hip, knee, ankle);
    const elbowAngle = calculate_angle_2d(shoulder, elbow, wrist);
    const hipAngle = calculate_angle_2d(shoulder, hip, knee); // Still useful for debug
    this.feedback = ""; // Clear feedback

    // --- 3. State Definitions (Hybrid) ---
    const isAtCatch = kneeAngle < this.CATCH_KNEE_ANGLE && elbowAngle > this.CATCH_ELBOW_ANGLE;
    const isAtFinish = kneeAngle > this.FINISH_KNEE_ANGLE && elbowAngle < this.FINISH_ELBOW_ANGLE;
    
    // Flaw check definitions
    const legsAreBent = kneeAngle < this.LEG_STRAIGHT_THRESHOLD;
    const armsAreBent = elbowAngle < this.ARM_STRAIGHT_THRESHOLD;

    // --- 4. State Machine Logic ---
    
    // STATE 1: At the CATCH
    if (this.stage === "CATCH") {
      
      // --- Static Flaw Check ---
      if (hipAngle > this.CATCH_HIP_ANGLE_MAX) {
        this.feedback = "Lean forward more at the catch!";
      } else {
        this.feedback = "Drive!";
      }
      
      // --- NEW: Exit Condition ---
      // Transition to DRIVING when legs start to extend past the catch
      // We add a small 5-degree buffer to prevent flickering.
      if (kneeAngle > (this.CATCH_KNEE_ANGLE + 5)) {
        this.stage = "DRIVING";
        // Store the shoulder's X position at the start of the drive
        this.shoulderXAtCatch = shoulder.x; 
      }
    }

    // STATE 2: DRIVING
    else if (this.stage === "DRIVING") {
      this.feedback = "Driving...";

      // FLAW 1: Early Arms (Corrected Angle Check)
      // Check if arms are bending *while* legs are still bent
      if (armsAreBent && legsAreBent) {
        this.feedback = "Legs first! (Don't pull arms yet)";
      }
      // FLAW 2: Early Back (Positional Check)
      else if (shoulder.x < (this.shoulderXAtCatch - 0.03) && legsAreBent) {
        this.feedback = "Legs first! (Don't open back yet)";
      }
      
      if (isAtFinish) {
        this.stage = "FINISH";
        this.counter += 1; // Count the rep
      }
    }

    // STATE 3: At the FINISH
    else if (this.stage === "FINISH") {
      this.feedback = "Recovering...";
      
      if (!isAtFinish) {
        this.stage = "RECOVERING";
      }
    }

    // STATE 4: RECOVERING
    else if (this.stage === "RECOVERING") {
      this.feedback = "Recovering...";

      // FLAW 3: Early Body (NEW Positional Check)
      // Check if shoulder X is moving *forward* (a larger X)
      // *while* the arms are still bent.
      if (shoulder.x > (hip.x) && armsAreBent) {
         this.feedback = "Arms away first! (Then body)";
      }
      // FLAW 4: Early Knees (Original check, still good)
      else if (knee.x > hip.x && armsAreBent) {
        this.feedback = "Arms away first! (Don't bend knees yet)";
      }

      if (isAtCatch) {
        this.stage = "CATCH";
      }
    }
    
    // Append debug angles
    this.feedback += ` | K: ${kneeAngle.toFixed(0)} E: ${elbowAngle.toFixed(0)} H: ${hipAngle.toFixed(0)}`;
  }
}

