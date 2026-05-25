import React from 'react';
import { Cpu, Zap, Code, ArrowRight, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage({ onEnterDashboard }) {
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
      className="h-full flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden select-none"
    >
      
      {/* 1. Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-cyber-cyan/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyber-teal/5 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}></div>
 
      {/* 2. Cyber HUD Grid and Radar Sweep */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.08]">
        <div className="w-full h-full cyber-grid relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-cyber-cyan/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-cyber-cyan/15 rounded-full border-dashed animate-spin" style={{ animationDuration: '80s' }}></div>
        </div>
      </div>
 
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded bg-cyber-panel border border-cyber-border text-cyber-cyan text-[10px] font-mono tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(69,162,158,0.1)] relative overflow-hidden group"
        >
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-ping"></span>
          SPATIAL CORE DETECTED // OPERATIONAL
        </motion.div>
 
        {/* Sub-system Status Code */}
        <motion.span
          variants={itemVariants}
          className="text-cyber-text/40 font-mono text-[9px] tracking-[0.3em] uppercase mb-1.5 block"
        >
          [ SYSTEM STATUS: CORE INFERENCE OPTIMIZED ]
        </motion.span>
 
        {/* Title */}
        <motion.h1 
          variants={itemVariants}
          className="text-5xl md:text-7xl font-black font-orbitron tracking-widest mb-4 relative select-none text-white leading-none uppercase"
        >
          GESTURE
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-teal to-cyber-green drop-shadow-[0_0_15px_rgba(0,240,255,0.25)] font-black">
            X
          </span>
        </motion.h1>
 
        {/* Description */}
        <motion.p 
          variants={itemVariants}
          className="text-cyber-text/75 text-sm md:text-base max-w-xl font-sans mb-8 leading-relaxed px-4"
        >
          Real-time 21-point skeletal tracking and low-latency gesture intelligence.
        </motion.p>
 
        {/* CTA Launch Button */}
        <motion.div variants={itemVariants} className="relative group mb-10">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyber-cyan to-cyber-teal rounded blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
          <button
            onClick={onEnterDashboard}
            className="relative px-8 py-3 bg-cyber-panel hover:bg-cyber-cyan hover:text-black text-cyber-cyan border border-cyber-cyan/40 font-orbitron font-bold text-xs tracking-widest rounded flex items-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(0,240,255,0.05)]"
          >
            INITIALIZE TELEMETRY CONSOLE
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
 
        {/* Specs Highlights */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full text-left px-4"
        >
          {/* Card 1 */}
          <div className="glass-panel p-4 rounded border border-cyber-border relative group hover:border-cyber-cyan/40 hover:shadow-[0_0_15px_rgba(0,240,255,0.03)] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-[2px] h-full bg-cyber-cyan opacity-40 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="flex items-center justify-between mb-2.5 border-b border-cyber-border/10 pb-1.5">
              <span className="text-xs font-mono text-cyber-cyan tracking-wider flex items-center gap-1.5 uppercase">
                <Cpu className="w-3.5 h-3.5" /> MODULE 01 // CV_SKEL
              </span>
              <span className="text-[10px] bg-cyber-cyan/10 text-cyber-cyan px-2 py-0.5 rounded font-mono font-bold">ONLINE</span>
            </div>
 
            <h3 className="font-orbitron text-base font-bold tracking-wider text-white mb-2 uppercase">
              21-Point Skeletal Mesh
            </h3>
            <p className="text-sm font-sans text-cyber-text/60 leading-relaxed">
              Extracts high-fidelity Cartesian coordinates mapping wrists, joints, and fingertips in absolute depth space.
            </p>
            
            {/* Visual simulation bar */}
            <div className="mt-3.5 w-full h-1 bg-black/40 rounded overflow-hidden relative">
              <div className="h-full bg-cyber-cyan/30 w-3/4 animate-pulse"></div>
            </div>
          </div>
  
          {/* Card 2 */}
          <div className="glass-panel p-4 rounded border border-cyber-border relative group hover:border-cyber-green/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.03)] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-[2px] h-full bg-cyber-green opacity-40 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="flex items-center justify-between mb-2.5 border-b border-cyber-border/10 pb-1.5">
              <span className="text-xs font-mono text-cyber-green tracking-wider flex items-center gap-1.5 uppercase">
                <Zap className="w-3.5 h-3.5" /> MODULE 02 // ACCEL_IF
              </span>
              <span className="text-[10px] bg-cyber-green/10 text-cyber-green px-2 py-0.5 rounded font-mono font-bold">ACTIVE</span>
            </div>
 
            <h3 className="font-orbitron text-base font-bold tracking-wider text-white mb-2 uppercase">
              Lightweight Edge Inference
            </h3>
            <p className="text-sm font-sans text-cyber-text/60 leading-relaxed">
              Processes 63-dimensional coordinate arrays natively on the client using optimized GPU WASM delegates.
            </p>
 
            {/* Visual simulation bar */}
            <div className="mt-3.5 w-full h-1 bg-black/40 rounded overflow-hidden relative">
              <div className="h-full bg-cyber-green/30 w-5/6 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
  
          {/* Card 3 */}
          <div className="glass-panel p-4 rounded border border-cyber-border relative group hover:border-cyber-rose/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.03)] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-[2px] h-full bg-cyber-rose opacity-40 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="flex items-center justify-between mb-2.5 border-b border-cyber-border/10 pb-1.5">
              <span className="text-xs font-mono text-cyber-rose tracking-wider flex items-center gap-1.5 uppercase">
                <Code className="w-3.5 h-3.5" /> MODULE 03 // NET_TEL
              </span>
              <span className="text-[10px] bg-cyber-rose/10 text-cyber-rose px-2 py-0.5 rounded font-mono font-bold">READY</span>
            </div>
 
            <h3 className="font-orbitron text-base font-bold tracking-wider text-white mb-2 uppercase">
              Websocket Telemetry
            </h3>
            <p className="text-sm font-sans text-cyber-text/60 leading-relaxed">
              Streams coordinate frames and receives predictions via persistent, bidirectional WebSocket channels.
            </p>
 
            {/* Visual simulation bar */}
            <div className="mt-3 w-full h-1 bg-black/40 rounded overflow-hidden relative">
              <div className="h-full bg-cyber-rose/30 w-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
