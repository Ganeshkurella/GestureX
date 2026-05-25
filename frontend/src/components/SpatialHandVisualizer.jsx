import React, { useRef, useEffect } from 'react';
import { Database, Orbit } from 'lucide-react';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky & palm
];

// Open Palm default template coordinates (normalized 0 to 1 space)
const IDLE_PALM_LANDMARKS = [
  { x: 0.5, y: 0.75, z: 0.0 }, // Wrist base (0)
  // Thumb
  { x: 0.38, y: 0.70, z: -0.05 }, { x: 0.28, y: 0.65, z: -0.09 }, { x: 0.20, y: 0.62, z: -0.12 }, { x: 0.14, y: 0.60, z: -0.15 },
  // Index Finger
  { x: 0.42, y: 0.52, z: -0.02 }, { x: 0.38, y: 0.40, z: -0.04 }, { x: 0.35, y: 0.32, z: -0.06 }, { x: 0.32, y: 0.24, z: -0.08 },
  // Middle Finger
  { x: 0.50, y: 0.50, z: 0.0 }, { x: 0.50, y: 0.36, z: -0.02 }, { x: 0.50, y: 0.26, z: -0.04 }, { x: 0.50, y: 0.16, z: -0.06 },
  // Ring Finger
  { x: 0.58, y: 0.52, z: 0.02 }, { x: 0.62, y: 0.40, z: 0.01 }, { x: 0.65, y: 0.30, z: 0.0 }, { x: 0.68, y: 0.21, z: -0.01 },
  // Pinky Finger
  { x: 0.65, y: 0.58, z: 0.05 }, { x: 0.72, y: 0.50, z: 0.04 }, { x: 0.77, y: 0.44, z: 0.03 }, { x: 0.81, y: 0.38, z: 0.02 }
];

export default function SpatialHandVisualizer({ landmarksData }) {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Fit canvas resolution to element
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();

    // Resize listener
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      // Clear canvas with dark spatial environment overlay
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw telemetry grid background
      ctx.strokeStyle = 'rgba(69, 162, 158, 0.04)';
      ctx.lineWidth = 1;
      const gridSpacing = 20;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw radar HUD scanning arcs
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.42, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.25, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Process hand coordinates
      const activeHand = landmarksData && landmarksData.length > 0;
      const originalLandmarks = activeHand ? landmarksData[0].landmarks : IDLE_PALM_LANDMARKS;

      // Increment Y-rotation angle
      rotationRef.current += activeHand ? 0.005 : 0.015; // rotate faster when idle
      const theta = rotationRef.current;

      // Project 3D landmarks with rotation matrices
      const projected = originalLandmarks.map((lm) => {
        // Center around (0.5, 0.5, 0)
        const cx = lm.x - 0.5;
        const cy = lm.y - 0.5;
        const cz = (lm.z || 0);

        // Rotate around Y-axis
        const rx = cx * Math.cos(theta) - cz * Math.sin(theta);
        const rz = cx * Math.sin(theta) + cz * Math.cos(theta);
        const ry = cy; // keep vertical axis same

        // Perspective scaling factor based on depth (Z)
        const distance = 1.5;
        const perspective = distance / (distance - rz * 0.4);
        
        // Map back to screen layout coordinates
        const scale = Math.min(width, height) * 0.65 * perspective;
        const sx = width / 2 + rx * scale;
        const sy = height / 2 + ry * scale;

        return { x: sx, y: sy, z: rz, raw: lm };
      });

      // 4. Draw connection wireframe
      ctx.lineWidth = 1.5;
      HAND_CONNECTIONS.forEach(([start, end]) => {
        const ptA = projected[start];
        const ptB = projected[end];
        
        // Blend colors based on average depth (Z)
        const avgZ = (ptA.z + ptB.z) / 2;
        const alpha = Math.max(0.15, Math.min(0.85, 0.5 + avgZ * 0.5));
        
        ctx.strokeStyle = activeHand 
          ? `rgba(0, 240, 255, ${alpha})`
          : `rgba(69, 162, 158, ${alpha * 0.5})`;
        
        ctx.beginPath();
        ctx.moveTo(ptA.x, ptA.y);
        ctx.lineTo(ptB.x, ptB.y);
        ctx.stroke();
      });

      // 5. Draw joint nodes
      projected.forEach((node, idx) => {
        const isFingertip = [4, 8, 12, 16, 20].includes(idx);
        const isWrist = idx === 0;

        // Depth buffer sizing
        const radius = isWrist ? 5.5 : isFingertip ? 4.5 : 3;
        
        // Fill colors: fingertip active, others standard
        if (activeHand) {
          ctx.fillStyle = isFingertip ? '#10b981' : '#00f0ff';
          ctx.shadowColor = isFingertip ? '#10b981' : '#00f0ff';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = 'rgba(69, 162, 158, 0.6)';
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow
      });

      // 6. HUD Axis Indicator (in corner)
      const axisLen = 25;
      const ax = 35;
      const ay = height - 35;

      // X-Axis (red)
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + axisLen * Math.cos(theta), ay + axisLen * Math.sin(theta) * 0.3);
      ctx.stroke();

      // Z-Axis (cyan)
      ctx.strokeStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - axisLen * Math.sin(theta), ay + axisLen * Math.cos(theta) * 0.3);
      ctx.stroke();

      // Y-Axis (green)
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax, ay - axisLen);
      ctx.stroke();

      ctx.fillStyle = 'rgba(236, 240, 241, 0.4)';
      ctx.font = '8px monospace';
      ctx.fillText('SPATIAL ORIENTATION', 15, height - 12);

      // Status indicator tag
      ctx.fillStyle = activeHand ? '#10b981' : 'rgba(245, 166, 35, 0.8)';
      ctx.beginPath();
      ctx.arc(width - 25, 20, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(236, 240, 241, 0.6)';
      ctx.font = '8px monospace';
      ctx.fillText(
        activeHand ? 'STREAM ACTIVE' : 'CALIBRATION MODE', 
        width - 130, 23
      );

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [landmarksData]);

  return (
    <div className="glass-panel p-4 rounded-xl border border-cyber-border/40 relative overflow-hidden bg-black/40 flex flex-col gap-3 min-h-[300px]">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan to-transparent"></div>
      
      <div className="flex items-center justify-between border-b border-cyber-border/10 pb-2">
        <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider flex items-center gap-2 uppercase">
          <Orbit className="w-4 h-4 text-cyber-cyan animate-spin" style={{ animationDuration: '10s' }} /> 
          3D SPATIAL TELEMETRY
        </h3>
        <span className="text-[8px] bg-black/30 text-cyber-text/50 px-2 py-0.5 rounded font-mono border border-cyber-border/10">
          PROJECTED CORE V2
        </span>
      </div>

      <div className="flex-1 relative bg-black/50 border border-cyber-border/5 rounded-lg overflow-hidden flex justify-center items-center">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full min-h-[220px] cursor-pointer"
        />
        
        {/* Futuristic corner guides */}
        <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-cyber-cyan/30"></div>
        <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-cyber-cyan/30"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-cyber-cyan/30"></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-cyber-cyan/30"></div>
      </div>
    </div>
  );
}
