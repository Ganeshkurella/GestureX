import React from 'react';
import { Camera, Shield, Cpu, RefreshCw } from 'lucide-react';

/**
 * StatusIndicator Component
 * Displays system health and processing telemetry in a futuristic panel.
 */
export default function StatusIndicator({
  cameraActive,
  handDetected,
  handsInfo = [],
  fps,
  processingMode,
  wsStatus,
  isModelLoading
}) {
  return (
    <div className="glass-panel p-4 rounded-xl border border-cyber-border/40 relative overflow-hidden">
      {/* Top ambient highlight line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan to-transparent"></div>
      
      <div className="flex items-center justify-between border-b border-cyber-border/20 pb-2 mb-3">
        <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 animate-pulse" /> SYSTEM TELEMETRY
        </h3>
        <span className="text-[10px] text-cyber-text/50 font-mono">
          MODE: <span className="text-cyber-cyan font-bold uppercase">{processingMode}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Model/Engine Status */}
        <div className="flex flex-col p-2 bg-black/40 rounded border border-cyber-border/10">
          <span className="text-[10px] text-cyber-text/40 font-mono uppercase tracking-wider mb-1">
            Engine State
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${isModelLoading ? 'bg-cyber-amber animate-ping' : 'bg-cyber-green shadow-neon-green'}`}></div>
            <span className="text-xs font-semibold font-orbitron">
              {isModelLoading ? 'LOADING MODEL...' : 'READY'}
            </span>
          </div>
        </div>

        {/* Camera Status */}
        <div className="flex flex-col p-2 bg-black/40 rounded border border-cyber-border/10">
          <span className="text-[10px] text-cyber-text/40 font-mono uppercase tracking-wider mb-1">
            Sensor Feed
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-cyber-green shadow-neon-green' : 'bg-cyber-rose shadow-neon-rose'}`}></div>
            <span className="text-xs font-semibold font-orbitron flex items-center gap-1">
              <Camera className="w-3 h-3 text-cyber-text/60" /> 
              {cameraActive ? 'FEED ACTIVE' : 'NO SENSOR'}
            </span>
          </div>
        </div>

        {/* Detection Status */}
        <div className="flex flex-col p-2 bg-black/40 rounded border border-cyber-border/10">
          <span className="text-[10px] text-cyber-text/40 font-mono uppercase tracking-wider mb-1">
            Hand Detection
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${handDetected ? 'bg-cyber-green shadow-neon-green scale-110' : 'bg-cyber-rose shadow-neon-rose'}`}></div>
            <span className="text-xs font-semibold font-orbitron">
              {handDetected ? (
                <span className="text-cyber-green">
                  DETECTED ({handsInfo.map(h => h.label === 'Left' ? 'L' : 'R').join(', ')})
                </span>
              ) : 'NO HANDS'}
            </span>
          </div>
        </div>

        {/* WebSocket Status (Only active/visible if server-side processing is available) */}
        <div className="flex flex-col p-2 bg-black/40 rounded border border-cyber-border/10">
          <span className="text-[10px] text-cyber-text/40 font-mono uppercase tracking-wider mb-1">
            Backend WebSocket
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${
              processingMode === 'client' 
                ? 'bg-cyber-text/30' 
                : wsStatus === 'connected' 
                  ? 'bg-cyber-green shadow-neon-green' 
                  : wsStatus === 'error'
                    ? 'bg-cyber-rose shadow-neon-rose'
                    : 'bg-cyber-amber shadow-neon-amber animate-pulse'
            }`}></div>
            <span className="text-xs font-semibold font-orbitron">
              {processingMode === 'client' ? 'STANDBY' : wsStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Frame Metrics Bar */}
      <div className="mt-3 pt-3 border-t border-cyber-border/10 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-cyber-text/60">FPS Stream:</span>
          <span className={`font-orbitron font-bold text-sm ${fps >= 30 ? 'text-cyber-green' : fps >= 15 ? 'text-cyber-amber' : 'text-cyber-rose'}`}>
            {fps} <span className="text-[9px] font-normal text-cyber-text/40">Hz</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-cyber-text/50">
          <Shield className="w-3 h-3 text-cyber-cyan" /> Secure Client Sandboxed Engine
        </div>
      </div>
    </div>
  );
}
