/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dce5f0',
          200: '#bcd0e4',
          300: '#90b2d3',
          400: '#5e8ebd',
          500: '#3d71a6',
          600: '#2b5789',
          700: '#224670',
          800: '#1b385a',
          900: '#0f243c',
          950: '#081422',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
