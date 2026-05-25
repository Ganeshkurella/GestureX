import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Code, ArrowRight, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

// Relative coordinates mapping out a simulated hand skeleton (Peace Sign)
const PEACE_HAND_LANDMARKS = [
  { x: 0, y: 50, id: 0 }, // Wrist
  // Thumb
  { x: -20, y: 35, id: 1 }, { x: -38, y: 20, id: 2 }, { x: -48, y: 10, id: 3 }, { x: -55, y: 4, id: 4 },
  // Index (Extended)
  { x: -15, y: 15, id: 5 }, { x: -20, y: -15, id: 6 }, { x: -24, y: -42, id: 7 }, { x: -28, y: -68, id: 8 },
  // Middle (Extended)
  { x: 2, y: 12, id: 9 }, { x: 4, y: -20, id: 10 }, { x: 6, y: -50, id: 11 }, { x: 8, y: -78, id: 12 },
  // Ring (Folded)
  { x: 18, y: 15, id: 13 }, { x: 25, y: 8, id: 14 }, { x: 20, y: 5, id: 15 }, { x: 16, y: 8, id: 16 },
  // Pinky (Folded)
  { x: 34, y: 25, id: 17 }, { x: 40, y: 20, id: 18 }, { x: 36, y: 18, id: 19 }, { x: 30, y: 22, id: 20 }
];

const PEACE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky & palm
];

export default function LandingPage({ onEnterDashboard }) {
  const [isHovering, setIsHovering] = useState(false);

  // Framer motion spring coordinates for smooth cursor following
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 180, mass: 0.8 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e) => {
    // Offset center of simulated hand relative to cursor
    mouseX.set(e.clientX - 35);
    mouseY.set(e.clientY - 35);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <div 
      className="min-h-[92vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      
      {/* 1. Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-cyber-cyan/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyber-rose/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>

      {/* 2. Cyber HUD Grid and Radar Sweep */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="w-full h-full cyber-grid relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyber-cyan/5 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-cyber-cyan/10 rounded-full border-dashed animate-spin" style={{ animationDuration: '60s' }}></div>
        </div>
      </div>

      {/* 3. Interactive Floating Hand Skeleton HUD (follows cursor) */}
      {isHovering && (
        <motion.div
          style={{
            x: springX,
            y: springY,
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 15,
            width: 160,
            height: 160,
          }}
          className="hidden md:block"
        >
          <svg className="w-full h-full overflow-visible">
            {/* Connection mesh lines */}
            {PEACE_CONNECTIONS.map(([start, end], idx) => {
              const ptA = PEACE_HAND_LANDMARKS[start];
              const ptB = PEACE_HAND_LANDMARKS[end];
              return (
                <line
                  key={idx}
                  x1={ptA.x + 80}
                  y1={ptA.y + 80}
                  x2={ptB.x + 80}
                  y2={ptB.y + 80}
                  stroke="#66fcf1"
                  strokeWidth="1.5"
                  strokeOpacity="0.45"
                  className="drop-shadow-[0_0_4px_rgba(102,252,241,0.5)]"
                />
              );
            })}
            
            {/* Landmark nodes */}
            {PEACE_HAND_LANDMARKS.map((lm) => (
              <circle
                key={lm.id}
                cx={lm.x + 80}
                cy={lm.y + 80}
                r={lm.id === 0 ? 5 : 3.5}
                fill={lm.id === 0 ? '#ffffff' : '#66fcf1'}
                className="drop-shadow-[0_0_6px_rgba(102,252,241,0.8)]"
              />
            ))}
          </svg>
          <div className="absolute top-[165px] left-0 w-full text-center text-[8px] font-mono text-cyber-cyan/60 tracking-wider">
            [PREVIEW MOUSE TRACKER]
          </div>
        </motion.div>
      )}

      {/* 4. Main Contents Panel */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl w-full text-center relative z-10 flex flex-col items-center"
      >
        {/* Top Tech Badge */}
        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyber-cyan/5 border border-cyber-cyan/35 text-cyber-cyan text-xs font-mono tracking-widest uppercase mb-8 shadow-[0_0_15px_rgba(102,252,241,0.15)] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <Terminal className="w-3.5 h-3.5 animate-pulse text-cyber-cyan" /> 
          NEXT-GEN CV ENGINE ACTIVE
        </motion.div>

        {/* Title */}
        <motion.h1 
          variants={itemVariants}
          className="text-6xl md:text-8xl font-black font-orbitron tracking-tighter mb-6 relative select-none"
        >
          <span className="relative z-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            GESTURE
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-teal to-cyber-blue relative z-10 font-black drop-shadow-[0_0_20px_rgba(102,252,241,0.4)]">
            X
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p 
          variants={itemVariants}
          className="text-cyber-text/80 text-sm md:text-base max-w-3xl font-mono mb-12 leading-relaxed px-4"
        >
          An enterprise-grade, low-latency computer vision gesture intelligence platform. 
          Engineered with MediaPipe 21-point tracking mesh, real-time ML prediction networks, 
          and sub-40ms WebSocket telemetry streaming.
        </motion.p>

        {/* CTA Launch Button */}
        <motion.div variants={itemVariants} className="relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyber-cyan to-cyber-rose rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-500 group-hover:duration-200"></div>
          <button
            onClick={onEnterDashboard}
            className="relative px-10 py-4 bg-cyber-bg/90 hover:bg-cyber-cyan hover:text-black text-cyber-cyan border border-cyber-cyan/50 font-orbitron font-bold text-sm tracking-widest rounded-lg flex items-center gap-3 transition-all duration-300 shadow-[0_0_25px_rgba(102,252,241,0.2)]"
          >
            INITIALIZE WORKSPACE 
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>

        {/* Specs Highlights */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-20 text-left px-4"
        >
          <div className="glass-panel p-6 rounded-xl border border-cyber-border/20 relative group hover:border-cyber-cyan/40 hover:shadow-[0_0_20px_rgba(102,252,241,0.05)] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-cyber-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-2.5 bg-cyber-cyan/10 rounded-lg w-fit text-cyber-cyan mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-orbitron text-xs font-bold tracking-wider text-white mb-2.5 uppercase">
              21-Point Skeletal Mesh
            </h3>
            <p className="text-xs font-mono text-cyber-text/60 leading-relaxed">
              Extracts high-fidelity coordinates mapping wrists, joints, and tips in real-time Cartesian depth spaces.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[9px] font-mono text-cyber-cyan">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE EDGE INFERENCE
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-cyber-border/20 relative group hover:border-cyber-green/45 hover:shadow-[0_0_20px_rgba(0,255,136,0.05)] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-cyber-green opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-2.5 bg-cyber-green/10 rounded-lg w-fit text-cyber-green mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-orbitron text-xs font-bold tracking-wider text-white mb-2.5 uppercase">
              Sub-10ms GPU Acceleration
            </h3>
            <p className="text-xs font-mono text-cyber-text/60 leading-relaxed">
              Leverages browser-native WebAssembly delegate executing client-side tracking with zero network overhead.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[9px] font-mono text-cyber-green">
              <Activity className="w-3.5 h-3.5" /> REAL-TIME FPS OPTIMIZED
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-cyber-border/20 relative group hover:border-cyber-rose/40 hover:shadow-[0_0_20px_rgba(255,0,127,0.05)] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-cyber-rose opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="p-2.5 bg-cyber-rose/10 rounded-lg w-fit text-cyber-rose mb-4 group-hover:scale-110 transition-transform">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="font-orbitron text-xs font-bold tracking-wider text-white mb-2.5 uppercase">
              Websocket Telemetry
            </h3>
            <p className="text-xs font-mono text-cyber-text/60 leading-relaxed">
              Unified frame streaming and Random Forest ML classifications piped via bidirectional persistent sockets.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[9px] font-mono text-cyber-rose">
              <Terminal className="w-3.5 h-3.5" /> FULL DOCKER STACK DEPLOYED
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
