import React, { useState, useRef, useEffect } from 'react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { ExerciseAnalyzer, SquatAnalyzer, RowingAnalyzer } from '../logic/analyzers';

// Convert MediaPipe landmarks array to LandmarkMap
function landmarksToMap(landmarks: any[]): { [key: number]: { x: number, y: number, z: number, visibility?: number } } {
  const map: { [key: number]: { x: number, y: number, z: number, visibility?: number } } = {};
  if (landmarks) {
    landmarks.forEach((landmark, index) => {
      map[index] = {
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility
      };
    });
  }
  return map;
}

const CVAnalyzer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [feedback, setFeedback] = useState<string>('Initializing...');
  const [stage, setStage] = useState<string>('CATCH'); // Initialize to RowingAnalyzer's default stage
  const [counter, setCounter] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const analyzerRef = useRef<ExerciseAnalyzer | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastAnalysisTime = useRef(0);
  const ANALYSIS_INTERVAL_MS = 100; // 10 FPS (1000ms / 10)
  const smoothedLandmarksRef = useRef<any[] | null>(null);

  useEffect(() => {
    // Initialize analyzer
    analyzerRef.current = new RowingAnalyzer();
    // Initialize stage to match the analyzer's initial stage
    setStage(analyzerRef.current.getResults().stage);

    // Initialize MediaPipe Pose
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // Create onResults callback
    const onResults = (results: any) => {
      if (!canvasRef.current || !videoRef.current) {
        return;
      }

      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext('2d');
      
      if (!canvasCtx) return;

      canvasElement.width = results.image.width;
      canvasElement.height = results.image.height;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // --- Mirror the video feed ---
      canvasCtx.scale(-1, 1);
      canvasCtx.translate(-canvasElement.width, 0);
      // --- End mirror ---

      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      // --- LANDMARK SMOOTHING (EMA) ---
      const ALPHA = 0.5; // Smoothing factor. 0.1 = very smooth (laggy), 0.9 = very responsive (jittery)
      let smoothedLandmarks = results.poseLandmarks;

      if (results.poseLandmarks) {
        if (!smoothedLandmarksRef.current) {
          // First frame, just copy the raw landmarks
          smoothedLandmarksRef.current = results.poseLandmarks.map((lm: any) => ({ ...lm }));
        } else {
          // Apply EMA to each landmark
          const lastSmoothed = smoothedLandmarksRef.current;
          const newSmoothed: any[] = [];

          for (let i = 0; i < results.poseLandmarks.length; i++) {
            const raw = results.poseLandmarks[i];
            const last = lastSmoothed[i];

            // If a landmark was lost, just use the raw one
            if (!last) {
              newSmoothed[i] = { ...raw };
              continue;
            }

            // Apply EMA formula
            const smoothedX = (ALPHA * raw.x) + ((1 - ALPHA) * last.x);
            const smoothedY = (ALPHA * raw.y) + ((1 - ALPHA) * last.y);
            const smoothedZ = (ALPHA * raw.z) + ((1 - ALPHA) * last.z);
            
            newSmoothed[i] = {
              ...raw, // Keep visibility, etc.
              x: smoothedX,
              y: smoothedY,
              z: smoothedZ,
            };
          }
          smoothedLandmarksRef.current = newSmoothed;
          smoothedLandmarks = newSmoothed;
        }
      } else {
        // No person detected, reset the smoother
        smoothedLandmarksRef.current = null;
      }
      // --- END SMOOTHING ---

      // --- DRAWING (FAST) ---
      // Use the *smoothedLandmarks* variable now
      if (smoothedLandmarks) {
        drawConnectors(canvasCtx, smoothedLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
        drawLandmarks(canvasCtx, smoothedLandmarks, { color: '#FF0000', lineWidth: 2 });
      }

      // --- THINKING (THROTTLED) ---
      const now = Date.now();
      if (now - lastAnalysisTime.current > ANALYSIS_INTERVAL_MS) {
        lastAnalysisTime.current = now;

        // Use the *smoothedLandmarks* variable for analysis
        if (smoothedLandmarks) {
          // Convert smoothed landmarks to map format and update analyzer
          const landmarkMap = landmarksToMap(smoothedLandmarks);
          const analysisResults = analyzerRef.current!.update(landmarkMap);
          
          // Update React state with analysis results
          setFeedback(analysisResults.feedback);
          setStage(analysisResults.stage);
          setCounter(analysisResults.counter);
        } else {
          // No landmarks detected
          setFeedback('Position yourself in front of the camera');
        }
      }

      canvasCtx.restore();
    };

    pose.onResults(onResults);
    poseRef.current = pose;

    // Start webcam
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });

        if (!videoRef.current) {
          setError('Video element not available');
          return;
        }

        const videoElement = videoRef.current;
        videoElement.srcObject = stream;

        // Wait for video to be ready
        videoElement.onloadedmetadata = () => {
          // Set the video element's display size (optional, but good)
          videoElement.width = videoElement.videoWidth;
          videoElement.height = videoElement.videoHeight;

          // Set the canvas element's size (important)
          const canvasElement = canvasRef.current!;
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
        };

          // Start processing frames only after video is ready
          const processFrame = async () => {
            // Skip if already processing or video not ready
            if (isProcessingRef.current || !videoElement || !poseRef.current || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
              requestAnimationFrame(processFrame);
              return;
            }

            // Validate video dimensions
            if (videoElement.videoWidth <= 0 || videoElement.videoHeight <= 0) {
              requestAnimationFrame(processFrame);
              return;
            }

            // Validate video element is valid
            if (!videoElement.srcObject) {
              requestAnimationFrame(processFrame);
              return;
            }

            try {
              isProcessingRef.current = true;
              
              // Create a canvas to ensure we're sending a valid image
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = videoElement.videoWidth;
              tempCanvas.height = videoElement.videoHeight;
              const tempCtx = tempCanvas.getContext('2d');
              
              if (tempCtx) {
                tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
                await poseRef.current.send({ image: tempCanvas });
              }
            } catch (err) {
              console.error('Error processing frame:', err);
              // Reset processing flag on error
              isProcessingRef.current = false;
            } finally {
              isProcessingRef.current = false;
            }
            
            // Use setTimeout instead of requestAnimationFrame to limit frame rate
            setTimeout(() => {
              requestAnimationFrame(processFrame);
            }, 33); // ~30 FPS
          };

          // Start processing after a short delay to ensure everything is ready
          setTimeout(() => {
            processFrame();
          }, 100);
        
        setFeedback('Camera ready - Position yourself in frame');
      } catch (err) {
        console.error('Error accessing webcam:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Error: Could not access webcam. ${errorMessage}`);
        setFeedback('Please allow camera permissions and refresh the page.');
      }
    };

    startWebcam();

    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>CV Analyzer - Sprint Start</h1>
      
      {error && (
        <div style={{
          backgroundColor: '#ff6b6b',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          maxWidth: '600px'
        }}>
          {error}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        {/* Hidden video element for webcam feed */}
        <video
          ref={videoRef}
          style={{ display: 'none' }}
          autoPlay
          playsInline
          muted
        />

        {/* Canvas element for displaying video and skeleton */}
        <canvas
          ref={canvasRef}
          style={{
            border: '2px solid #333',
            borderRadius: '8px',
            maxWidth: '100%',
            height: 'auto',
            backgroundColor: '#000',
            display: 'block'
          }}
        />

        {/* Overlay div for feedback, stage, and counter */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            minWidth: '250px',
            zIndex: 10
          }}
        >
          <div style={{ marginBottom: '10px' }}>
            <strong>Stage:</strong> {stage}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Feedback:</strong> {feedback}
          </div>
          <div>
            <strong>Reps:</strong> {counter}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVAnalyzer;

