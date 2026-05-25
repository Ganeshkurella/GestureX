import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, RefreshCw } from 'lucide-react';

const BOOT_LOGS = [
  ">> INITIALIZING SPATIAL INFERENCE CORE v1.0.5 [OK]",
  ">> SPINNING UP MediaPipe WASM COMPILE THREADS [OK]",
  ">> LOCATING CLIENT WEBCAM OPTICAL CAPTURE BUFFER...",
  ">> ESTABLISHING TELEMETRY CONNECTION PIPES...",
  ">> WEBSOCKET DATA CHANNELS SYNCHRONIZED [OK]",
  ">> CALIBRATING 3D LANDMARK MATRIX TRANSFORMERS...",
  ">> INFERENCE LOGGING TARGETS STABILIZED...",
  ">> SYSTEM READY. DEPLOYING SPACE TACTICAL CONSOLE..."
];

function Bootloader({ onComplete }) {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress increment timer
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // Logs sequencing timer
    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < BOOT_LOGS.length) {
        setLogs((prev) => [...prev, BOOT_LOGS[logIdx]]);
        logIdx++;
      } else {
        clearInterval(logInterval);
      }
    }, 180);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
    };
  }, []);

  useEffect(() => {
    if (progress === 100 && logs.length === BOOT_LOGS.length) {
      const timeout = setTimeout(onComplete, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, logs, onComplete]);

  return (
    <div className="fixed inset-0 bg-[#060708] z-50 flex flex-col items-center justify-center font-mono hud-scanline select-none">
      {/* HUD perspective grid */}
      <div className="absolute inset-0 hud-moving-grid opacity-15 pointer-events-none"></div>

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyber-cyan/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-[500px] max-w-[90%] glass-panel-glow border border-cyber-cyan/35 p-6 rounded-xl flex flex-col gap-5 relative overflow-hidden text-xs text-cyber-cyan/90">
        
        {/* Crosshair accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyber-cyan/40"></div>
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyber-cyan/40"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyber-cyan/40"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyber-cyan/40"></div>

        {/* Head */}
        <div className="flex items-center justify-between border-b border-cyber-cyan/20 pb-2">
          <div className="flex items-center gap-1.5 font-orbitron font-bold tracking-wider text-white">
            <Terminal className="w-4 h-4 text-cyber-cyan animate-pulse" />
            SYSTEM CORE INTRUSION
          </div>
          <span className="text-[10px] bg-cyber-cyan/15 text-cyber-cyan px-2 py-0.5 rounded border border-cyber-cyan/40 animate-pulse font-bold tracking-widest">
            SECURE BOOT
          </span>
        </div>

        {/* Console logs */}
        <div className="h-44 bg-black/60 border border-cyber-cyan/10 p-4 rounded overflow-hidden flex flex-col gap-1.5">
          {logs.map((log, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-cyber-text/50">[{index}]</span>
              <span className="text-cyber-text">{log}</span>
            </div>
          ))}
          {logs.length < BOOT_LOGS.length && (
            <div className="flex items-center gap-1.5 text-cyber-cyan animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>COMPILING TARGET REGISTERS...</span>
            </div>
          )}
        </div>

        {/* Loader status */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] text-cyber-text/60">
            <span>CORE LOAD SEQUENCE</span>
            <span className="font-bold text-white">{progress}%</span>
          </div>
          <div className="w-full h-1 bg-black/40 border border-cyber-cyan/15 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-cyber-cyan shadow-[0_0_8px_rgba(0,240,255,0.7)]"
              style={{ width: `${progress}%` }}
              layoutId="bootProgress"
            />
          </div>
        </div>

        <div className="text-[9px] text-cyber-text/30 flex items-center justify-between">
          <span>HOST: LOCAL_HOST_127.0.0.1</span>
          <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> SECURE HANDSHAKE</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'booting' | 'dashboard'

  return (
    <div className="min-h-screen text-cyber-text bg-cyber-bg relative flex flex-col justify-between overflow-x-hidden font-sans antialiased selection:bg-cyber-cyan/20 selection:text-cyber-cyan">
      
      {/* Background utilities */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="w-full h-full hud-moving-grid opacity-[0.06]"></div>
        <div className="w-full h-full hud-scanline opacity-[0.05]"></div>
        
        {/* Soft tactical radial flows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyber-teal/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyber-cyan/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-center"
            >
              <LandingPage onEnterDashboard={() => setView('booting')} />
            </motion.div>
          )}

          {view === 'booting' && (
            <Bootloader 
              key="bootloader" 
              onComplete={() => setView('dashboard')} 
            />
          )}

          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1"
            >
              <Dashboard onBackToLanding={() => setView('landing')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="w-full text-center py-4 border-t border-cyber-border/10 z-10 text-[9px] font-mono tracking-widest text-cyber-text/20 bg-[#060708]/60 backdrop-blur-md">
        GESTUREX TELEMETRY SYSTEMS // SECURE CV CHANNELS // CORE STACK: REACT + MediaPipe + FastApi
      </footer>
    </div>
  );
}

export default App;

