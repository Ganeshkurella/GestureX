import React, { useState } from 'react';
import { Eye, Info, Database } from 'lucide-react';

const LANDMARK_GROUPS = {
  Wrist: { range: [0], color: 'text-cyber-blue' },
  Thumb: { range: [1, 2, 3, 4], color: 'text-cyber-green' },
  'Index Finger': { range: [5, 6, 7, 8], color: 'text-cyber-cyan' },
  'Middle Finger': { range: [9, 10, 11, 12], color: 'text-cyber-teal' },
  'Ring Finger': { range: [13, 14, 15, 16], color: 'text-cyber-blue' },
  'Pinky Finger': { range: [17, 18, 19, 20], color: 'text-cyber-rose' },
};

const LANDMARK_NAMES = [
  "Wrist",
  "Thumb CMC", "Thumb MCP", "Thumb IP", "Thumb Tip",
  "Index MCP", "Index PIP", "Index DIP", "Index Tip",
  "Middle MCP", "Middle PIP", "Middle DIP", "Middle Tip",
  "Ring MCP", "Ring PIP", "Ring DIP", "Ring Tip",
  "Pinky MCP", "Pinky PIP", "Pinky DIP", "Pinky Tip"
];

export default function CoordinateViewer({ landmarksData = [] }) {
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // If multiple hands are detected, we focus on the first hand.
  const hand = landmarksData[0];
  const landmarks = hand ? hand.landmarks : [];
  const handLabel = hand ? hand.label : null;
  const confidence = hand ? hand.confidence || hand.score : null;

  return (
    <div className="glass-panel p-4 rounded-xl border border-cyber-border/40 flex flex-col h-[400px] relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-rose to-transparent"></div>

      <div className="flex items-center justify-between border-b border-cyber-border/20 pb-2 mb-3">
        <h3 className="font-orbitron text-xs font-bold text-cyber-rose tracking-wider flex items-center gap-2">
          <Database className="w-3.5 h-3.5 animate-pulse" /> LANDMARK EXTRACTOR
        </h3>
        {handLabel && (
          <span className="text-[10px] bg-cyber-rose/10 text-cyber-rose px-2 py-0.5 rounded font-mono border border-cyber-rose/20">
            {handLabel.toUpperCase()} HAND ({Math.round(confidence * 100)}% Conf)
          </span>
        )}
      </div>

      {/* Hand Part Filter Tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        <button
          onClick={() => setSelectedGroup('All')}
          className={`px-2 py-1 rounded text-[10px] font-mono transition-all duration-200 border ${
            selectedGroup === 'All'
              ? 'bg-cyber-rose/20 text-cyber-rose border-cyber-rose/40 shadow-neon-rose'
              : 'bg-cyber-bg/40 text-cyber-text/60 border-transparent hover:border-cyber-border/30'
          }`}
        >
          ALL (21)
        </button>
        {Object.keys(LANDMARK_GROUPS).map((groupName) => (
          <button
            key={groupName}
            onClick={() => setSelectedGroup(groupName)}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all duration-200 border ${
              selectedGroup === groupName
                ? 'bg-cyber-rose/20 text-cyber-rose border-cyber-rose/40 shadow-neon-rose'
                : 'bg-cyber-bg/40 text-cyber-text/60 border-transparent hover:border-cyber-border/30'
            }`}
          >
            {groupName.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Coordinates Table */}
      <div className="flex-1 overflow-y-auto pr-1">
        {!hand ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-cyber-border/10 rounded-lg bg-cyber-bg/25">
            <Info className="w-8 h-8 text-cyber-text/20 mb-2 animate-bounce" />
            <p className="text-xs text-cyber-text/40 font-mono">
              NO ACTIVE LANDMARK STREAMS DETECTED.
            </p>
            <p className="text-[10px] text-cyber-text/30 font-mono mt-1">
              Present a hand in the sensor view to trigger extraction.
            </p>
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="text-[10px] text-cyber-text/40 border-b border-cyber-border/10">
                <th className="py-1">ID</th>
                <th className="py-1">LANDMARK</th>
                <th className="py-1 text-right">X (norm)</th>
                <th className="py-1 text-right">Y (norm)</th>
                <th className="py-1 text-right">Z (depth)</th>
              </tr>
            </thead>
            <tbody>
              {landmarks.map((lm, idx) => {
                // Determine if landmark falls in selected group
                const groupMatch = Object.entries(LANDMARK_GROUPS).find(
                  ([name, info]) => info.range.includes(idx)
                );
                const groupName = groupMatch ? groupMatch[0] : '';
                const groupColor = groupMatch ? groupMatch[1].color : 'text-cyber-text';

                if (selectedGroup !== 'All' && selectedGroup !== groupName) {
                  return null;
                }

                return (
                  <tr
                    key={idx}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`border-b border-cyber-border/5 hover:bg-cyber-rose/5 transition-colors cursor-pointer ${
                      hoveredIdx === idx ? 'bg-cyber-rose/5 text-white' : 'text-cyber-text/80'
                    }`}
                  >
                    <td className={`py-1.5 font-bold ${groupColor}`}>{idx}</td>
                    <td className="py-1.5 font-semibold text-[11px]">
                      {LANDMARK_NAMES[idx]}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-cyber-cyan">
                      {lm.x.toFixed(4)}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-cyber-teal">
                      {lm.y.toFixed(4)}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-cyber-rose">
                      {lm.z.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Dynamic Data Logger Footer */}
      {hand && (
        <div className="mt-2 pt-2 border-t border-cyber-border/10 flex items-center justify-between text-[9px] text-cyber-text/50 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-rose animate-ping"></span>
            <span>STREAMING REAL-TIME COORDINATES</span>
          </div>
          <span>21 x,y,z EXTRACTED</span>
        </div>
      )}
    </div>
  );
}
