import React, { useState, useCallback, useEffect } from 'react';
import { Settings, Eye, HelpCircle, Code, Server, Play, RefreshCw, Cpu, Layers, Database, Disc, Zap, Maximize2, Terminal, BarChart2 } from 'lucide-react';
import WebcamPanel from './WebcamPanel';
import StatusIndicator from './StatusIndicator';
import CoordinateViewer from './CoordinateViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { getDatasetCounts, saveDatasetSample } from '../services/api';

const GESTURE_THEMES = {
  'Thumbs Up': { 
    color: 'text-cyber-green', 
    bar: 'bg-cyber-green shadow-[0_0_12px_rgba(0,255,136,0.5)]', 
    glow: 'shadow-[0_0_20px_rgba(0,255,136,0.25)]', 
    border: 'border-cyber-green/45',
    svgGlow: 'rgba(0, 255, 136, 0.4)',
    stroke: '#00ff88'
  },
  'Peace': { 
    color: 'text-purple-400', 
    bar: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]', 
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]', 
    border: 'border-purple-500/40',
    svgGlow: 'rgba(168, 85, 247, 0.4)',
    stroke: '#a855f7'
  },
  'Stop Palm': { 
    color: 'text-cyber-rose', 
    bar: 'bg-cyber-rose shadow-[0_0_12px_rgba(255,0,127,0.5)]', 
    glow: 'shadow-[0_0_20px_rgba(255,0,127,0.25)]', 
    border: 'border-cyber-rose/40',
    svgGlow: 'rgba(255, 0, 127, 0.4)',
    stroke: '#ff007f'
  },
  'Fist': { 
    color: 'text-cyber-amber', 
    bar: 'bg-cyber-amber shadow-[0_0_12px_rgba(255,170,0,0.5)]', 
    glow: 'shadow-[0_0_20px_rgba(255,170,0,0.25)]', 
    border: 'border-cyber-amber/40',
    svgGlow: 'rgba(255, 170, 0, 0.4)',
    stroke: '#ffaa00'
  },
  'OK Sign': { 
    color: 'text-cyber-cyan', 
    bar: 'bg-cyber-cyan shadow-[0_0_12px_rgba(102,252,241,0.5)]', 
    glow: 'shadow-[0_0_20px_rgba(102,252,241,0.25)]', 
    border: 'border-cyber-cyan/40',
    svgGlow: 'rgba(102, 252, 241, 0.4)',
    stroke: '#66fcf1'
  },
  'None': { 
    color: 'text-cyber-text/30', 
    bar: 'bg-cyber-text/20', 
    glow: '', 
    border: 'border-cyber-border/10',
    svgGlow: 'rgba(197, 198, 199, 0.1)',
    stroke: '#c5c6c7'
  }
};

export default function Dashboard({ onBackToLanding }) {
  const [processingMode, setProcessingMode] = useState('client'); // 'client' | 'server'
  const [showConnections, setShowConnections] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [handsData, setHandsData] = useState([]);
  const [fps, setFps] = useState(0);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [isModelLoading, setIsModelLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'docs'

  // Dataset recording state
  const [isRecordMode, setIsRecordMode] = useState(false);
  const [selectedGesture, setSelectedGesture] = useState('Thumbs Up');
  const [sampleCounts, setSampleCounts] = useState({
    'Thumbs Up': 0,
    'Peace': 0,
    'Stop Palm': 0,
    'Fist': 0,
    'OK Sign': 0
  });
  const [isRecordingContinuous, setIsRecordingContinuous] = useState(false);
  const [saveStatus, setSaveStatus] = useState('IDLE'); // 'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'
  const [errorMsg, setErrorMsg] = useState('');

  // AI inference state
  const [activePrediction, setActivePrediction] = useState('None');
  const [predictionConfidence, setPredictionConfidence] = useState(0.0);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [inferenceLatency, setInferenceLatency] = useState(0);

  // Layout states
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Sparkline data states
  const [latencyHistory, setLatencyHistory] = useState(Array(15).fill(0));
  const [fpsHistory, setFpsHistory] = useState(Array(15).fill(0));
  const [gestureFrequency, setGestureFrequency] = useState({
    'Thumbs Up': 0,
    'Peace': 0,
    'Stop Palm': 0,
    'Fist': 0,
    'OK Sign': 0
  });

  const handleHandResults = useCallback((hands) => {
    setHandsData(hands);
  }, []);

  const handlePredictionResult = useCallback((gesture, confidence, latency = 0) => {
    setActivePrediction(gesture);
    setPredictionConfidence(confidence);
    if (latency > 0) {
      setInferenceLatency(latency);
      setLatencyHistory(prev => [...prev.slice(1), latency]);
    }
    
    if (gesture && gesture !== 'None' && gesture !== 'Searching...') {
      // Record gesture frequency counts
      setGestureFrequency(prev => ({
        ...prev,
        [gesture]: prev[gesture] + 1
      }));

      // Record prediction history
      setPredictionHistory((prev) => {
        if (prev.length > 0 && prev[0].gesture === gesture) {
          return prev;
        }
        const newItem = {
          gesture,
          confidence,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          id: Date.now()
        };
        return [newItem, ...prev].slice(0, 5);
      });
    }
  }, []);

  // Update FPS history timeline
  useEffect(() => {
    if (fps > 0) {
      setFpsHistory(prev => [...prev.slice(1), fps]);
    }
  }, [fps]);

  // Fetch initial sample counts
  useEffect(() => {
    const fetchCounts = async () => {
      const counts = await getDatasetCounts();
      if (counts) {
        setSampleCounts(counts);
      }
    };
    fetchCounts();
  }, []);

  // Save single snapshot
  const handleSaveSample = useCallback(async () => {
    if (handsData.length === 0) {
      setSaveStatus('ERROR');
      setErrorMsg('No hand detected.');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
      return;
    }
    setSaveStatus('SAVING');
    try {
      const hand = handsData[0];
      const data = await saveDatasetSample(selectedGesture, hand.landmarks);
      if (data && data.success) {
        setSampleCounts(data.counts);
        setSaveStatus('SUCCESS');
        setTimeout(() => setSaveStatus('IDLE'), 1000);
      } else {
        setSaveStatus('ERROR');
        setErrorMsg('Rejected by API.');
        setTimeout(() => setSaveStatus('IDLE'), 2000);
      }
    } catch (err) {
      setSaveStatus('ERROR');
      setErrorMsg(err.message || 'REST stream failure.');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
    }
  }, [handsData, selectedGesture]);

  // Continuous auto-recording timer
  useEffect(() => {
    if (!isRecordingContinuous) return;
    
    const interval = setInterval(async () => {
      if (handsData.length > 0) {
        try {
          const hand = handsData[0];
          const data = await saveDatasetSample(selectedGesture, hand.landmarks);
          if (data && data.success) {
            setSampleCounts(data.counts);
          }
        } catch (err) {
          console.error("Auto-record error:", err);
        }
      }
    }, 250); // 4 samples per second

    return () => clearInterval(interval);
  }, [isRecordingContinuous, handsData, selectedGesture]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const gestureKeys = {
        '1': 'Thumbs Up',
        '2': 'Peace',
        '3': 'Stop Palm',
        '4': 'Fist',
        '5': 'OK Sign'
      };

      if (gestureKeys[e.key]) {
        setSelectedGesture(gestureKeys[e.key]);
        e.preventDefault();
      } else if (e.code === 'Space') {
        handleSaveSample();
        e.preventDefault();
      } else if (e.key === 'r' || e.key === 'R') {
        setIsRecordingContinuous(prev => !prev);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveSample]);

  // SVG Helper to generate sparkline path
  const getSparklinePath = (history, width = 140, height = 30) => {
    if (history.length < 2) return '';
    const min = Math.min(...history);
    const max = Math.max(...history) || 1;
    const delta = max - min || 1;
    
    return history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * width;
      const y = height - 2 - ((val - min) / delta) * (height - 4);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Get active theme attributes
  const activeTheme = GESTURE_THEMES[activePrediction] || GESTURE_THEMES['None'];

  // Circular gauge definitions
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (predictionConfidence * circumference);

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-cyber-border/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-orbitron tracking-wide text-white">GESTUREX</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 font-mono tracking-wider animate-pulse">
              TELEMETRY HUB
            </span>
          </div>
          <p className="text-xs text-cyber-text/50 font-mono mt-1">
            Visual telemetry, landmark coordinate extractor, and computer vision interface.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          {activeTab === 'workspace' && (
            <button
              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              className={`px-3 py-1.5 rounded font-orbitron text-xs tracking-wider border transition-all duration-200 flex items-center gap-1.5 ${
                isAdvancedMode
                  ? 'bg-cyber-amber/25 text-cyber-amber border-cyber-amber/45 shadow-[0_0_12px_rgba(255,159,0,0.25)]'
                  : 'bg-cyber-panel/40 text-cyber-text/65 border-transparent hover:border-cyber-border/30'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              {isAdvancedMode ? 'HIDE DEV TOOLS' : 'DEV TOOLS'}
            </button>
          )}

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
            {/* Left: Webcam Stream Panel & Telemetry Indicator (span 2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <WebcamPanel
                processingMode={processingMode}
                showConnections={showConnections}
                showLabels={showLabels}
                onHandResults={handleHandResults}
                onFPSChange={setFps}
                onWSStatusChange={setWsStatus}
                isModelLoadingCallback={setIsModelLoading}
                onPredictionResult={handlePredictionResult}
                activePrediction={activePrediction}
                predictionConfidence={predictionConfidence}
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

            {/* Right: Premium Inference Stats & Controls */}
            <div className="flex flex-col gap-6">
              
              {/* Premium Prediction Panel */}
              <div className="glass-panel p-5 rounded-xl border border-cyber-border/40 relative overflow-hidden bg-black/40 shadow-glass flex flex-col gap-4">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan to-transparent"></div>
                
                <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider flex items-center gap-2 border-b border-cyber-border/10 pb-2">
                  <Zap className="w-3.5 h-3.5 text-cyber-cyan animate-pulse" /> CLASSIFICATION ANALYTICS
                </h3>

                {/* Main recognition ring and label card */}
                <div className="flex items-center gap-4 bg-cyber-bg/30 p-4 rounded-lg border border-cyber-border/15 relative overflow-hidden">
                  <div className="absolute top-1 right-2 flex items-center gap-1">
                    <span className="text-[8px] font-mono text-cyber-text/40">LATENCY:</span>
                    <span className={`text-[8px] font-mono font-bold ${inferenceLatency > 0 ? 'text-cyber-green' : 'text-cyber-text/30'}`}>
                      {inferenceLatency > 0 ? `${inferenceLatency}ms` : '--'}
                    </span>
                  </div>

                  {/* Circular SVG Gauge */}
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Gray track */}
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="rgba(197, 198, 199, 0.08)"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      {/* Neon indicator circle */}
                      <motion.circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke={activeTheme.stroke}
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={circumference}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute font-orbitron text-[10px] font-bold text-white text-center">
                      <div className="text-[12px]">{(predictionConfidence * 100).toFixed(0)}%</div>
                      <div className="text-[7px] text-cyber-text/40 tracking-wider">CONF</div>
                    </div>
                  </div>

                  {/* Classification Text */}
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[8px] text-cyber-text/40 font-mono tracking-wider block">ACTIVE STATE</span>
                    <h2 className={`text-2xl font-black font-orbitron tracking-wider mt-0.5 ${activeTheme.color} drop-shadow-[0_0_12px_rgba(102,252,241,0.2)]`}>
                      {activePrediction.toUpperCase()}
                    </h2>
                  </div>
                </div>

                {/* Telemetry charts row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Latency Sparkline */}
                  <div className="bg-cyber-bg/40 p-2.5 rounded border border-cyber-border/10 flex flex-col justify-between h-[68px]">
                    <div className="text-[8px] font-mono text-cyber-text/40 uppercase">Latency Timeline</div>
                    <div className="flex items-end justify-between gap-2 mt-1">
                      <span className="font-orbitron font-bold text-xs text-cyber-green">{inferenceLatency || '--'}<span className="text-[8px] font-normal text-cyber-text/40 ml-0.5">ms</span></span>
                      <svg width="60" height="20" className="opacity-80">
                        <path
                          d={getSparklinePath(latencyHistory, 60, 20)}
                          fill="transparent"
                          stroke="#00ff88"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* FPS Stability Sparkline */}
                  <div className="bg-cyber-bg/40 p-2.5 rounded border border-cyber-border/10 flex flex-col justify-between h-[68px]">
                    <div className="text-[8px] font-mono text-cyber-text/40 uppercase">Frame Stability</div>
                    <div className="flex items-end justify-between gap-2 mt-1">
                      <span className="font-orbitron font-bold text-xs text-cyber-cyan">{fps}<span className="text-[8px] font-normal text-cyber-text/40 ml-0.5">Hz</span></span>
                      <svg width="60" height="20" className="opacity-80">
                        <path
                          d={getSparklinePath(fpsHistory, 60, 20)}
                          fill="transparent"
                          stroke="#66fcf1"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Horizontal Bar Chart (Gesture frequency distribution) */}
                <div className="bg-cyber-bg/30 p-3 rounded-lg border border-cyber-border/10 flex flex-col gap-2">
                  <div className="flex items-center gap-1 text-[8px] font-mono text-cyber-text/40 uppercase pb-1 border-b border-cyber-border/5">
                    <BarChart2 className="w-3.5 h-3.5 text-cyber-text/40" /> Cumulative Frequency Dist
                  </div>
                  <div className="space-y-2 mt-1 select-none">
                    {['Thumbs Up', 'Peace', 'Stop Palm', 'Fist', 'OK Sign'].map((gesture) => {
                      const count = gestureFrequency[gesture] || 0;
                      const maxCount = Math.max(...Object.values(gestureFrequency), 1);
                      const widthPercent = (count / maxCount) * 100;
                      const theme = GESTURE_THEMES[gesture];
                      
                      return (
                        <div key={gesture} className="space-y-0.5">
                          <div className="flex justify-between text-[8px] font-mono text-cyber-text/60">
                            <span>{gesture}</span>
                            <span className="text-white">{count}</span>
                          </div>
                          <div className="h-1 w-full bg-black/45 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${theme.bar}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPercent}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Prediction History Logs */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[8px] font-mono text-cyber-text/40 uppercase border-b border-cyber-border/5 pb-1">
                    <span>Chronological Logs</span>
                    {predictionHistory.length > 0 && (
                      <button onClick={() => setPredictionHistory([])} className="text-cyber-rose hover:underline text-[7px]">CLEAR</button>
                    )}
                  </div>
                  <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1 scrollbar-thin">
                    {predictionHistory.length === 0 ? (
                      <div className="text-[8px] font-mono text-cyber-text/30 text-center py-4">[EMPTY FEED]</div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {predictionHistory.map((item) => {
                          const theme = GESTURE_THEMES[item.gesture] || GESTURE_THEMES['None'];
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex justify-between items-center bg-black/40 px-2 py-1 rounded border border-cyber-border/5 text-[9px] font-mono"
                            >
                              <span className={`font-semibold ${theme.color}`}>{item.gesture}</span>
                              <div className="flex items-center gap-2 text-cyber-text/40">
                                <span>{(item.confidence * 100).toFixed(0)}%</span>
                                <span className="text-[8px]">{item.timestamp}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </div>
              
            </div>

            {/* Bottom Row: Dev Tools Grid (Only visible in Advanced/Developer Mode) */}
            {isAdvancedMode && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 border-t border-cyber-border/10 pt-6"
              >
                {/* Settings Controls Panel */}
                <div className="glass-panel p-4 rounded-xl border border-cyber-border/40 relative overflow-hidden bg-black/40">
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

                {/* Dataset Recorder Panel */}
                <div className="glass-panel p-4 rounded-xl border border-cyber-border/40 relative overflow-hidden bg-black/40">
                  <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${isRecordingContinuous ? 'via-cyber-rose animate-pulse' : 'via-cyber-amber'} to-transparent`}></div>

                  <div className="flex items-center justify-between mb-3 border-b border-cyber-border/10 pb-2">
                    <h3 className="font-orbitron text-xs font-bold text-cyber-amber tracking-wider flex items-center gap-2">
                      <Database className="w-3.5 h-3.5" /> DATASET RECORDER
                    </h3>
                    
                    <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setIsRecordMode(!isRecordMode)}>
                      <span className="text-[10px] text-cyber-text/50 font-mono">RECORDER:</span>
                      <span className={`text-[10px] font-bold font-orbitron px-1.5 py-0.5 rounded border transition-colors ${
                        isRecordMode 
                          ? 'bg-cyber-amber/15 text-cyber-amber border-cyber-amber/40 shadow-neon-amber/20' 
                          : 'bg-black/30 text-cyber-text/30 border-cyber-border/15'
                      }`}>
                        {isRecordMode ? 'ACTIVE' : 'STANDBY'}
                      </span>
                    </div>
                  </div>

                  {isRecordMode ? (
                    <div className="space-y-4">
                      {/* Gesture Class Select Buttons */}
                      <div>
                        <label className="text-[10px] text-cyber-text/50 font-mono uppercase block mb-1.5">
                          Target Gesture Label
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1.5 rounded border border-cyber-border/10">
                          {['Thumbs Up', 'Peace', 'Stop Palm', 'Fist', 'OK Sign'].map((gesture, idx) => {
                            const isActive = selectedGesture === gesture;
                            return (
                              <button
                                key={gesture}
                                onClick={() => setSelectedGesture(gesture)}
                                className={`py-1.5 rounded font-orbitron text-[9px] text-left px-2 tracking-wider transition-all flex items-center justify-between border ${
                                  isActive
                                    ? 'bg-cyber-amber/20 text-cyber-amber border-cyber-amber/45 shadow-neon-amber/10'
                                    : 'text-cyber-text/50 border-transparent hover:text-cyber-text/80'
                                }`}
                              >
                                <span>{idx + 1}. {gesture.toUpperCase()}</span>
                                <span className="font-mono text-[9px] bg-black/40 px-1 rounded text-cyber-text/40 font-bold">
                                  {sampleCounts[gesture] || 0}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Record Control Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyber-border/10">
                        <button
                          onClick={handleSaveSample}
                          disabled={handsData.length === 0 || isRecordingContinuous}
                          className={`py-2 rounded font-orbitron text-[10px] font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 border ${
                            handsData.length > 0 && !isRecordingContinuous
                              ? 'bg-transparent border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan hover:text-black shadow-neon-cyan/20'
                              : 'bg-black/30 text-cyber-text/30 border-cyber-border/10 cursor-not-allowed'
                          }`}
                        >
                          <Disc className="w-3.5 h-3.5" /> SNAPSHOT [SPACE]
                        </button>

                        <button
                          onClick={() => setIsRecordingContinuous(!isRecordingContinuous)}
                          disabled={handsData.length === 0}
                          className={`py-2 rounded font-orbitron text-[10px] font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 border ${
                            handsData.length > 0
                              ? isRecordingContinuous
                                ? 'bg-cyber-rose text-black border-cyber-rose shadow-neon-rose'
                                : 'bg-transparent border-cyber-rose text-cyber-rose hover:bg-cyber-rose hover:text-black shadow-neon-rose/20'
                              : 'bg-black/30 text-cyber-text/30 border-cyber-border/10 cursor-not-allowed'
                          }`}
                        >
                          <Play className={`w-3.5 h-3.5 ${isRecordingContinuous ? 'animate-spin' : ''}`} />
                          {isRecordingContinuous ? 'STOP RECORD' : 'AUTO RECORD [R]'}
                        </button>
                      </div>

                      {/* Status Feedback bar */}
                      <div className="h-6 flex items-center justify-center text-[10px] font-mono rounded bg-black/40 border border-cyber-border/5 text-center">
                        {saveStatus === 'SAVING' && (
                          <span className="text-cyber-cyan flex items-center gap-1 animate-pulse justify-center">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> EXPORTING DATASET DATA TO CSV...
                          </span>
                        )}
                        {saveStatus === 'SUCCESS' && (
                          <span className="text-cyber-green font-bold">
                            ✓ SAMPLE EXPORTED SUCCESSFULLY
                          </span>
                        )}
                        {saveStatus === 'ERROR' && (
                          <span className="text-cyber-rose font-bold flex items-center gap-1 justify-center">
                            ⚠ ERROR: {errorMsg}
                          </span>
                        )}
                        {saveStatus === 'IDLE' && (
                          <span className="text-cyber-text/45">
                            {handsData.length > 0 
                              ? 'SENSOR READY - SPACE TO RECORD' 
                              : 'AWAITING HAND FEED...'}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-cyber-text/60 space-y-2 py-1">
                      <p className="text-[10px] leading-relaxed">
                        Collect precise 21 joint landmark skeletons to compile clean training datasets for 5 target static gestures.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-[10px]">
                        {Object.entries(sampleCounts).map(([name, count]) => (
                          <div key={name} className="flex justify-between bg-black/25 px-2 py-1 rounded border border-cyber-border/5">
                            <span>{name}</span>
                            <span className="text-cyber-cyan font-bold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Coordinates Viewer Panel */}
                <CoordinateViewer landmarksData={handsData} />
              </motion.div>
            )}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-[14px] font-sans leading-relaxed text-cyber-text/90">
              <div className="space-y-8">
                <div>
                  <h3 className="text-cyber-cyan font-orbitron font-bold tracking-wider mb-4 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> 1. HOW MEDIAPIPE HANDS WORKS
                  </h3>
                  <p className="mb-4 text-cyber-text/70">
                    MediaPipe Hand tracking is a hybrid, multi-stage machine learning system:
                  </p>
                  <ul className="list-disc pl-5 mt-3 space-y-3.5 text-cyber-text/80">
                    <li>
                      <strong className="text-white">Palm Detection Model (BlazePalm):</strong> First runs a Single-Shot Detector (SSD) model optimized for hand localization across the entire frame. This is extremely fast and avoids scanning the full image repeatedly.
                    </li>
                    <li>
                      <strong className="text-white">Hand Landmark Model:</strong> Processes only the cropped palm region returned by the detector, predicting 21 3D coordinates (x, y, depth) using regression.
                    </li>
                    <li>
                      <strong className="text-white">Tracking Optimization:</strong> In video streams, once hands are located, the detector sleeps. The landmarker tracks the hand position using the previous frame's coordinates, only waking up the palm detector when hand presence confidence drops.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-cyber-cyan font-orbitron font-bold tracking-wider mb-4 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> 2. THE 21 HAND LANDMARKS
                  </h3>
                  <p className="mb-4 text-cyber-text/70">
                    The 21 hand landmarks map the anatomical skeletal junctions of the human hand:
                  </p>
                  <ul className="list-disc pl-5 mt-3 space-y-2 text-cyber-text/80">
                    <li><strong className="text-white">Landmark 0:</strong> Wrist base</li>
                    <li><strong className="text-white">Landmarks 1-4:</strong> Thumb <span className="text-cyber-text/50">(Carpometacarpal CMC, Metacarpophalangeal MCP, Interphalangeal IP, Tip)</span></li>
                    <li><strong className="text-white">Landmarks 5-8:</strong> Index Finger <span className="text-cyber-text/50">(MCP, Proximal Interphalangeal PIP, Distal Interphalangeal DIP, Tip)</span></li>
                    <li><strong className="text-white">Landmarks 9-12:</strong> Middle Finger joints and tip</li>
                    <li><strong className="text-white">Landmarks 13-16:</strong> Ring Finger joints and tip</li>
                    <li><strong className="text-white">Landmarks 17-20:</strong> Pinky Finger joints and tip</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-cyber-rose font-orbitron font-bold tracking-wider mb-4 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" /> 3. THE COORDINATE SPACE
                  </h3>
                  <p className="mb-4 text-cyber-text/70">
                    MediaPipe Hand Landmarker outputs normalized 3D Cartesian coordinates:
                  </p>
                  <ul className="list-disc pl-5 mt-3 space-y-3.5 text-cyber-text/80">
                    <li>
                      <strong className="text-white">X and Y:</strong> Represent standard pixel columns and rows, normalized to the range <code className="bg-black/40 px-1.5 py-0.5 rounded text-cyber-cyan font-mono text-xs">[0.0, 1.0]</code>.
                      <span className="block mt-1 text-cyber-text/60">
                        The origin (0.0, 0.0) represents the top-left corner, while (1.0, 1.0) represents the bottom-right corner of the image frame.
                      </span>
                    </li>
                    <li>
                      <strong className="text-white">Z (Depth):</strong> Represents the landmark depth relative to the wrist base.
                      <span className="block mt-1 text-cyber-text/60">
                        The wrist is set as the reference point (Z = 0.0). A negative value means the joint is closer to the camera, and a positive value means it is further away.
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-cyber-rose font-orbitron font-bold tracking-wider mb-4 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> 4. WHY COORDINATES ARE ULTRA-EFFICIENT
                  </h3>
                  <p className="mb-4 text-cyber-text/80 leading-relaxed">
                    Traditional computer vision requires feeding raw video pixels (e.g., <code className="bg-black/40 px-1.5 py-0.5 rounded text-cyber-rose font-mono text-xs">640 &times; 480 &times; 3 = 921,600</code> values) directly into deep convolutional networks. This is highly resource-intensive and slow.
                  </p>
                  <p className="text-cyber-text/80 leading-relaxed">
                    Landmark-based systems reduce this complexity by extracting just <strong className="text-white">21 landmarks &times; 3 coordinates (x, y, z) = 63 numerical values</strong>. This represents a massive <strong className="text-cyber-green font-bold">99.99% data compression ratio</strong>.
                  </p>
                  <p className="mt-4 text-cyber-text/80 leading-relaxed">
                    Training a lightweight classifier (e.g. SVM or simple neural network) on just 63 inputs consumes minimal memory, achieves execution speeds exceeding 1,000 FPS, and runs perfectly on edge devices.
                  </p>
                </div>

                <div>
                  <h3 className="text-cyber-green font-orbitron font-bold tracking-wider mb-4 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5" /> 5. PATH TO GESTURE CLASSIFICATION (PHASE 2)
                  </h3>
                  <p className="mb-4 text-cyber-text/70">
                    In the next phase, we will feed these 63 coordinates into machine learning models to predict active gesture labels:
                  </p>
                  <ul className="list-disc pl-5 mt-3 space-y-3.5 text-cyber-text/80">
                    <li>
                      <strong className="text-white">Features Preprocessing:</strong> Translate coordinates relative to landmark 0 (wrist base) for translation-invariance. Normalize all distances by hand size to achieve scale-invariance.
                    </li>
                    <li>
                      <strong className="text-white">Static Gesture Classifier:</strong> Feed the preprocessed 63 features to lightweight models (MLPs, Random Forests, or SVMs) to predict discrete signs such as "Thumbs Up", "Peace", or "Fist".
                    </li>
                    <li>
                      <strong className="text-white">Dynamic Gesture Classifier:</strong> Feed sequences of landmarks over windowed frames (e.g., 30 FPS history) into LSTMs, GRUs, or Temporal Convolutional Networks (TCNs) to classify motions like swiping or waving.
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
