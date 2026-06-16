import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2F9',
          100: '#D4E0F1',
          200: '#A9C2E3',
          300: '#7EA4D5',
          400: '#5385C7',
          500: '#1B3B6F',
          600: '#163060',
          700: '#112551',
          800: '#0C1A42',
          900: '#070F33',
        },
        accent: {
          50: '#FDF2EC',
          100: '#FAE0CC',
          200: '#F5C199',
          300: '#F0A266',
          400: '#EB8333',
          500: '#E07B39',
          600: '#C96A2E',
          700: '#B25923',
          800: '#9B4818',
          900: '#84370D',
        },
        surface: '#F5F4F0',
        ink: '#1C1C1E',
        muted: '#8E8E93',
        line: '#E5E5EA',
        subtle: '#F2F2F7',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out both',
        'fade-in': 'fadeIn 0.35s ease-out both',
        'slide-down': 'slideDown 0.25s ease-out both',
        shake: 'shake 0.4s ease-out',
        spin: 'spin 0.8s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'float-delay': 'float 7s ease-in-out 1s infinite',
        blob: 'blob 14s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        marquee: 'marquee 28s linear infinite',
        'spin-slow': 'spin 14s linear infinite',
        'pulse-ring': 'pulseRing 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        'gradient-pan': 'gradientPan 6s ease infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-5px)' },
          '40%': { transform: 'translateX(5px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-14px) translateX(6px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(20px, -24px) scale(1.08)' },
          '66%': { transform: 'translate(-16px, 14px) scale(0.95)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(224,123,57,0.45)' },
          '70%': { boxShadow: '0 0 0 12px rgba(224,123,57,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(224,123,57,0)' },
        },
        gradientPan: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        card: '0 2px 24px rgba(0,0,0,0.06)',
        'card-sm': '0 2px 12px rgba(0,0,0,0.04)',
        glow: '0 8px 40px rgba(27,59,111,0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
