import React from 'react';
import { Cpu, Zap, Eye, Code, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage({ onEnterDashboard }) {
  return (
    <div className="min-height-[90vh] flex flex-col items-center justify-center px-4 py-8 relative cyber-grid">
      
      {/* Background radial accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyber-cyan/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl w-full text-center relative z-10 flex flex-col items-center">
        {/* Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono tracking-widest uppercase mb-6 shadow-neon-cyan/20"
        >
          <Zap className="w-3.5 h-3.5 fill-cyber-cyan" /> PHASE 1: TELEMETRY ENGINE
        </motion.div>

        {/* Big Neon Title */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black font-orbitron tracking-tight mb-4 select-none"
        >
          GESTURE<span className="neon-text-cyan">X</span>
        </motion.h1>

        {/* Description */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-cyber-text/80 text-sm md:text-lg max-w-2xl font-mono mb-10 leading-relaxed"
        >
          A production-style real-time hand tracking and 21-landmark coordinate extraction engine. Powered by MediaPipe and optimized for low-latency browser-based CV intelligence.
        </motion.p>

        {/* CTA Launch Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(102, 252, 241, 0.6)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onEnterDashboard}
          className="px-8 py-4 bg-transparent border-2 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan hover:text-black font-orbitron font-bold text-sm tracking-widest rounded-lg flex items-center gap-2 transition-all duration-300 shadow-neon-cyan"
        >
          LAUNCH WORKSPACE <ArrowRight className="w-4 h-4" />
        </motion.button>

        {/* Tech Highlights Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-16 text-left"
        >
          {/* Card 1 */}
          <div className="glass-panel p-5 rounded-xl border border-cyber-border/20 relative group hover:border-cyber-cyan/40 transition-colors">
            <div className="p-2 bg-cyber-cyan/10 rounded-lg w-fit text-cyber-cyan mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-orbitron text-xs font-bold tracking-wider text-white mb-2">21 MESH LANDMARKS</h3>
            <p className="text-xs font-mono text-cyber-text/60 leading-relaxed">
              Extract precise 3D joints mapping wrists, MCPs, PIPs, DIPs, and tips in Cartesian coordinates.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-5 rounded-xl border border-cyber-border/20 relative group hover:border-cyber-green/45 transition-colors">
            {/* Top green hover line */}
            <div className="p-2 bg-cyber-green/10 rounded-lg w-fit text-cyber-green mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-orbitron text-xs font-bold tracking-wider text-white mb-2">GPU ACCELERATED</h3>
            <p className="text-xs font-mono text-cyber-text/60 leading-relaxed">
              Local client WebAssembly and GPU acceleration run sub-10ms predictions in modern browsers.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-5 rounded-xl border border-cyber-border/20 relative group hover:border-cyber-rose/40 transition-colors">
            <div className="p-2 bg-cyber-rose/10 rounded-lg w-fit text-cyber-rose mb-3">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="font-orbitron text-xs font-bold tracking-wider text-white mb-2">HYBRID ARCHITECTURE</h3>
            <p className="text-xs font-mono text-cyber-text/60 leading-relaxed">
              Seamlessly toggle between browser-native execution and python-based FastAPI websocket pipelines.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
