/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0e2625', // Dark Charcoal
        secondary: '#CFD8DC', // Bright Yellow
        accent: '#309b47', // A blue for general highlights/links, if needed, or adjust
      },
    },
  },
  plugins: [],
};