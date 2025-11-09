import { Pose, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResults {
  landmarks: PoseLandmark[];
  image: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement;
}

class CVService {
  private pose: Pose | null = null;
  private isInitialized = false;
  private onResultsCallback: ((results: Results) => void) | null = null;

  async initialize(onResults?: (results: Results) => void): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      if (onResults) {
        this.onResultsCallback = onResults;
        this.pose.onResults(onResults);
      }

      this.isInitialized = true;
      console.log('✅ MediaPipe Pose initialized');
    } catch (error) {
      console.error('Failed to initialize MediaPipe Pose:', error);
      throw error;
    }
  }

  async processFrame(image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement): Promise<void> {
    if (!this.pose || !this.isInitialized) {
      console.warn('MediaPipe Pose not initialized');
      return;
    }

    try {
      await this.pose.send({ image });
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  }

  drawPoseOnCanvas(
    canvas: HTMLCanvasElement,
    results: Results,
    videoElement: HTMLVideoElement
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = videoElement.videoWidth || videoElement.width;
    canvas.height = videoElement.videoHeight || videoElement.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Draw pose landmarks and connections
    if (results.poseLandmarks) {
      ctx.save();
      
      // Draw connections (skeleton)
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 2,
      });

      // Draw landmarks (joints)
      drawLandmarks(ctx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 1,
        radius: 3,
      });

      ctx.restore();
    }
  }

  convertLandmarksToArray(results: Results): PoseLandmark[] {
    if (!results.poseLandmarks) {
      return [];
    }

    return results.poseLandmarks.map((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility,
    }));
  }

  getPoseDescription(results: Results): string {
    if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
      return 'No pose detected';
    }

    const landmarks = results.poseLandmarks;
    const descriptions: string[] = [];

    // Check key body positions
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    // Check if standing
    if (leftAnkle && rightAnkle && leftHip && rightHip) {
      const avgHipY = (leftHip.y + rightHip.y) / 2;
      const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
      if (avgAnkleY > avgHipY) {
        descriptions.push('Standing');
      }
    }

    // Check shoulder alignment
    if (leftShoulder && rightShoulder) {
      const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
      if (shoulderDiff < 0.05) {
        descriptions.push('Shoulders level');
      } else {
        descriptions.push('Shoulders uneven');
      }
    }

    // Check hip alignment
    if (leftHip && rightHip) {
      const hipDiff = Math.abs(leftHip.y - rightHip.y);
      if (hipDiff < 0.05) {
        descriptions.push('Hips level');
      } else {
        descriptions.push('Hips uneven');
      }
    }

    return descriptions.length > 0 ? descriptions.join(', ') : 'Pose detected';
  }

  cleanup(): void {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isInitialized = false;
    this.onResultsCallback = null;
  }
}

export const cvService = new CVService();
export default cvService;

