import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'dashboard'

  return (
    <div className="min-h-screen text-cyber-text relative flex flex-col justify-between overflow-x-hidden">
      
      {/* Dynamic scan line or overlay grid */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-15">
        <div className="w-full h-full cyber-grid"></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          {view === 'landing' ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col justify-center"
            >
              <LandingPage onEnterDashboard={() => setView('dashboard')} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="flex-1"
            >
              <Dashboard onBackToLanding={() => setView('landing')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="w-full text-center py-4 border-t border-cyber-border/10 z-10 text-[10px] font-mono text-cyber-text/30 bg-black/40">
        GESTUREX TELEMETRY SYSTEM &copy; {new Date().getFullYear()} // PHASE 1 // COMPUTER VISION INTEGRATION
      </footer>
    </div>
  );
}

export default App;
