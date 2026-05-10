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
      },
      boxShadow: {
        card: '0 2px 24px rgba(0,0,0,0.06)',
        'card-sm': '0 2px 12px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
