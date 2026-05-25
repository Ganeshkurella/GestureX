import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, CameraOff, Scan, AlertCircle, Maximize2, Minimize2, Terminal, ShieldAlert, Radio, Activity } from 'lucide-react';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { useFPS } from '../hooks/useFPS';
import { useWebsocket } from '../hooks/useWebsocket';
import { predictGesture } from '../services/api';

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
  isModelLoadingCallback,
  onPredictionResult,
  activePrediction = 'None',
  predictionConfidence = 0.0
}) {
  const containerRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastProcessTimeRef = useRef(0);
  const lastPredictTimeRef = useRef(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hudLogs, setHudLogs] = useState([]);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  // Terminal logging
  const addHudLog = useCallback((msg) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    setHudLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 15));
  }, []);

  // Toggle camera active state and clean up parent logs
  const toggleCamera = useCallback(() => {
    setIsCameraEnabled((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (!next) {
          setCameraActive(false);
          onHandResults([]);
          // Clear canvas
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          if (onPredictionResult) {
            onPredictionResult('None', 0.0, 0);
          }
          addHudLog("OPTICAL CAPTURE SUSPENDED BY OPERATOR");
        } else {
          addHudLog("INITIALIZING LIVE CAPTURE STREAM...");
        }
      }, 0);
      return next;
    });
  }, [onHandResults, onPredictionResult, addHudLog]);
  
  // Reusable custom WebSocket Hook
  const { status: wsStatus, latency: wsLatency, connect, disconnect, sendFrame } = useWebsocket();
  
  // Local MediaPipe Hand Landmarker
  const { isLoading: isModelLoading, error: modelError, detectHands } = useMediaPipe();
  const [fps, updateFPS] = useFPS();

  // Sync WS status back to parent
  useEffect(() => {
    if (onWSStatusChange) {
      onWSStatusChange(wsStatus);
    }
  }, [wsStatus, onWSStatusChange]);

  // Sync loading state to parent
  useEffect(() => {
    if (isModelLoadingCallback) {
      isModelLoadingCallback(isModelLoading);
    }
  }, [isModelLoading, isModelLoadingCallback]);

  // Sync FPS to parent
  useEffect(() => {
    if (onFPSChange) {
      onFPSChange(fps);
    }
  }, [fps, onFPSChange]);

  // Handle browser fullscreen transitions
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      addHudLog(document.fullscreenElement ? "FULLSCREEN HUD MODE ENABLED" : "RESTORED HUD DEFAULT PANEL");
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [addHudLog]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error("Error activating fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Draw overlay canvas including bounding boxes & radar sweeps
  const drawOverlay = useCallback((handsData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!handsData || handsData.length === 0) return;

    handsData.forEach((hand) => {
      const isRightHand = hand.label === 'Right';
      const conf = hand.confidence || 1.0;
      
      // Dynamic tactical colors based on target tracking confidence
      const themeColor = conf >= 0.8 ? '#10b981' : conf >= 0.5 ? '#00f0ff' : '#f5a623';
      
      // 1. Calculate & Draw Bounding Box with Cyberpunk corners (mathematically mirrored X axis)
      const xs = hand.landmarks.map(lm => (1 - lm.x) * canvas.width);
      const ys = hand.landmarks.map(lm => lm.y * canvas.height);
      const minX = Math.min(...xs) - 20;
      const maxX = Math.max(...xs) + 20;
      const minY = Math.min(...ys) - 20;
      const maxY = Math.max(...ys) + 20;
      
      const boxWidth = maxX - minX;
      const boxHeight = maxY - minY;
      
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 4;
      ctx.shadowColor = themeColor;
      
      const cornerLength = Math.min(18, boxWidth * 0.25);
      
      // Top-Left corner bracket
      ctx.beginPath();
      ctx.moveTo(minX + cornerLength, minY);
      ctx.lineTo(minX, minY);
      ctx.lineTo(minX, minY + cornerLength);
      ctx.stroke();
      
      // Top-Right corner bracket
      ctx.beginPath();
      ctx.moveTo(maxX - cornerLength, minY);
      ctx.lineTo(maxX, minY);
      ctx.lineTo(maxX, minY + cornerLength);
      ctx.stroke();
      
      // Bottom-Left corner bracket
      ctx.beginPath();
      ctx.moveTo(minX + cornerLength, maxY);
      ctx.lineTo(minX, maxY);
      ctx.lineTo(minX, maxY - cornerLength);
      ctx.stroke();
      
      // Bottom-Right corner bracket
      ctx.beginPath();
      ctx.moveTo(maxX - cornerLength, maxY);
      ctx.lineTo(maxX, maxY);
      ctx.lineTo(maxX, maxY - cornerLength);
      ctx.stroke();
 
      // Translucent panel fill
      ctx.shadowBlur = 0;
      ctx.fillStyle = conf >= 0.8 
        ? 'rgba(16, 185, 129, 0.02)' 
        : conf >= 0.5 
          ? 'rgba(0, 240, 255, 0.02)' 
          : 'rgba(245, 166, 35, 0.02)';
      ctx.fillRect(minX, minY, boxWidth, boxHeight);

      // Label Bounding Box
      ctx.fillStyle = themeColor;
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.fillText(`TARGET LOCKED: ${hand.label.toUpperCase()}`, minX + 4, minY - 8);
 
      // 2. Draw Palm Radar Sweep centered at middle finger MCP (Landmark 9)
      const palmMCP = hand.landmarks[9];
      if (palmMCP) {
        const cx = (1 - palmMCP.x) * canvas.width;
        const cy = palmMCP.y * canvas.height;
        const radius = 35;
 
        // Outer range circle
        ctx.strokeStyle = `${themeColor}22`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Inner target crosshair
        ctx.strokeStyle = `${themeColor}55`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
        ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
        ctx.stroke();
 
        // Sweeping radar arm
        const sweepAngle = (performance.now() / 250) % (2 * Math.PI);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + radius * Math.cos(sweepAngle), cy + radius * Math.sin(sweepAngle));
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 4;
        ctx.shadowColor = themeColor;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      // 3. Draw connections (mathematically mirrored X axis)
      if (showConnections) {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `${themeColor}cc`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = themeColor;
        
        HAND_CONNECTIONS.forEach(([start, end]) => {
          const ptA = hand.landmarks[start];
          const ptB = hand.landmarks[end];
          if (ptA && ptB) {
            ctx.moveTo((1 - ptA.x) * canvas.width, ptA.y * canvas.height);
            ctx.lineTo((1 - ptB.x) * canvas.width, ptB.y * canvas.height);
          }
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
 
      // 4. Draw landmark points (mathematically mirrored X axis)
      hand.landmarks.forEach((lm, idx) => {
        const cx = (1 - lm.x) * canvas.width;
        const cy = lm.y * canvas.height;
        
        const isFingertip = [4, 8, 12, 16, 20].includes(idx);
        const isWrist = idx === 0;

        ctx.beginPath();
        ctx.arc(cx, cy, isWrist ? 5.5 : 3.2, 0, 2 * Math.PI);
        ctx.fillStyle = isWrist ? '#ffffff' : themeColor;
        ctx.shadowBlur = 4;
        ctx.shadowColor = themeColor;
        ctx.fill();
 
        // Targeting rings on fingertips
        if (isFingertip) {
          ctx.beginPath();
          ctx.arc(cx, cy, 6.5, 0, 2 * Math.PI);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0;
 
      // 5. Draw labels text (preventing text mirroring)
      if (showLabels && hand.landmarks[9]) {
        const mc = hand.landmarks[9];
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px Orbitron, sans-serif';
        ctx.fillText(
          `${hand.label.toUpperCase()} H // SENSOR_ACC: ${(conf * 100).toFixed(0)}%`,
          (1 - mc.x) * canvas.width - 45,
          mc.y * canvas.height - 18
        );
      }
    });
  }, [showConnections, showLabels]);

  // Handle server WebSocket frame results
  const handleServerMessage = useCallback((data, socketLatency) => {
    updateFPS();
    if (data.success) {
      const formattedHands = data.hands.map((h) => ({
        label: h.label,
        confidence: h.confidence,
        landmarks: h.landmarks
      }));
      onHandResults(formattedHands);
      drawOverlay(formattedHands);
      
      if (onPredictionResult) {
        onPredictionResult(data.gesture || 'None', data.confidence || 0.0, socketLatency);
      }

      if (data.gesture && data.gesture !== 'None') {
        addHudLog(`SOCKET FEEDBACK: '${data.gesture}' (CONF: ${(data.confidence * 100).toFixed(0)}%) in ${socketLatency}ms`);
      }
    } else {
      onHandResults([]);
      drawOverlay([]);
      if (onPredictionResult) {
        onPredictionResult('None', 0.0, socketLatency);
      }
    }
  }, [onHandResults, drawOverlay, updateFPS, onPredictionResult, addHudLog]);

  // Manage WebSockets connections depending on mode
  useEffect(() => {
    if (processingMode === 'server') {
      addHudLog("INITIALIZING FASTAPI WEBSOCKET SYSTEM...");
      connect(handleServerMessage);
    } else {
      disconnect();
      addHudLog("CONNECTED LOCAL WASM/GPU CLIENT PIPELINE");
    }

    return () => {
      disconnect();
    };
  }, [processingMode, connect, disconnect, handleServerMessage, addHudLog]);

  // Main Webcam frame capturing loop
  useEffect(() => {
    const processLoop = async () => {
      const webcam = webcamRef.current;
      const canvas = canvasRef.current;
      
      if (!webcam || !webcam.video || webcam.video.readyState < 2) {
        animationRef.current = requestAnimationFrame(processLoop);
        return;
      }

      if (canvas.width !== webcam.video.videoWidth) {
        canvas.width = webcam.video.videoWidth;
        canvas.height = webcam.video.videoHeight;
      }

      if (processingMode === 'client') {
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

          const now = performance.now();
          if (now - lastPredictTimeRef.current > 200) { // 5 Hz
            lastPredictTimeRef.current = now;
            const startTime = performance.now();
            
            predictGesture(formattedHands[0].landmarks)
              .then((pred) => {
                const latency = Math.round(performance.now() - startTime);
                if (onPredictionResult) {
                  onPredictionResult(pred.gesture, pred.confidence, latency);
                }
                if (pred.gesture && pred.gesture !== 'None') {
                  addHudLog(`REST INFERENCE: '${pred.gesture}' (CONF: ${(pred.confidence * 100).toFixed(0)}%) in ${latency}ms`);
                }
              })
              .catch((err) => {
                console.error("API Prediction error:", err);
              });
          }
        } else {
          onHandResults([]);
          drawOverlay([]);
          const now = performance.now();
          if (now - lastPredictTimeRef.current > 200) {
            lastPredictTimeRef.current = now;
            if (onPredictionResult) {
              onPredictionResult('None', 0.0, 0);
            }
          }
        }
      } else if (processingMode === 'server' && wsStatus === 'connected') {
        const now = performance.now();
        if (now - lastProcessTimeRef.current > 50) { // 20 FPS throttle
          lastProcessTimeRef.current = now;

          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = 480;
          offscreenCanvas.height = 360;
          const offscreenCtx = offscreenCanvas.getContext('2d');
          offscreenCtx.drawImage(webcam.video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
          
          offscreenCanvas.toBlob((blob) => {
            if (blob) {
              sendFrame(blob);
            }
          }, 'image/jpeg', 0.55);
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
  }, [processingMode, detectHands, updateFPS, onHandResults, drawOverlay, wsStatus, sendFrame, onPredictionResult, addHudLog]);

  const handleCameraUserMedia = () => {
    setCameraActive(true);
    setCameraError(null);
    addHudLog("WEBCAM OPTICAL FEED ACTIVE (640x480)");
  };

  const handleCameraError = (err) => {
    console.error("Webcam media access error:", err);
    setCameraActive(false);
    setCameraError("Camera access denied or device not found.");
    addHudLog("CRITICAL: SENSOR SIGHT CONFLICT - ACCESS DENIED");
  };

  return (
    <div 
      ref={containerRef}
      className={`glass-panel border overflow-hidden relative shadow-glass transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-black' 
          : 'rounded-xl border-cyber-border/40 aspect-video bg-black/60'
      }`}
    >
      {/* Dynamic scan line bar (Only when camera active) */}
      {cameraActive && (
        <div className="absolute top-0 left-0 w-full h-[2px] scanning-bar absolute top-0 left-0 animate-scan z-10 pointer-events-none"></div>
      )}

      {/* Fullscreen HUD Overlays */}
      {isFullscreen && (
        <>
          {/* Cyber grid lines */}
          <div className="absolute inset-0 pointer-events-none z-10 opacity-15 cyber-grid"></div>

          {/* Left Panel HUD: Floating Coordinates Log */}
          <div className="absolute top-4 left-4 z-20 w-64 glass-panel border border-cyber-cyan/35 bg-black/75 p-3 rounded font-mono text-[9px] text-cyber-cyan/95 max-h-[85vh] overflow-hidden flex flex-col gap-2 shadow-[0_0_15px_rgba(102,252,241,0.2)]">
            <div className="flex items-center gap-1.5 border-b border-cyber-cyan/35 pb-1 mb-1 font-orbitron font-bold text-[10px]">
              <Terminal className="w-3.5 h-3.5" /> HUD OPTICAL LOGGER
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin select-none pr-1">
              {hudLogs.length === 0 ? (
                <div className="text-cyber-text/30 animate-pulse">[WAITING FOR Telemetry LOGS...]</div>
              ) : (
                hudLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel HUD: Active Prediction & Statistics */}
          <div className="absolute top-4 right-4 z-20 w-72 glass-panel border border-cyber-rose/35 bg-black/75 p-4 rounded font-mono text-[10px] text-cyber-text/95 flex flex-col gap-4 shadow-[0_0_15px_rgba(255,0,127,0.2)]">
            <div className="flex items-center justify-between border-b border-cyber-rose/35 pb-1.5 font-orbitron font-bold text-[11px] text-cyber-rose">
              <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 animate-pulse" /> LIVE HUD PREDICTIONS</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyber-rose/10 border border-cyber-rose/35 font-mono">
                {processingMode.toUpperCase()}
              </span>
            </div>

            {/* Neon Card prediction display */}
            <div className="bg-cyber-bg/60 p-3 rounded border border-cyber-border/10 text-center min-h-[90px] flex flex-col justify-center gap-1 relative overflow-hidden">
              <div className="absolute top-1 left-1.5 text-[8px] text-cyber-text/40 tracking-wider">RECOGNIZED GESTURE</div>
              <h2 className="text-2xl font-black font-orbitron text-white tracking-widest mt-1 uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-blue">
                {activePrediction}
              </h2>
              <div className="text-xs text-cyber-cyan font-bold font-orbitron mt-0.5">
                CONFIDENCE: {(predictionConfidence * 100).toFixed(0)}%
              </div>
            </div>

            {/* Performance profiles */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-cyber-border/5 pb-1">
                <span className="text-cyber-text/50">SENSOR FRAME RESOLUTION</span>
                <span className="text-white font-bold">640 x 480 px</span>
              </div>
              <div className="flex items-center justify-between border-b border-cyber-border/5 pb-1">
                <span className="text-cyber-text/50">SYSTEM FREQUENCY (FPS)</span>
                <span className="text-cyber-cyan font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyber-cyan" /> {fps} Hz
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-cyber-border/5 pb-1">
                <span className="text-cyber-text/50">PIPELINE NETWORK LATENCY</span>
                <span className="text-cyber-green font-bold">
                  {processingMode === 'server' ? `${wsLatency} ms (WS)` : '10-25 ms (REST)'}
                </span>
              </div>
            </div>
            
            <button 
              onClick={toggleFullscreen}
              className="w-full py-1.5 bg-cyber-rose/15 hover:bg-cyber-rose text-cyber-rose hover:text-white rounded border border-cyber-rose/40 font-orbitron text-[10px] tracking-wider transition-all"
            >
              EXIT FULLSCREEN HUD
            </button>
          </div>

          {/* Centered Crosshairs overlay */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 border border-cyber-cyan/20 rounded-full relative flex items-center justify-center">
              <div className="w-2 h-2 bg-cyber-cyan/35 rounded-full"></div>
              <div className="w-6 h-[1px] bg-cyber-cyan/20 absolute"></div>
              <div className="w-[1px] h-6 bg-cyber-cyan/20 absolute"></div>
            </div>
          </div>
        </>
      )}

      {/* Webcam Frame Element */}
      <div className="relative w-full h-full flex items-center justify-center">
        {isCameraEnabled && (
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
            className="absolute w-full h-full object-cover scale-x-[-1]"
          />
        )}

        <canvas
          ref={canvasRef}
          className="absolute w-full h-full object-cover z-10 pointer-events-none"
        />

        {/* HUD control bar (Visible unless fullscreen is handled) */}
        {!isFullscreen && (
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            <button
              onClick={toggleCamera}
              className={`p-1.5 rounded bg-black/60 border ${
                isCameraEnabled 
                  ? 'border-cyber-green/45 text-cyber-green hover:bg-cyber-green hover:text-black' 
                  : 'border-cyber-rose/45 text-cyber-rose hover:bg-cyber-rose hover:text-white'
              } transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
              title={isCameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
            >
              {isCameraEnabled ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
            </button>
            {cameraActive && (
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded bg-black/60 border border-cyber-cyan/45 text-cyber-cyan hover:bg-cyber-cyan hover:text-black transition-all shadow-[0_0_10px_rgba(102,252,241,0.15)]"
                title="Fullscreen HUD Mode"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loaders/Offline/Error Displays */}
      {isCameraEnabled && isModelLoading && processingMode === 'client' && (
        <div className="absolute inset-0 bg-cyber-bg/95 flex flex-col items-center justify-center z-20 gap-3">
          <Scan className="w-12 h-12 text-cyber-cyan animate-spin" />
          <p className="font-orbitron text-sm font-bold text-cyber-cyan tracking-widest animate-pulse">
            LOADING MEDIAPIPE CORE...
          </p>
          <div className="w-48 h-1 bg-black/60 rounded-full overflow-hidden border border-cyber-border/20">
            <div className="h-full bg-cyber-cyan animate-[shimmer_1.5s_infinite] w-2/3 rounded-full"></div>
          </div>
        </div>
      )}

      {isCameraEnabled && processingMode === 'server' && wsStatus !== 'connected' && (
        <div className="absolute inset-0 bg-cyber-bg/90 flex flex-col items-center justify-center z-20 gap-3 p-4 text-center">
          {wsStatus === 'error' ? (
            <ShieldAlert className="w-12 h-12 text-cyber-rose animate-bounce" />
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-cyber-rose animate-spin"></div>
          )}
          <p className="font-orbitron text-sm font-bold text-cyber-rose tracking-wider uppercase">
            {wsStatus === 'error' ? 'BACKEND OFFLINE' : 'ESTABLISHING WEBSOCKET PIPELINE...'}
          </p>
          <p className="text-[10px] text-cyber-text/50 font-mono max-w-[280px]">
            {wsStatus === 'error' 
              ? 'Verification failure at ws://127.0.0.1:8000. Launch backend server to restore services.' 
              : 'Piping frame buffers to endpoint.'}
          </p>
        </div>
      )}

      {!isCameraEnabled && (
        <div className="absolute inset-0 bg-cyber-bg/95 flex flex-col items-center justify-center z-20 p-4 gap-3 text-center border border-cyber-border/20 rounded-xl">
          <div className="p-3 bg-cyber-rose/10 rounded-full border border-cyber-rose/30 text-cyber-rose animate-pulse">
            <CameraOff className="w-8 h-8" />
          </div>
          <p className="font-orbitron text-sm font-bold text-cyber-rose uppercase tracking-widest">
            SENSOR FEED SUSPENDED
          </p>
          <p className="text-xs text-cyber-text/50 font-sans max-w-[280px]">
            Camera capture feed disabled. Click the camera icon or button below to re-initialize live tracking.
          </p>
          <button
            onClick={() => setIsCameraEnabled(true)}
            className="mt-2 px-4 py-1.5 bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/35 hover:bg-cyber-cyan hover:text-black rounded text-[10px] font-orbitron tracking-widest transition-all uppercase"
          >
            INITIALIZE FEED
          </button>
        </div>
      )}

      {isCameraEnabled && (!cameraActive || cameraError || modelError) && (
        <div className="absolute inset-0 bg-cyber-bg/90 flex flex-col items-center justify-center z-20 p-4 gap-2 text-center">
          <CameraOff className="w-12 h-12 text-cyber-rose animate-bounce" />
          <p className="font-orbitron text-sm font-bold text-cyber-rose uppercase">
            {modelError ? "Engine Assembly Error" : "Optical Sensor Disconnected"}
          </p>
          <p className="text-xs text-cyber-text/60 font-mono max-w-[400px]">
            {cameraError || 
              (modelError && `Failed to load MediaPipe: ${modelError.message || modelError.toString()}`) || 
              "Awaiting camera optical credentials."}
          </p>
        </div>
      )}
    </div>
  );
}
