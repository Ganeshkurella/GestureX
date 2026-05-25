/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#060708",       // Deep graphite tactical background
          panel: "rgba(15, 17, 20, 0.8)",  // Matte dark slate panels
          border: "rgba(69, 162, 158, 0.15)", // Muted telemetry teal border
          text: "#ecf0f1",     // High readability off-white
          cyan: "#00f0ff",     // Active targeting electric cyan
          teal: "#45a29e",     // Muted secondary teal
          green: "#10b981",    // Active status operational green
          rose: "#ff3b30",     // Critical alert/infrared red
          blue: "#0a84ff",     // Secondary system blue
          amber: "#f5a623"     // System warning amber
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(102, 252, 241, 0.4), 0 0 20px rgba(102, 252, 241, 0.1)',
        'neon-green': '0 0 10px rgba(0, 255, 136, 0.4), 0 0 20px rgba(0, 255, 136, 0.1)',
        'neon-rose': '0 0 10px rgba(255, 0, 127, 0.4), 0 0 20px rgba(255, 0, 127, 0.1)',
        'neon-amber': '0 0 10px rgba(255, 159, 0, 0.4), 0 0 20px rgba(255, 159, 0, 0.1)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      fontFamily: {
        orbitron: ['Space Grotesk', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'scan': 'scan-line 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'scan-line': {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.8' },
          '50%': { transform: 'translateY(400px)', opacity: '0.8' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
