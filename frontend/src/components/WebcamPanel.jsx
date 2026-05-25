import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { CameraOff, Scan, AlertCircle } from 'lucide-react';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { useFPS } from '../hooks/useFPS';
import { TrackingWebSocketService } from '../services/websocket';

// Landmark joints connection maps
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky & Palm
];

export default function WebcamPanel({
  processingMode,  // 'client' | 'server'
  showConnections,
  showLabels,
  onHandResults,
  onFPSChange,
  onWSStatusChange,
  isModelLoadingCallback
}) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const wsServiceRef = useRef(null);
  const lastProcessTimeRef = useRef(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  
  // Initialize local MediaPipe
  const { isLoading: isModelLoading, error: modelError, detectHands } = useMediaPipe();
  const [fps, updateFPS] = useFPS();

  // Notify parent of loading state changes
  useEffect(() => {
    if (isModelLoadingCallback) {
      isModelLoadingCallback(isModelLoading);
    }
  }, [isModelLoading, isModelLoadingCallback]);

  // Notify parent of FPS changes
  useEffect(() => {
    if (onFPSChange) {
      onFPSChange(fps);
    }
  }, [fps, onFPSChange]);

  // Draw overlay canvas
  const drawOverlay = useCallback((handsData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!handsData || handsData.length === 0) return;

    handsData.forEach((hand) => {
      const isRightHand = hand.label === 'Right';
      // Cyan for left hand, Green for right hand
      const themeColor = isRightHand ? '#00ff88' : '#66fcf1';
      
      // 1. Draw connections
      if (showConnections) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = themeColor;
        ctx.shadowBlur = 6;
        ctx.shadowColor = themeColor;
        
        HAND_CONNECTIONS.forEach(([start, end]) => {
          const ptA = hand.landmarks[start];
          const ptB = hand.landmarks[end];
          if (ptA && ptB) {
            ctx.moveTo(ptA.x * canvas.width, ptA.y * canvas.height);
            ctx.lineTo(ptB.x * canvas.width, ptB.y * canvas.height);
          }
        });
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
      }

      // 2. Draw landmark points
      hand.landmarks.forEach((lm, idx) => {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, idx === 0 ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = idx === 0 ? '#ffffff' : '#ffffff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = themeColor;
        ctx.fill();

        // Tip rings
        if ([4, 8, 12, 16, 20].includes(idx)) {
          ctx.beginPath();
          ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 8, 0, 2 * Math.PI);
          ctx.strokeStyle = themeColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0;

      // 3. Draw text label
      if (showLabels && hand.landmarks[9]) {
        const mcPoint = hand.landmarks[9];
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Orbitron, sans-serif';
        ctx.fillText(
          `${hand.label.toUpperCase()}`,
          mcPoint.x * canvas.width - 20,
          mcPoint.y * canvas.height - 15
        );
      }
    });
  }, [showConnections, showLabels]);

  // Handle server-side results (FastAPI WS)
  const handleServerMessage = useCallback((data) => {
    updateFPS();
    if (data.success) {
      const formattedHands = data.hands.map((h) => ({
        label: h.label,
        confidence: h.confidence,
        landmarks: h.landmarks
      }));
      onHandResults(formattedHands);
      drawOverlay(formattedHands);
    } else {
      onHandResults([]);
      drawOverlay([]);
    }
  }, [onHandResults, drawOverlay, updateFPS]);

  // Handle WS Connection status
  const handleWSStatusChange = useCallback((status) => {
    setWsStatus(status);
    if (onWSStatusChange) {
      onWSStatusChange(status);
    }
  }, [onWSStatusChange]);

  // Establish or tear down WebSockets based on mode
  useEffect(() => {
    if (processingMode === 'server') {
      wsServiceRef.current = new TrackingWebSocketService();
      wsServiceRef.current.connect(handleServerMessage, handleWSStatusChange);
    } else {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
      handleWSStatusChange('disconnected');
    }

    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
    };
  }, [processingMode, handleServerMessage, handleWSStatusChange]);

  // Main tracking loop
  useEffect(() => {
    const processLoop = async () => {
      const webcam = webcamRef.current;
      const canvas = canvasRef.current;
      
      if (!webcam || !webcam.video || webcam.video.readyState < 2) {
        animationRef.current = requestAnimationFrame(processLoop);
        return;
      }

      // Sync canvas dimensions with video elements
      if (canvas.width !== webcam.video.videoWidth) {
        canvas.width = webcam.video.videoWidth;
        canvas.height = webcam.video.videoHeight;
      }

      if (processingMode === 'client') {
        // Client-side local tracking (runs client-side at max speed)
        const results = detectHands(webcam.video);
        updateFPS();

        if (results && results.landmarks && results.landmarks.length > 0) {
          const formattedHands = results.landmarks.map((landmarks, idx) => ({
            label: results.handednesses[idx][0].displayName || results.handednesses[idx][0].categoryName,
            confidence: results.handednesses[idx][0].score,
            landmarks: landmarks
          }));
          onHandResults(formattedHands);
          drawOverlay(formattedHands);
        } else {
          onHandResults([]);
          drawOverlay([]);
        }
      } else if (processingMode === 'server' && wsStatus === 'connected') {
        // Server-side WebSocket streaming (limit to ~20fps to save bandwidth)
        const now = performance.now();
        if (now - lastProcessTimeRef.current > 50) { // Throttled to ~20 FPS
          lastProcessTimeRef.current = now;

          // Render webcam video to offscreen canvas blob
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = 480; // Compressed frame dimensions
          offscreenCanvas.height = 360;
          const offscreenCtx = offscreenCanvas.getContext('2d');
          
          // Mirror correction if required, otherwise simple draw
          offscreenCtx.drawImage(webcam.video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
          
          offscreenCanvas.toBlob((blob) => {
            if (blob && wsServiceRef.current) {
              wsServiceRef.current.sendFrame(blob);
            }
          }, 'image/jpeg', 0.55); // 55% quality compression
        }
      }

      animationRef.current = requestAnimationFrame(processLoop);
    };

    animationRef.current = requestAnimationFrame(processLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [processingMode, detectHands, updateFPS, onHandResults, drawOverlay, wsStatus]);

  const handleCameraUserMedia = () => {
    setCameraActive(true);
    setCameraError(null);
  };

  const handleCameraError = (err) => {
    console.error("Webcam media access error:", err);
    setCameraActive(false);
    setCameraError("Camera access denied or device not found.");
  };

  return (
    <div className="glass-panel rounded-xl border border-cyber-border/40 overflow-hidden relative aspect-video bg-black/60 shadow-glass">
      
      {/* 1. Video Element & Overlay Canvas */}
      <div className="relative w-full h-full flex items-center justify-center">
        <Webcam
          ref={webcamRef}
          audio={false}
          onUserMedia={handleCameraUserMedia}
          onUserMediaError={handleCameraError}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user"
          }}
          className="absolute w-full h-full object-cover scale-x-[-1]" // mirrored
        />

        <canvas
          ref={canvasRef}
          className="absolute w-full h-full object-cover scale-x-[-1] z-10 pointer-events-none"
        />

        {/* Cyber Scanning Overlay animation */}
        {cameraActive && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
            <div className="w-full h-[2px] scanning-bar absolute top-0 left-0 animate-scan"></div>
            {/* Corner Crosshairs */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyber-cyan/60"></div>
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyber-cyan/60"></div>
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyber-cyan/60"></div>
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyber-cyan/60"></div>
          </div>
        )}
      </div>

      {/* 2. Loading State */}
      {isModelLoading && processingMode === 'client' && (
        <div className="absolute inset-0 bg-cyber-bg/95 flex flex-col items-center justify-center z-20 gap-3">
          <Scan className="w-10 h-10 text-cyber-cyan animate-spin" />
          <p className="font-orbitron text-sm font-bold text-cyber-cyan tracking-widest animate-pulse">
            LOADING MEDIAPIPE MODEL...
          </p>
          <p className="text-[10px] text-cyber-text/50 font-mono">
            Initial setup downloads ~15MB structure. Please wait.
          </p>
        </div>
      )}

      {/* 3. Server Connecting State */}
      {processingMode === 'server' && wsStatus !== 'connected' && (
        <div className="absolute inset-0 bg-cyber-bg/90 flex flex-col items-center justify-center z-20 gap-3">
          <div className={`w-8 h-8 rounded-full border-2 border-t-transparent border-cyber-rose ${wsStatus === 'disconnected' ? 'animate-spin' : ''}`}></div>
          <p className="font-orbitron text-sm font-bold text-cyber-rose tracking-wider">
            {wsStatus === 'error' ? 'BACKEND OFFLINE' : 'ESTABLISHING WEBSOCKET CONNECTION...'}
          </p>
          <p className="text-[10px] text-cyber-text/50 font-mono text-center max-w-[280px]">
            {wsStatus === 'error' 
              ? 'Failed to connect to ws://127.0.0.1:8000. Verify the FastAPI server is running.' 
              : 'Streaming frame pipeline setup.'}
          </p>
        </div>
      )}

      {/* 4. Error Display */}
      {(!cameraActive || cameraError || modelError) && (
        <div className="absolute inset-0 bg-cyber-bg/90 flex flex-col items-center justify-center z-20 p-4 gap-2 text-center">
          <CameraOff className="w-12 h-12 text-cyber-rose animate-bounce" />
          <p className="font-orbitron text-sm font-bold text-cyber-rose uppercase">
            {modelError ? "MediaPipe Engine Error" : "Sensor Error Detected"}
          </p>
          <p className="text-xs text-cyber-text/60 font-mono max-w-[400px]">
            {cameraError || 
             (modelError && `Failed to load MediaPipe: ${modelError.message || modelError.toString()}`) || 
             "Awaiting webcam stream permissions."}
          </p>
        </div>
      )}
    </div>
  );
}
