/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lotto: {
          bg: '#070b12',
          panel: '#0f1726',
          border: '#1e293b',
          neon: '#39ff9b',
          gold: '#f4c76c',
          text: '#e5edf8',
          muted: '#8ea3bf',
        },
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(57, 255, 155, 0.35), 0 0 24px rgba(57, 255, 155, 0.16)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(57, 255, 155, 0.22), 0 0 0 rgba(57,255,155,0)' },
          '50%': { boxShadow: '0 0 0 1px rgba(57, 255, 155, 0.45), 0 0 22px rgba(57,255,155,0.25)' },
        },
        slideIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        confettiFall: {
          '0%': { opacity: 0, transform: 'translateY(-20px) rotate(0deg)' },
          '10%': { opacity: 1 },
          '100%': { opacity: 0, transform: 'translateY(220px) rotate(360deg)' },
        },
        fireworkBurst: {
          '0%': { opacity: 0, transform: 'scale(0.2)' },
          '15%': { opacity: 1, transform: 'scale(1)' },
          '100%': { opacity: 0, transform: 'scale(1.6)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 2.5s ease-in-out infinite',
        slideIn: 'slideIn 0.45s ease forwards',
        confettiFall: 'confettiFall 1.9s linear infinite',
        fireworkBurst: 'fireworkBurst 1.3s ease-out infinite',
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
      },
      backgroundImage: {
        halo: 'radial-gradient(circle at 10% 10%, rgba(57,255,155,0.12), transparent 30%), radial-gradient(circle at 95% 20%, rgba(244,199,108,0.12), transparent 30%)',
      },
    },
  },
  plugins: [],
}
