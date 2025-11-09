import React, { useState, useEffect, useRef } from 'react';
import websocketService from '../../services/websocketService';
import authService from '../../services/authService';
import { Message, AIResponse, VideoAnalysis } from '../../types/chat.types';
import './AICoachChat.css';

const AICoachChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const streamingMessageIndexRef = useRef<number>(-1);

  useEffect(() => {
    // Connect to WebSocket - use a ref to prevent multiple connections
    let isMounted = true;
    
    try {
      if (!authService.isAuthenticated()) {
        console.error('User not authenticated');
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


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const startLiveMode = async () => {
    try {
      if (!roomId) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsLiveMode(true);
      setIsStreaming(true);
      websocketService.startStream(roomId);

      // Send video frames periodically for analysis
      frameIntervalRef.current = setInterval(() => {
        if (videoRef.current && streamRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            ctx.drawImage(videoRef.current, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            websocketService.sendStreamData(roomId, { frame: imageData });
          }
        }
      }, 2000); // Send frame every 2 seconds

      websocketService.onStreamStarted((data) => {
        console.log('Stream started:', data);
      });
    } catch (error) {
      console.error('Failed to start live mode:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  const stopLiveMode = () => {
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

    // Stop stream on server
    if (roomId) {
      websocketService.stopStream(roomId);
    }

    setIsLiveMode(false);
    setIsStreaming(false);
  };

  const handleUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const videoData = event.target?.result;
      if (videoData) {
        // Send video for analysis
        websocketService.sendVideoAnalysis(videoData, 'form', undefined, roomId);
        
        const uploadMessage: Message = {
          id: `upload-${Date.now()}`,
          from: (authService.getStoredUser() as any)?._id || '',
          to: 'ai-coach',
          message: 'Video uploaded for analysis',
          timestamp: new Date(),
          type: 'video',
        };
        setMessages((prev) => [...prev, uploadMessage]);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="ai-coach-chat">
      <div className="chat-header">
        <div className="header-info">
          <div className="ai-avatar">🤖</div>
          <div>
            <h2>AI Coach</h2>
            <p className="status">
              {isConnected ? (
                <span className="online">Online</span>
              ) : (
                <span className="offline">Connecting...</span>
              )}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`live-mode-btn ${isLiveMode ? 'active' : ''}`}
            onClick={toggleLiveMode}
          >
            {isLiveMode ? '🛑 Stop Live Mode' : '📹 Start Live Mode'}
          </button>
          <label className="upload-video-btn">
            <input
              type="file"
              accept="video/*"
              onChange={handleUploadVideo}
              style={{ display: 'none' }}
            />
            📤 Upload Video
          </label>
        </div>
      </div>

      {isLiveMode && (
        <div className="live-video-container">
          <video ref={videoRef} autoPlay muted className="live-video" />
          <div className="live-indicator">
            <span className="pulse"></span>
            Live
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.from === 'ai-coach' ? 'ai-message' : 'user-message'}`}
          >
            <div className="message-avatar">
              {message.from === 'ai-coach' ? '🤖' : '👤'}
            </div>
            <div className="message-content">
              <div className="message-text">{message.message}</div>
              <div className="message-time">{formatTime(message.timestamp)}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
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
          ➤
        </button>
      </div>
    </div>
  );
};

export default AICoachChat;

