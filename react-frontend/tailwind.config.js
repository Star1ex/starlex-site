/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors
        dark: {
          bg: '#0a1929',
          surface: '#0f2238',
          border: '#1b3550',
          text: '#e6edf5',
          'text-muted': '#b6c4d6',
        },
      },
    },
  },
  plugins: [],
};
