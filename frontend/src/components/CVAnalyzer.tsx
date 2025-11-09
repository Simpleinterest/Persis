import React, { useEffect, useRef, useState } from 'react';
import { Pose, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { ExerciseAnalyzer, AnalysisResult } from '../logic/analyzers';
import cvService from '../services/cvService'; // Assuming this is your file for drawing

// Define the props interface to accept an analyzer
interface CVAnalyzerProps {
  analyzer: ExerciseAnalyzer;
}

// Define the LandmarkMap type (copied from analyzers.ts for convenience)
type LandmarkMap = { [key: number]: { x: number, y: number, z: number, visibility?: number } };

const CVAnalyzer: React.FC<CVAnalyzerProps> = ({ analyzer }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);

  // State for the UI overlay
  const [feedback, setFeedback] = useState('Initializing...');
  const [stage, setStage] = useState('IDLE');
  const [counter, setCounter] = useState(0);

  // Refs for performance optimizations
  const lastAnalysisTime = useRef(0);
  const ANALYSIS_INTERVAL_MS = 100; // 10 FPS
  const smoothedLandmarksRef = useRef<LandmarkMap | null>(null);

  useEffect(() => {
    // Initialize MediaPipe
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // The "onResults" function with all optimizations
    const onResults = (results: Results) => {
      if (!canvasRef.current || !videoRef.current) {
        return;
      }

      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext('2d')!;

      // Ensure canvas dimensions match the video/image
      if (canvasElement.width !== results.image.width || canvasElement.height !== results.image.height) {
        canvasElement.width = results.image.width;
        canvasElement.height = results.image.height;
      }

      // 1. DRAW RAW VIDEO (FAST)
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.scale(-1, 1); // Mirror
      canvasCtx.translate(-canvasElement.width, 0);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      // 2. LANDMARK SMOOTHING (FAST - 60x/sec)
      const ALPHA = 0.4;
      let smoothedLandmarks: LandmarkMap | null = null;
      let landmarkArrayForDrawing: any[] = [];

      if (results.poseLandmarks) {
        if (!smoothedLandmarksRef.current) {
          smoothedLandmarksRef.current = {};
          results.poseLandmarks.forEach((landmark, index) => {
            smoothedLandmarksRef.current![index] = { ...landmark };
          });
        } else {
          const lastSmoothed = smoothedLandmarksRef.current;
          const newSmoothed: LandmarkMap = {};

          results.poseLandmarks.forEach((raw, index) => {
            const last = lastSmoothed[index];
            if (!last) {
              newSmoothed[index] = { ...raw };
              return;
            }
            newSmoothed[index] = {
              ...raw,
              x: (ALPHA * raw.x) + ((1 - ALPHA) * last.x),
              y: (ALPHA * raw.y) + ((1 - ALPHA) * last.y),
              z: (ALPHA * raw.z) + ((1 - ALPHA) * last.z),
            };
          });
          smoothedLandmarksRef.current = newSmoothed;
        }
        smoothedLandmarks = smoothedLandmarksRef.current;
        landmarkArrayForDrawing = Object.values(smoothedLandmarks);
      } else {
        smoothedLandmarksRef.current = null;
      }

      // 3. DRAW SKELETON (FAST - 60x/sec)
      if (landmarkArrayForDrawing.length > 0) {
        // You might have this logic in your cvService, which is fine too.
        drawConnectors(canvasCtx, landmarkArrayForDrawing, POSE_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 4,
        });
        drawLandmarks(canvasCtx, landmarkArrayForDrawing, {
          color: '#FF0000',
          lineWidth: 2,
        });
      }
      canvasCtx.restore();

      // 4. THINKING (THROTTLED - 10x/sec)
      const now = Date.now();
      if (now - lastAnalysisTime.current < ANALYSIS_INTERVAL_MS) {
        return;
      }
      lastAnalysisTime.current = now;

      // 5. RUN ANALYSIS (SLOW - 10x/sec)
      if (smoothedLandmarks) {
        const analysisResults = analyzer.update(smoothedLandmarks);
        setFeedback(analysisResults.feedback);
        setStage(analysisResults.stage);
        setCounter(analysisResults.counter);
      } else {
        setFeedback('Position yourself in frame');
      }
    };

    pose.onResults(onResults);

    // The stable "requestAnimationFrame" loop
    const processFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameId.current = requestAnimationFrame(processFrame);
        return;
      }

      try {
        await pose.send({ image: videoRef.current });
      } catch (error) {
        console.error('Error processing frame:', error);
      }

      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    // Start Webcam & Loop
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.playsInline = true;
          videoRef.current.muted = true;

          videoRef.current.onloadeddata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch((error) => {
                console.error('Error playing video:', error);
              });
              cancelAnimationFrame(animationFrameId.current);
              animationFrameId.current = requestAnimationFrame(processFrame);
            }
          };
        }
      } catch (err) {
        console.error("Error accessing webcam: ", err);
        setFeedback("Please allow camera permissions.");
      }
    };

    startWebcam();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId.current);

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      pose.close();
    };

  }, [analyzer]); // Re-run this effect if the analyzer prop changes

  // The JSX with overlay
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />

      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        fontFamily: 'sans-serif',
        fontSize: '1.2rem',
        zIndex: 10
      }}>
        <div><strong>Reps:</strong> {counter}</div>
        <div><strong>Stage:</strong> {stage}</div>
        <div><strong>Feedback:</strong> {feedback}</div>
      </div>
    </div>
  );
};

export default CVAnalyzer;

