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

// ## 1. The Base Class (Fully Optimized) ##
export class ExerciseAnalyzer {
  protected requiredLandmarkIndices: { left: number[], right: number[] } = { left: [], right: [] };
  protected stage: string = "";
  protected defaultStage: string = "UP"; // Default reset stage (can be overridden by child classes)
  protected readonly VISIBILITY_THRESHOLD = 0.6;
  protected readonly GRACE_PERIOD_MS = 1500;
  protected readonly VELOCITY_THRESHOLD = 0.05;
  protected counter: number = 0;
  protected feedback: string = "";
  protected activeSide: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE';
  private detectionStartTime: number | null = null;
  private lastValidLandmarks: LandmarkMap | null = null;
  private isJittery: boolean = false;

  getResults(): AnalysisResult {
    return {
      counter: this.counter,
      stage: this.stage,
      feedback: this.feedback,
    };
  }

  update(landmarks: LandmarkMap): AnalysisResult {
    // --- 1. Side-Selection Logic ---
    let currentSide: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE';
    const leftVisible = this.requiredLandmarkIndices.left.every(idx => 
      landmarks[idx] && landmarks[idx].visibility! > this.VISIBILITY_THRESHOLD
    );
    const rightVisible = this.requiredLandmarkIndices.right.every(idx => 
      landmarks[idx] && landmarks[idx].visibility! > this.VISIBILITY_THRESHOLD
    );

    if (this.activeSide === 'LEFT' && leftVisible) { currentSide = 'LEFT'; }
    else if (this.activeSide === 'RIGHT' && rightVisible) { currentSide = 'RIGHT'; }
    else if (leftVisible) { currentSide = 'LEFT'; }
    else if (rightVisible) { currentSide = 'RIGHT'; }

    // --- 2. Grace Period Logic ---
    if (currentSide === 'NONE') {
      this.detectionStartTime = null; 
      this.lastValidLandmarks = null; 
      this.activeSide = 'NONE';
      this.stage = this.defaultStage; // Reset stage (uses defaultStage which can be overridden)
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

    const primaryHipIndex = this.activeSide === 'LEFT' ? 23 : 24;

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

    const distance = Math.sqrt(Math.pow(newHip.x - oldHip.x, 2) + Math.pow(newHip.y - oldHip.y, 2));

    if (distance > this.VELOCITY_THRESHOLD) {
      this.isJittery = true;
    } else {
      this.isJittery = false;
      this.lastValidLandmarks = landmarks;
    }

    // --- 4. Call Child Logic ---
    if (this.isJittery) {
      this.feedback = "Jitter detected. Hold.";
    } else {
      this._runExerciseLogic(landmarks, this.activeSide);
    }

    return this.getResults();
  }

  protected _runExerciseLogic(landmarks: LandmarkMap, activeSide: 'LEFT' | 'RIGHT') {
    throw new Error("'_runExerciseLogic' must be implemented by the child class.");
  }
}

// ## 2. The SQUAT Analyzer (Tuned) ##
export class SquatAnalyzer extends ExerciseAnalyzer {

  protected requiredLandmarkIndices = {
    left: [11, 23, 25, 27, 29, 31], // L_SHOULDER, L_HIP, L_KNEE, L_ANKLE, L_HEEL, L_TOE
    right: [12, 24, 26, 28, 30, 32]
  };

  private readonly DEPTH_THRESHOLD = 90;
  private readonly UP_THRESHOLD = 160;
  private readonly TORSO_ANGLE_THRESHOLD = 30;

  constructor() {
    super();
    this.stage = "UP";
  }

  protected _runExerciseLogic(landmarks: LandmarkMap, activeSide: 'LEFT' | 'RIGHT') {
    const shoulder = (activeSide === 'LEFT') ? landmarks[11] : landmarks[12];
    const hip = (activeSide === 'LEFT') ? landmarks[23] : landmarks[24];
    const knee = (activeSide === 'LEFT') ? landmarks[25] : landmarks[26];
    const ankle = (activeSide === 'LEFT') ? landmarks[27] : landmarks[28];
    const heel = (activeSide === 'LEFT') ? landmarks[29] : landmarks[30];
    const toe = (activeSide === 'LEFT') ? landmarks[31] : landmarks[32];

    const kneeAngle = calculate_angle_2d(hip, knee, ankle);
    const torsoAngle = calculate_vertical_angle(shoulder, hip);

    if (kneeAngle < this.DEPTH_THRESHOLD) { this.stage = "DOWN"; }
    if (kneeAngle > this.UP_THRESHOLD && this.stage === "DOWN") {
      this.stage = "UP";
      this.counter += 1;
    }

    if (this.stage === "DOWN") {
      if (heel.y < (toe.y - 0.02)) { 
        this.feedback = "Keep your heels down!";
      } else if (torsoAngle > this.TORSO_ANGLE_THRESHOLD) {
        this.feedback = "Keep your chest up!";
      } else {
        this.feedback = "Good depth!";
      }
    } else {
      this.feedback = "Begin Squat";
    }
  }
}

// ## 3. The ROWING Analyzer (Tuned) ##
export class RowingAnalyzer extends ExerciseAnalyzer {

  protected requiredLandmarkIndices = {
    left: [11, 23, 25, 27], // CORE: SHOULDER, HIP, KNEE, ANKLE
    right: [12, 24, 26, 28]
  };

  private readonly CATCH_KNEE_ANGLE = 110;
  private readonly CATCH_ELBOW_ANGLE = 140;
  private readonly FINISH_KNEE_ANGLE = 150;
  private readonly FINISH_ELBOW_ANGLE = 100;
  private readonly LEG_STRAIGHT_THRESHOLD = 145;
  private readonly ARM_STRAIGHT_THRESHOLD = 130;
  private readonly CATCH_HIP_ANGLE_MAX = 80;
  private shoulderXAtCatch: number = 0;

  constructor() {
    super();
    this.stage = "CATCH";
    this.defaultStage = "CATCH"; // Override default reset stage for rowing
  }

  protected _runExerciseLogic(landmarks: LandmarkMap, activeSide: 'LEFT' | 'RIGHT') {
    const shoulder = (activeSide === 'LEFT') ? landmarks[11] : landmarks[12];
    const hip = (activeSide === 'LEFT') ? landmarks[23] : landmarks[24];
    const knee = (activeSide === 'LEFT') ? landmarks[25] : landmarks[26];
    const ankle = (activeSide === 'LEFT') ? landmarks[27] : landmarks[28];

    const ELBOW_I = (activeSide === 'LEFT') ? 13 : 14;
    const WRIST_I = (activeSide === 'LEFT') ? 15 : 16;
    const armsVisible = landmarks[ELBOW_I] && landmarks[ELBOW_I].visibility! > this.VISIBILITY_THRESHOLD &&
                      landmarks[WRIST_I] && landmarks[WRIST_I].visibility! > this.VISIBILITY_THRESHOLD;
    
    const kneeAngle = calculate_angle_2d(hip, knee, ankle);
    const hipAngle = calculate_angle_2d(shoulder, hip, knee);
    let elbowAngle = this.CATCH_ELBOW_ANGLE + 10;

    if (armsVisible) {
      const elbow = landmarks[ELBOW_I];
      const wrist = landmarks[WRIST_I];
      if (elbow && wrist) {
        elbowAngle = calculate_angle_2d(shoulder, elbow, wrist);
      }
    }

    const isAtCatch = kneeAngle < this.CATCH_KNEE_ANGLE && elbowAngle > this.CATCH_ELBOW_ANGLE;
    const isAtFinish = kneeAngle > this.FINISH_KNEE_ANGLE && elbowAngle < this.FINISH_ELBOW_ANGLE;
    const legsAreBent = kneeAngle < this.LEG_STRAIGHT_THRESHOLD;
    const armsAreBent = elbowAngle < this.ARM_STRAIGHT_THRESHOLD;

    this.feedback = "";

    if (this.stage === "CATCH") {
      if (hipAngle > this.CATCH_HIP_ANGLE_MAX) {
        this.feedback = "Lean forward more at the catch!";
      } else {
        this.feedback = "Drive!";
      }
      if (kneeAngle > (this.CATCH_KNEE_ANGLE + 2)) { // Responsive
        this.stage = "DRIVING";
        this.shoulderXAtCatch = shoulder.x; 
      }
    }
    else if (this.stage === "DRIVING") {
      this.feedback = "Driving...";
      if (armsAreBent && legsAreBent) {
        this.feedback = "Legs first! (Don't pull arms yet)";
      } else if (shoulder.x < hip.x && legsAreBent) {
        this.feedback = "Legs first! (Don't open back yet)";
      }
      if (isAtFinish) {
        this.stage = "FINISH";
        this.counter += 1;
      }
    }
    else if (this.stage === "FINISH") {
      this.feedback = "Recovering...";
      if (!isAtFinish) {
        this.stage = "RECOVERING";
      }
    }
    else if (this.stage === "RECOVERING") {
      this.feedback = "Recovering...";
      if (shoulder.x > (hip.x - 0.02) && armsAreBent) {
         this.feedback = "Arms away first! (Then body)";
      } else if (knee.x > hip.x && armsAreBent) {
        this.feedback = "Arms away first! (Don't bend knees yet)";
      }
      if (isAtCatch) {
        this.stage = "CATCH";
      }
    }
    
    this.feedback += ` | K: ${kneeAngle.toFixed(0)} E: ${armsVisible ? elbowAngle.toFixed(0) : 'N/A'} H: ${hipAngle.toFixed(0)}`;
  }
}

// ## 4. The SimplePoseAnalyzer ##
export class SimplePoseAnalyzer extends ExerciseAnalyzer {

  protected requiredLandmarkIndices = {
    left: [23], // L_HIP
    right: [24] // R_HIP
  };

  constructor() {
    super();
    this.stage = "N/A";
  }

  protected _runExerciseLogic(landmarks: LandmarkMap, activeSide: 'LEFT' | 'RIGHT') {
    this.feedback = "Pose tracking active. Begin.";
  }
}
