import React from 'react';
import { Cpu, Zap, Code, ArrowRight, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage({ onEnterDashboard }) {
  // Container motion parameters
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="min-h-[92vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* 1. Animated Ambient Core Glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-cyber-cyan/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyber-rose/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>

      {/* 2. Cyber HUD Grid and Scan-line */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="w-full h-full cyber-grid relative">
          {/* Pulsing HUD radar rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyber-cyan/5 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-cyber-cyan/10 rounded-full border-dashed animate-spin" style={{ animationDuration: '60s' }}></div>
        </div>
      </div>

      {/* 3. Main Content Panel */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl w-full text-center relative z-10 flex flex-col items-center"
      >
        {/* Glowing Badge */}
        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyber-cyan/5 border border-cyber-cyan/35 text-cyber-cyan text-xs font-mono tracking-widest uppercase mb-8 shadow-[0_0_15px_rgba(102,252,241,0.15)] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <Terminal className="w-3.5 h-3.5 animate-pulse text-cyber-cyan" /> 
          NEXT-GEN CV ENGINE ACTIVE
        </motion.div>

        {/* Cinematic Glowing Title */}
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

        {/* Subtitle / Description */}
        <motion.p 
          variants={itemVariants}
          className="text-cyber-text/80 text-sm md:text-base max-w-3xl font-mono mb-12 leading-relaxed px-4"
        >
          An enterprise-grade, low-latency computer vision gesture intelligence platform. 
          Engineered with MediaPipe 21-point tracking mesh, real-time ML prediction networks, 
          and sub-40ms WebSocket telemetry streaming.
        </motion.p>

        {/* Futuristic CTA Launch Button */}
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

        {/* Tech Highlights Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-20 text-left px-4"
        >
          {/* Card 1 */}
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

          {/* Card 2 */}
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

          {/* Card 3 */}
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
