/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'shake': 'shake 0.5s ease-in-out infinite',
        'bounce-slow': 'bounce 1s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'confetti': 'confetti 1s ease-out forwards',
        'reveal': 'reveal 0.8s ease-out forwards',
        // Magic gift animations
        'magic-float': 'magic-float 3s ease-in-out infinite',
        'magic-glow': 'magic-glow 2s ease-in-out infinite',
        'magic-sparkle': 'magic-sparkle 1.5s ease-in-out infinite',
        'ribbon-shimmer': 'ribbon-shimmer 2s linear infinite',
        'burst-expand': 'burst-expand 0.8s ease-out forwards',
        'star-twinkle': 'star-twinkle 2s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(251, 146, 60, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(251, 146, 60, 0.8)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' },
        },
        reveal: {
          '0%': { transform: 'scale(0.5) rotateY(180deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotateY(0deg)', opacity: '1' },
        },
        // Magic gift keyframes
        'magic-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(2deg)' },
        },
        'magic-glow': {
          '0%, 100%': {
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 165, 0, 0.2)',
            filter: 'brightness(1)'
          },
          '50%': {
            boxShadow: '0 0 50px rgba(255, 215, 0, 0.7), 0 0 100px rgba(255, 165, 0, 0.4)',
            filter: 'brightness(1.1)'
          },
        },
        'magic-sparkle': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'ribbon-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'burst-expand': {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '50%': { opacity: '0.8' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
        'star-twinkle': {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1.3) rotate(180deg)' },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        givt: {
          "primary": "#e11d48",           // Rose red - festive
          "primary-content": "#ffffff",
          "secondary": "#059669",          // Emerald green - Christmas
          "secondary-content": "#ffffff",
          "accent": "#f59e0b",             // Amber - gift ribbon
          "accent-content": "#ffffff",
          "neutral": "#374151",
          "neutral-content": "#ffffff",
          "base-100": "#fef7f7",           // Warm white
          "base-200": "#fef2f2",
          "base-300": "#fee2e2",
          "base-content": "#1f2937",
          "info": "#3b82f6",
          "success": "#22c55e",
          "warning": "#eab308",
          "error": "#ef4444",
        },
      },
    ],
    base: true,
    styled: true,
    utils: true,
  },
}
