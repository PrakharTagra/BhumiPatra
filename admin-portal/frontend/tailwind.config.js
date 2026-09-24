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
        portal: {
          bg: '#f8fafc',
          surface: '#ffffff',
          border: '#e2e8f0',
          borderLight: '#edf2f7',
          dark: '#0f172a',
          muted: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
