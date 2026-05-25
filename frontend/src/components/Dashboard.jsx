import React, { useState } from 'react';
import { Settings, Eye, HelpCircle, Code, Server, Play, StopCircle, RefreshCw, Cpu, Layers } from 'lucide-react';
import WebcamPanel from './WebcamPanel';
import StatusIndicator from './StatusIndicator';
import CoordinateViewer from './CoordinateViewer';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard({ onBackToLanding }) {
  const [processingMode, setProcessingMode] = useState('client'); // 'client' | 'server'
  const [showConnections, setShowConnections] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [handsData, setHandsData] = useState([]);
  const [fps, setFps] = useState(0);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [isModelLoading, setIsModelLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'docs'

  const handleHandResults = (hands) => {
    setHandsData(hands);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-cyber-border/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-orbitron tracking-wide text-white">GESTUREX</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 font-mono tracking-wider">
              WORKSPACE ACTIVE
            </span>
          </div>
          <p className="text-xs text-cyber-text/50 font-mono mt-1">
            Visual telemetry, landmark coordinate extractor, and computer vision interface.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Toggles */}
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded font-orbitron text-xs tracking-wider border transition-all duration-200 ${
              activeTab === 'workspace'
                ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/45 shadow-neon-cyan/35'
                : 'bg-cyber-panel/40 text-cyber-text/75 border-transparent hover:border-cyber-border/30'
            }`}
          >
            WORKSPACE
          </button>
          
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 rounded font-orbitron text-xs tracking-wider border transition-all duration-200 ${
              activeTab === 'docs'
                ? 'bg-cyber-rose/25 text-cyber-rose border-cyber-rose/45 shadow-neon-rose/35'
                : 'bg-cyber-panel/40 text-cyber-text/75 border-transparent hover:border-cyber-border/30'
            }`}
          >
            LEARNING CENTER
          </button>

          <button
            onClick={onBackToLanding}
            className="px-3 py-1.5 border border-cyber-border/30 text-cyber-text/70 rounded font-orbitron text-xs tracking-wider hover:bg-white/5 transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'workspace' ? (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left: Webcam Stream Panel (span 2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <WebcamPanel
                processingMode={processingMode}
                showConnections={showConnections}
                showLabels={showLabels}
                onHandResults={handleHandResults}
                onFPSChange={setFps}
                onWSStatusChange={setWsStatus}
                isModelLoadingCallback={setIsModelLoading}
              />

              {/* Status indicator underneath */}
              <StatusIndicator
                cameraActive={true}
                handDetected={handsData.length > 0}
                handsInfo={handsData}
                fps={fps}
                processingMode={processingMode}
                wsStatus={wsStatus}
                isModelLoading={isModelLoading}
              />
            </div>

            {/* Right: Controls & Coordinate Viewer */}
            <div className="flex flex-col gap-6">
              
              {/* Settings Panel */}
              <div className="glass-panel p-4 rounded-xl border border-cyber-border/40 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan to-transparent"></div>
                
                <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider flex items-center gap-2 mb-3">
                  <Settings className="w-3.5 h-3.5" /> ENGINE CONTROLS
                </h3>

                <div className="space-y-4">
                  {/* Pipeline Processing Toggle */}
                  <div>
                    <label className="text-[10px] text-cyber-text/50 font-mono uppercase block mb-1.5">
                      Processing Pipeline
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded border border-cyber-border/10">
                      <button
                        onClick={() => setProcessingMode('client')}
                        className={`py-1.5 rounded font-orbitron text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          processingMode === 'client'
                            ? 'bg-cyber-cyan/20 text-cyber-cyan shadow-neon-cyan/10 border border-cyber-cyan/35'
                            : 'text-cyber-text/55 border border-transparent hover:text-cyber-text/90'
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5" /> CLIENT (MP JS)
                      </button>
                      <button
                        onClick={() => setProcessingMode('server')}
                        className={`py-1.5 rounded font-orbitron text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          processingMode === 'server'
                            ? 'bg-cyber-rose/20 text-cyber-rose shadow-neon-rose/10 border border-cyber-rose/35'
                            : 'text-cyber-text/55 border border-transparent hover:text-cyber-text/90'
                        }`}
                      >
                        <Server className="w-3.5 h-3.5" /> SERVER (FASTAPI)
                      </button>
                    </div>
                  </div>

                  {/* Visual Render options */}
                  <div className="space-y-2 pt-2 border-t border-cyber-border/10">
                    <label className="text-[10px] text-cyber-text/50 font-mono uppercase block">
                      Render Settings
                    </label>
                    
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-mono text-cyber-text/80">Draw Hand Skeletal Connections</span>
                      <button
                        onClick={() => setShowConnections(!showConnections)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                          showConnections ? 'bg-cyber-cyan' : 'bg-cyber-panel/80 border border-cyber-border/20'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-black shadow transition-transform duration-200 ${
                          showConnections ? 'translate-x-5' : 'translate-x-0'
                        }`}></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-mono text-cyber-text/80">Draw Hand Side Labels</span>
                      <button
                        onClick={() => setShowLabels(!showLabels)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                          showLabels ? 'bg-cyber-cyan' : 'bg-cyber-panel/80 border border-cyber-border/20'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-black shadow transition-transform duration-200 ${
                          showLabels ? 'translate-x-5' : 'translate-x-0'
                        }`}></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coordinates Viewer Panel */}
              <CoordinateViewer landmarksData={handsData} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="docs"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="glass-panel p-6 rounded-xl border border-cyber-border/40 relative overflow-hidden"
          >
            {/* Ambient Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-rose to-transparent"></div>

            <div className="flex items-center gap-2 mb-6 border-b border-cyber-border/10 pb-3">
              <HelpCircle className="w-5 h-5 text-cyber-rose animate-pulse" />
              <h2 className="font-orbitron text-md font-black text-white tracking-widest">
                GESTUREX SYSTEM ARCHITECTURE & SCIENCE
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-mono leading-relaxed text-cyber-text/85">
              <div className="space-y-6">
                <div>
                  <h3 className="text-cyber-cyan font-orbitron font-bold tracking-wider mb-2 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> 1. HOW MEDIAPIPE HANDS WORKS
                  </h3>
                  <p>
                    MediaPipe Hand tracking is a hybrid, multi-stage machine learning system:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>
                      <strong className="text-white">Palm Detection Model (BlazePalm):</strong> First runs a Single-Shot Detector (SSD) model optimized for hand localization across the entire frame. This is extremely fast and avoids scanning the full image repeatedly.
                    </li>
                    <li>
                      <strong className="text-white">Hand Landmark Model:</strong> Processes only the cropped palm region returned by the detector, predicting 21 3D coordinates (x, y, depth) using regression.
                    </li>
                    <li>
                      <strong className="text-white">Tracking optimization:</strong> In video streams, once hands are located, the detector sleeps. The landmarker tracks the hand position using the previous frame's coordinates, only waking up the palm detector when hand presence confidence drops.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-cyber-cyan font-orbitron font-bold tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> 2. THE 21 HAND LANDMARKS
                  </h3>
                  <p>
                    The 21 hand landmarks map the anatomical skeletal junctions of the human hand:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li><strong className="text-white">Landmark 0:</strong> Wrist base</li>
                    <li><strong className="text-white">Landmarks 1-4:</strong> Thumb (Carpometacarpal CMC, Metacarpophalangeal MCP, Interphalangeal IP, Tip)</li>
                    <li><strong className="text-white">Landmarks 5-8:</strong> Index Finger (MCP, Proximal Interphalangeal PIP, Distal Interphalangeal DIP, Tip)</li>
                    <li><strong className="text-white">Landmarks 9-12:</strong> Middle Finger joints and tip</li>
                    <li><strong className="text-white">Landmarks 13-16:</strong> Ring Finger joints and tip</li>
                    <li><strong className="text-white">Landmarks 17-20:</strong> Pinky Finger joints and tip</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-cyber-rose font-orbitron font-bold tracking-wider mb-2 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" /> 3. THE COORDINATE SPACE
                  </h3>
                  <p>
                    MediaPipe Hand Landmarker outputs normalized 3D Cartesian coordinates:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>
                      <strong className="text-white">X and Y:</strong> Represent standard pixel columns/rows, normalized to <code className="bg-black/40 px-1 py-0.5 text-cyber-cyan">[0.0, 1.0]</code>. The origin (0.0, 0.0) is the top-left corner of the image, while (1.0, 1.0) is the bottom-right corner.
                    </li>
                    <li>
                      <strong className="text-white">Z (Depth):</strong> Represents landmark depth relative to the wrist. The wrist is configured as the reference depth point (Z = 0.0). A smaller/negative value indicates the joint is closer to the camera, while a larger/positive value indicates it is further away.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-cyber-rose font-orbitron font-bold tracking-wider mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> 4. WHY COORDINATES ARE ULTRA-EFFICIENT
                  </h3>
                  <p>
                    Traditional computer vision requires feeding raw video pixels (e.g., 640x480x3 = 921,600 values) into deep convolutional networks. This is resource-intensive and slow.
                  </p>
                  <p className="mt-2">
                    Landmark-based systems reduce the problem dimension down to <strong className="text-white">21 landmarks × 3 coords (x,y,z) = 63 numerical values</strong>. This represents a <strong className="text-cyber-green">99.99% data compression ratio</strong>. Training a lightweight gesture classifier (e.g. SVM or simple feedforward neural network) on just 63 values consumes minimal memory, runs at over 1000 FPS, and works perfectly on mobile devices!
                  </p>
                </div>

                <div>
                  <h3 className="text-cyber-green font-orbitron font-bold tracking-wider mb-2 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5" /> 5. PATH TO GESTURE CLASSIFICATION (PHASE 2)
                  </h3>
                  <p>
                    In the next phase, we will feed these 63 coordinates into machine learning models.
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li>
                      <strong className="text-white">Features Preprocessing:</strong> Translate landmarks relative to landmark 0 (wrist) to make the model translation-invariant. Normalize distances relative to hand size to make it scale-invariant.
                    </li>
                    <li>
                      <strong className="text-white">Static Gesture Classifier:</strong> Feed the normalized 63 features to models like Multi-Layer Perceptrons (MLP), Random Forests, or SVMs to predict static signs (e.g., "Thumbs Up", "Peace Sign", "V Fist").
                    </li>
                    <li>
                      <strong className="text-white">Dynamic Gesture Classifier:</strong> Feed sequences of landmarks over time (e.g., 30 frames) to Recurrent Neural Networks (LSTM/GRU) or Temporal Convolutional Networks (TCN) to classify dynamic motions like "Swipe Left" or "Wave".
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
