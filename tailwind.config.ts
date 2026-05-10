import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      charcoal: {
        900: '#0d0e0f',
        800: '#161718',
        700: '#1e2021',
      },
      amber: {
        400: '#fbbf24',
        500: '#f59e0b',
      },
      purple: {
        400: '#c084fc',
        500: '#a855f7',
      },
      topo: {
        blue: '#38bdf8',
        green: '#4ade80',
        red: '#f87171',
      },
      gray: {
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
      },
      red: {
        500: '#ef4444',
      },
      green: {
        500: '#22c55e',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'topo-scroll': 'topo-scroll 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'topo-scroll': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(-50%, -50%)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;

