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
          bg: "#030008",       // Deep space/near black background
          panel: "rgba(10, 8, 20, 0.7)",  // Glassmorphic panel base
          border: "rgba(102, 252, 241, 0.2)",
          text: "#c5c6c7",
          cyan: "#66fcf1",     // Cyber neon cyan
          teal: "#45f3ff",
          green: "#00ff88",    // Neon green (success/active)
          rose: "#ff007f",     // Cyberpunk neon pink/magenta
          blue: "#00d2ff",
          amber: "#ff9f00"
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
