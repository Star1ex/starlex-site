/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Legacy (keep for backward compat)
        dark: {
          bg: '#0a1929',
          surface: '#0f2238',
          border: '#1b3550',
          text: '#e6edf5',
          'text-muted': '#b6c4d6',
        },
        // Liquid Glass surface scale
        surface: {
          base: '#000000',
          dim: '#051424',
          lowest: '#010f1f',
          low: '#0e1c2d',
          DEFAULT: '#122031',
          high: '#1d2b3c',
          highest: '#283647',
          bright: '#2c3a4c',
        },
        // Accent / primary
        primary: {
          DEFAULT: '#c0c1ff',
          container: '#8083ff',
          on: '#1000a9',
        },
        secondary: '#c0c1ff',
        tertiary: '#b9c8de',
        // Text on surface
        'on-surface': '#d5e4fa',
        'on-surface-variant': '#c7c4d7',
        outline: '#908fa0',
        'outline-variant': '#464554',
        // Status
        'status-todo': '#94a3b8',
        'status-progress': '#6366f1',
        'status-review': '#a78bfa',
        'status-done': '#34d399',
        'priority-urgent': '#fb7185',
        'priority-high': '#f59e0b',
        'priority-medium': '#c0c1ff',
        'priority-low': '#94a3b8',
        error: '#ffb4ab',
      },
      fontFamily: {
        hanken: ['"Hanken Grotesk"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'headline-xl': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'label-sm': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        'label-caps': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.2em', fontWeight: '500' }],
      },
      spacing: {
        sidebar: '240px',
        topbar: '80px',
      },
      maxWidth: {
        container: '1400px',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.05)',
        card: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
        modal: '0 24px 64px rgba(0,0,0,0.18)',
        dropdown: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        lifted: '0 20px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.1)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-button': 'inset 0 1px 0 rgba(255,255,255,0.15)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.2s ease forwards',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.26, 1.4, 0.48, 1) forwards',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-snappy': 'cubic-bezier(0.26, 1.4, 0.48, 1)',
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
