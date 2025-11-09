import React, { useState, useEffect, useRef } from 'react';
import websocketService from '../../services/websocketService';
import authService from '../../services/authService';
import userService from '../../services/userService';
import { Message, AIResponse, VideoAnalysis } from '../../types/chat.types';
import Sidebar from '../../components/layout/Sidebar';
import cvService from '../../services/cvService';
import { Results } from '@mediapipe/pose';
import CVAnalyzer from '../../components/CVAnalyzer';
import { ExerciseAnalyzer, SquatAnalyzer, RowingAnalyzer, SimplePoseAnalyzer } from '../../logic/analyzers';
import './AICoachChat.css';

const AICoachChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedAnalyzer, setSelectedAnalyzer] = useState<ExerciseAnalyzer | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cvFrameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const streamingMessageIndexRef = useRef<number>(-1);
  const poseResultsRef = useRef<Results | null>(null);
  const lastAnalysisTimeRef = useRef<number>(0);
  const [poseDescription, setPoseDescription] = useState<string>('No pose detected');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [allowCoachView, setAllowCoachView] = useState(true);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [exerciseType, setExerciseType] = useState<string>('general');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showExerciseTypeModal, setShowExerciseTypeModal] = useState(false);
  // Refs for accessing current values in intervals
  const exerciseTypeRef = useRef<string>('general');
  const sessionStartTimeRef = useRef<Date | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Connect to WebSocket - use a ref to prevent multiple connections
    let isMounted = true;
    
    try {
      if (!authService.isAuthenticated()) {
        console.error('User not authenticated');
        // Redirect handled by ProtectedRoute
        return;
      }

      // Only connect if not already connected
      if (!websocketService.isConnected()) {
        const socket = websocketService.connect();
        if (isMounted) {
          setIsConnected(true);
        }
      } else {
        setIsConnected(true);
      }

      // Get user once at the beginning
      const user = authService.getStoredUser();
      
      // Generate AI room ID (user-ai:userId:ai-coach)
      // Backend generates: user-ai:${sortedIds.join(':')}
      let currentRoomId: string | null = null;
      if (user) {
        const userId = (user as any)._id;
        // Sort IDs to match backend format
        const sortedIds = [userId, 'ai-coach'].sort();
        currentRoomId = `user-ai:${sortedIds.join(':')}`;
        setRoomId(currentRoomId);
        
        // Join AI room
        websocketService.joinRoom(currentRoomId, (data) => {
          console.log('Joined AI room:', data.roomId);
        });
      }

      // Message handler - skip if this is a streaming message we're already handling
      const handleMessage = (message: Message) => {
        setMessages((prev) => {
          // Check if message already exists (might be from streaming)
          const exists = prev.some(msg => msg.id === message.id);
          if (exists) {
            // Message already exists, don't add duplicate
            return prev;
          }
          // Also skip if this is the currently streaming message
          if (message.id === streamingMessageIdRef.current) {
            return prev;
          }
          // New message, add it
          return [...prev, message];
        });
      };

      // AI response handler (for non-streaming responses)
      const handleAIResponse = (response: AIResponse) => {
        console.log('AI Response:', response);
      };

      // Streaming AI response handlers - use refs declared above
      const handleAIResponseStart = (data: { messageId: string; timestamp: Date }) => {
        streamingMessageIdRef.current = data.messageId;
        // Create placeholder message for streaming
        const placeholderMessage: Message = {
          id: data.messageId,
          from: 'ai-coach',
          to: (user as any)?._id || '',
          message: '',
          timestamp: data.timestamp,
          type: 'text',
        };
        setMessages((prev) => {
          const newMessages = [...prev, placeholderMessage];
          streamingMessageIndexRef.current = newMessages.length - 1;
          return newMessages;
        });
      };

      const handleAIResponseChunk = (data: { messageId: string; chunk: string; message: string }) => {
        if (data.messageId === streamingMessageIdRef.current && streamingMessageIndexRef.current >= 0) {
          // Update the streaming message
          setMessages((prev) => {
            const updated = [...prev];
            const idx = streamingMessageIndexRef.current;
            if (updated[idx] && updated[idx].id === data.messageId) {
              updated[idx] = {
                ...updated[idx],
                message: data.message,
              };
            }
            return updated;
          });
        }
      };

      const handleAIResponseComplete = (data: { messageId: string; message: string; timestamp: Date }) => {
        if (data.messageId === streamingMessageIdRef.current && streamingMessageIndexRef.current >= 0) {
          // Finalize the message
          setMessages((prev) => {
            const updated = [...prev];
            const idx = streamingMessageIndexRef.current;
            if (updated[idx] && updated[idx].id === data.messageId) {
              updated[idx] = {
                ...updated[idx],
                message: data.message,
                timestamp: data.timestamp,
              };
            }
            return updated;
          });
        }
        streamingMessageIdRef.current = null;
        streamingMessageIndexRef.current = -1;
      };

      const handleAIResponseError = (data: { messageId: string; error: string }) => {
        console.error('AI Response Error:', data.error);
        if (data.messageId === streamingMessageIdRef.current && streamingMessageIndexRef.current >= 0) {
          // Update message with error
          setMessages((prev) => {
            const updated = [...prev];
            const idx = streamingMessageIndexRef.current;
            if (updated[idx] && updated[idx].id === data.messageId) {
              updated[idx] = {
                ...updated[idx],
                message: `Error: ${data.error}`,
              };
            }
            return updated;
          });
        }
        streamingMessageIdRef.current = null;
        streamingMessageIndexRef.current = -1;
      };

      // Video analysis handler
      const handleVideoAnalysis = (analysis: VideoAnalysis) => {
        console.log('Video Analysis:', analysis);
        if (analysis.analysis.formFeedback && user) {
          const analysisMessage: Message = {
            id: `analysis-${Date.now()}`,
            from: 'ai-coach',
            to: (user as any)?._id || '',
            message: `Video Analysis (${analysis.type}):\n${analysis.analysis.formFeedback}`,
            timestamp: new Date(),
            type: 'video',
          };
          setMessages((prev) => [...prev, analysisMessage]);
        }
      };

      // Connection status handler
      const handleConnectionStatus = (data: { status: string; message?: string }) => {
        console.log('Connection status:', data);
        if (data.status === 'connected') {
          setIsConnected(true);
        }
      };

      // Error handler
      const handleError = (error: { error: string }) => {
        console.error('Socket error:', error);
      };

      // Set up event listeners
      websocketService.onMessage(handleMessage);
      websocketService.onAIResponse(handleAIResponse);
      websocketService.onAIResponseStart(handleAIResponseStart);
      websocketService.onAIResponseChunk(handleAIResponseChunk);
      websocketService.onAIResponseComplete(handleAIResponseComplete);
      websocketService.onAIResponseError(handleAIResponseError);
      websocketService.onVideoAnalysis(handleVideoAnalysis);
      websocketService.onConnectionStatus(handleConnectionStatus);
      websocketService.onError(handleError);

      // Add welcome message
      if (user) {
        const welcomeMessage: Message = {
          id: 'welcome',
          from: 'ai-coach',
          to: (user as any)?._id || '',
          message: "Hello! I'm your AI fitness coach. I can help you with form checks, workout advice, and training plans. Turn on Live Mode to get real-time form corrections during your workout!",
          timestamp: new Date(),
          type: 'text',
        };
        setMessages([welcomeMessage]);
      }

      return () => {
        isMounted = false;
        websocketService.offMessage(handleMessage);
        websocketService.offAIResponse(handleAIResponse);
        websocketService.offAIResponseStart(handleAIResponseStart);
        websocketService.offAIResponseChunk(handleAIResponseChunk);
        websocketService.offAIResponseComplete(handleAIResponseComplete);
        websocketService.offAIResponseError(handleAIResponseError);
        websocketService.offVideoAnalysis(handleVideoAnalysis);
        websocketService.offConnectionStatus(handleConnectionStatus);
        websocketService.offError(handleError);
        if (currentRoomId) {
          websocketService.leaveRoom(currentRoomId);
        }
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }, []); // Empty dependency array - only run once

  // Initialize CV service on mount
  useEffect(() => {
    const initializeCV = async () => {
      try {
        await cvService.initialize((results: Results) => {
          poseResultsRef.current = results;
          
          // Draw pose on canvas when in live mode
          // Check isLiveMode via ref or state - use a check that works
          if (canvasRef.current && videoRef.current && results.poseLandmarks) {
            // Only draw if video is playing (indicates live mode is active)
            if (videoRef.current.readyState >= 2 && !videoRef.current.paused) {
              cvService.drawPoseOnCanvas(canvasRef.current, results, videoRef.current);
              
              // Update pose description for display
              const description = cvService.getPoseDescription(results);
              setPoseDescription(description);
            }
          } else if (canvasRef.current && videoRef.current) {
            // Clear canvas and update description if no pose detected
            if (videoRef.current.readyState >= 2 && !videoRef.current.paused) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                // Redraw video frame without pose overlay
                ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
              }
              setPoseDescription('No pose detected - Position yourself in front of the camera');
            }
          }
        });
        console.log('✅ CV service initialized');
      } catch (error) {
        console.error('Failed to initialize CV service:', error);
      }
    };

    initializeCV();

    return () => {
      cvService.cleanup();
    };
  }, []); // Run once on mount

  // Effect to handle video stream when live mode is enabled
  useEffect(() => {
    if (!isLiveMode || !streamRef.current) {
      // Stop CV processing when live mode is off
      if (cvFrameIntervalRef.current) {
        clearInterval(cvFrameIntervalRef.current);
        // Clear analysis interval if it exists
        if ((cvFrameIntervalRef.current as any).analysisInterval) {
          clearInterval((cvFrameIntervalRef.current as any).analysisInterval);
        }
        cvFrameIntervalRef.current = null;
      }
      return;
    }

    // Use a small delay to ensure video element is rendered
    const timer = setTimeout(() => {
      if (videoRef.current && streamRef.current) {
        console.log('Attaching stream to video element');
        // Ensure video element has the stream
        if (videoRef.current.srcObject !== streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
        
        // Set video properties
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        
        // Wait for video metadata, then play
        const handleLoadedMetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                console.log('Video playing successfully');
                // Start CV processing once video is playing
                if (cvFrameIntervalRef.current) {
                  clearInterval(cvFrameIntervalRef.current);
                  if ((cvFrameIntervalRef.current as any).analysisInterval) {
                    clearInterval((cvFrameIntervalRef.current as any).analysisInterval);
                  }
                }

                // Process frames for pose detection at ~30 FPS
                cvFrameIntervalRef.current = setInterval(() => {
                  if (videoRef.current && videoRef.current.readyState >= 2 && !videoRef.current.paused) {
                    cvService.processFrame(videoRef.current);
                  }
                }, 33); // ~30 FPS

                // Send frames with pose data for AI analysis every 3 seconds
                const currentRoomId = roomId;
                const analysisInterval = setInterval(() => {
                  if (videoRef.current && poseResultsRef.current && currentRoomId && !videoRef.current.paused) {
                    const now = Date.now();
                    // Only send analysis if we have pose data and enough time has passed
                    if (now - lastAnalysisTimeRef.current > 3000) {
                      if (videoRef.current && poseResultsRef.current && currentRoomId) {
                        try {
                          // Get video frame as image data
                          const canvas = document.createElement('canvas');
                          canvas.width = videoRef.current.videoWidth;
                          canvas.height = videoRef.current.videoHeight;
                          const ctx = canvas.getContext('2d');
                          
                          if (ctx) {
                            ctx.drawImage(videoRef.current, 0, 0);
                            const imageData = canvas.toDataURL('image/jpeg', 0.8);

                            // Get pose landmarks
                            const landmarks = cvService.convertLandmarksToArray(poseResultsRef.current);
                            const poseDesc = cvService.getPoseDescription(poseResultsRef.current);

                            // Send to backend for AI analysis
                            websocketService.sendVideoAnalysis(
                              {
                                image: imageData,
                                landmarks: landmarks,
                                poseDescription: poseDesc,
                                timestamp: new Date().toISOString(),
                              },
                              'form',
                              undefined,
                              currentRoomId
                            );
                          }
                        } catch (error) {
                          console.error('Error sending frame for analysis:', error);
                        }
                      }
                      lastAnalysisTimeRef.current = now;
                    }
                  }
                }, 3000);

                // Store analysis interval
                (cvFrameIntervalRef.current as any).analysisInterval = analysisInterval;
              })
              .catch((error) => {
                console.error('Error playing video:', error);
              });
          }
        };

        if (videoRef.current.readyState >= 2) {
          // Video metadata already loaded
          handleLoadedMetadata();
        } else {
          // Wait for metadata
          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
          // Also try playing immediately as fallback
          videoRef.current.play().catch(() => {
            // Ignore errors here, we'll try again in loadedmetadata handler
          });
        }
      } else {
        console.warn('Video element or stream not available');
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      if (cvFrameIntervalRef.current) {
        clearInterval(cvFrameIntervalRef.current);
        // Clear analysis interval if it exists
        if ((cvFrameIntervalRef.current as any).analysisInterval) {
          clearInterval((cvFrameIntervalRef.current as any).analysisInterval);
        }
        cvFrameIntervalRef.current = null;
      }
    };
  }, [isLiveMode, roomId]); // Run when isLiveMode or roomId changes

  // Start CV processing for pose detection
  const startCVProcessing = () => {
    // Clear any existing intervals
    if (cvFrameIntervalRef.current) {
      clearInterval(cvFrameIntervalRef.current);
      // Clear analysis interval if it exists
      if ((cvFrameIntervalRef.current as any).analysisInterval) {
        clearInterval((cvFrameIntervalRef.current as any).analysisInterval);
      }
    }

    // Process frames for pose detection at ~30 FPS
    cvFrameIntervalRef.current = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2 && !videoRef.current.paused) {
        cvService.processFrame(videoRef.current);
      }
    }, 33); // ~30 FPS
    
    // Send frames with pose data for AI analysis every 5 seconds
    // Use refs to access current values in the interval
    const analysisInterval = setInterval(() => {
      if (videoRef.current && poseResultsRef.current && roomId && !videoRef.current.paused) {
        try {
          // Calculate session duration
          const sessionStart = sessionStartTimeRef.current;
          const duration = sessionStart 
            ? Math.floor((Date.now() - sessionStart.getTime()) / 1000) 
            : 0;

          // Get video frame as image data
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            // Get pose landmarks
            const landmarks = cvService.convertLandmarksToArray(poseResultsRef.current);
            const poseDesc = cvService.getPoseDescription(poseResultsRef.current);

            // Send to backend for AI analysis with session info
            websocketService.sendVideoAnalysis(
              {
                image: imageData,
                landmarks: landmarks,
                poseDescription: poseDesc,
                timestamp: new Date().toISOString(),
                sessionId: currentSessionIdRef.current || `session-${Date.now()}`,
                duration: duration,
              },
              'form',
              exerciseTypeRef.current || 'general',
              roomId
            );
          }
        } catch (error) {
          console.error('Error sending frame for analysis:', error);
        }
      }
    }, 5000); // Send analysis every 5 seconds

    // Store analysis interval
    (cvFrameIntervalRef.current as any).analysisInterval = analysisInterval;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLiveMode]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !roomId) return;

    const messageToSend = inputMessage.trim();
    setInputMessage(''); // Clear input immediately

    // Create user message
    const user = authService.getStoredUser();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      from: (user as any)?._id || '',
      to: 'ai-coach',
      message: messageToSend,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);

    // Send to AI (streaming will be handled by socket handlers)
    websocketService.sendAIChatMessage(messageToSend, roomId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleLiveMode = async () => {
    if (isLiveMode) {
      stopLiveMode();
    } else {
      startLiveMode();
    }
  };

  const handleExerciseSelect = (exercise: 'SQUAT' | 'ROWING' | 'SIMPLE') => {
    let analyzer: ExerciseAnalyzer;

    if (exercise === 'SQUAT') {
      analyzer = new SquatAnalyzer();
    } else if (exercise === 'ROWING') {
      analyzer = new RowingAnalyzer();
    } else {
      analyzer = new SimplePoseAnalyzer();
    }

    setSelectedAnalyzer(analyzer);
    setShowExerciseModal(false);
    setIsLiveMode(true);
  };

  const startLiveMode = async () => {
    try {
      if (!roomId) return;

      // Show exercise type selection modal first
      setShowExerciseTypeModal(true);
    } catch (error) {
      console.error('Failed to start live mode:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  const handleConfirmExerciseType = async () => {
    try {
      if (!roomId) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Default to built-in webcam
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsLiveMode(true);
      setIsStreaming(true);
      
      // Generate session ID and track start time
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const startTime = new Date();
      setCurrentSessionId(sessionId);
      setSessionStartTime(startTime);
      // Update refs for use in intervals
      exerciseTypeRef.current = exerciseType;
      sessionStartTimeRef.current = startTime;
      currentSessionIdRef.current = sessionId;
      
      websocketService.startStream(roomId);

      websocketService.onStreamStarted((data) => {
        console.log('Stream started:', data);
      });
      
      setShowExerciseTypeModal(false);
    } catch (error) {
      console.error('Failed to start live mode:', error);
      alert('Failed to access camera. Please check permissions.');
      setShowExerciseTypeModal(false);
    }
  };

  const stopLiveMode = () => {
    // Clear CV frame interval
    if (cvFrameIntervalRef.current) {
      clearInterval(cvFrameIntervalRef.current);
      // Clear analysis interval if it exists
      if ((cvFrameIntervalRef.current as any).analysisInterval) {
        clearInterval((cvFrameIntervalRef.current as any).analysisInterval);
      }
      cvFrameIntervalRef.current = null;
    }

    // Clear frame interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset session tracking
    setSessionStartTime(null);
    setCurrentSessionId(null);
    setExerciseType('general');
    // Reset refs
    exerciseTypeRef.current = 'general';
    sessionStartTimeRef.current = null;
    currentSessionIdRef.current = null;

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    // Stop stream on server
    if (roomId) {
      websocketService.stopStream(roomId);
    }

    setIsLiveMode(false);
    setIsStreaming(false);
    setPoseDescription('No pose detected');
    setSelectedAnalyzer(null); // Clear the analyzer
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId) return;

    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Video file is too large. Please upload a video smaller than 50MB.');
      return;
    }

    // Store the file and show modal for permission setting
    setPendingVideoFile(file);
    setShowUploadModal(true);
    
    // Reset file input
    e.target.value = '';
  };

  const handleConfirmUpload = async () => {
    const file = pendingVideoFile;
    if (!file || !roomId) {
      setShowUploadModal(false);
      return;
    }

    try {
      setUploadingVideo(true);
      
      // Upload video with permission setting using FormData
      await userService.uploadVideo(file, allowCoachView, 'form', undefined);
      
      // Also send video for real-time analysis via WebSocket (as base64 for WebSocket)
      const reader = new FileReader();
      reader.onload = (event) => {
        const videoData = event.target?.result as string;
        if (videoData) {
          websocketService.sendVideoAnalysis(videoData, 'form', undefined, roomId);
        }
      };
      reader.readAsDataURL(file);
      
      const uploadMessage: Message = {
        id: `upload-${Date.now()}`,
        from: (authService.getStoredUser() as any)?._id || '',
        to: 'ai-coach',
        message: 'Video uploaded for analysis',
        timestamp: new Date(),
        type: 'video',
      };
      setMessages((prev) => [...prev, uploadMessage]);
      
      setShowUploadModal(false);
      setAllowCoachView(true);
      setPendingVideoFile(null);
    } catch (error: any) {
      console.error('Failed to upload video:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setAllowCoachView(true);
    setPendingVideoFile(null);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="ai-coach-chat">
      <Sidebar />
      <div className="chat-main">
        {/* Header - always rendered, hidden only in live mode */}
        {!isLiveMode && (
          <div className="chat-header">
            <div className="header-content">
              <div className="header-text">
                <h1>AI Coach</h1>
                <p className="header-subtitle">Get instant feedback and guidance</p>
              </div>
              <div className="header-actions">
                <button
                  className="live-mode-btn"
                  onClick={() => setShowExerciseModal(true)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="12" r="1" fill="currentColor"/>
                  </svg>
                  <span>Start Live Mode</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Live Mode Button - appears in live mode */}
        {isLiveMode && (
          <div className="live-mode-button-container">
            <button
              className="live-mode-btn live-active stop-live-button"
              onClick={() => {
                setIsLiveMode(false);
                setSelectedAnalyzer(null);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="1" fill="currentColor"/>
              </svg>
              <span>Stop Live Mode</span>
            </button>
          </div>
        )}

        <div className={`chat-content ${isLiveMode ? 'live-mode-active' : ''}`}>
          <div className="live-video-container video-area">
            {/* --- The CV Analyzer --- */}
            {isLiveMode && selectedAnalyzer && (
              <CVAnalyzer analyzer={selectedAnalyzer} />
            )}

            {/* --- The "Live Mode Off" Placeholder --- */}
            {!isLiveMode && (
              <div className="video-placeholder">
                <p>Live Mode is Off. Click "Start Live Mode" to begin.</p>
              </div>
            )}
          </div>

          {/* --- The Exercise Selection Modal --- (Outside container so it's always visible) */}
          {showExerciseModal && (
            <div className="exercise-modal-overlay" style={{ zIndex: 1000 }}>
              <div className="exercise-modal-content">
                <h2>Select an Exercise</h2>
                <p>Choose an exercise to get live feedback.</p>
                <button onClick={() => handleExerciseSelect('SQUAT')}>Squats</button>
                <button onClick={() => handleExerciseSelect('ROWING')}>Rowing</button>
                <button onClick={() => handleExerciseSelect('SIMPLE')}>Other (Simple Pose)</button>
                <button onClick={() => setShowExerciseModal(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Chat Overlay - appears when live mode is active */}
          {isLiveMode && (
            <div className="chat-overlay visible">
              <div className="chat-overlay-messages">
                {messages
                  .filter((message) => message.from === 'ai-coach')
                  .map((message) => (
                    <div
                      key={message.id}
                      className="overlay-message ai-bubble"
                    >
                      <div className="overlay-message-text">{message.message}</div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Regular Chat View - when live mode is off */}
          {!isLiveMode && (
            <>
              <div className="chat-messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.from === 'ai-coach' ? 'ai-message' : 'user-message'}`}
                  >
                    <div className="message-avatar">
                      {message.from === 'ai-coach' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                          <circle cx="9" cy="9" r="2" fill="currentColor"/>
                          <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{message.message}</div>
                      <div className="message-time">{formatTime(message.timestamp)}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-section">
                <div className="preview-label">Preview</div>
                <div className="chat-input-container">
                  <label className="upload-video-btn">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Upload Video</span>
                  </label>
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Ask your AI coach anything..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!isConnected}
                  />
                  <button
                    className="send-button"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || !isConnected}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </button>
                </div>
                <button className="help-button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upload Video Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={handleCancelUpload}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Video</h2>
              <button 
                className="modal-close"
                onClick={handleCancelUpload}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Allow your coach to view this video?</p>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={allowCoachView}
                    onChange={(e) => setAllowCoachView(e.target.checked)}
                  />
                  <span>Share with my coach</span>
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={handleCancelUpload}
                disabled={uploadingVideo}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-submit"
                onClick={handleConfirmUpload}
                disabled={uploadingVideo}
              >
                {uploadingVideo ? 'Uploading...' : 'Upload & Analyze'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Type Selection Modal */}
      {showExerciseTypeModal && (
        <div className="modal-overlay" onClick={() => setShowExerciseTypeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Exercise Type</h2>
              <button 
                className="modal-close"
                onClick={() => setShowExerciseTypeModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                What exercise are you about to perform?
              </p>
              <div className="form-group">
                <label htmlFor="exercise-type">Exercise Type</label>
                <select
                  id="exercise-type"
                  className="exercise-type-select"
                  value={exerciseType}
                  onChange={(e) => {
                    setExerciseType(e.target.value);
                    exerciseTypeRef.current = e.target.value;
                  }}
                >
                  <option value="general">General Exercise</option>
                  <option value="squats">Squats</option>
                  <option value="pushups">Push-ups</option>
                  <option value="planks">Planks</option>
                  <option value="lunges">Lunges</option>
                  <option value="deadlifts">Deadlifts</option>
                  <option value="overhead_press">Overhead Press</option>
                  <option value="bench_press">Bench Press</option>
                  <option value="pullups">Pull-ups</option>
                  <option value="running">Running</option>
                  <option value="yoga">Yoga</option>
                  <option value="stretching">Stretching</option>
                  <option value="cardio">Cardio</option>
                  <option value="strength">Strength Training</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setShowExerciseTypeModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-submit"
                onClick={handleConfirmExerciseType}
              >
                Start Live Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICoachChat;

