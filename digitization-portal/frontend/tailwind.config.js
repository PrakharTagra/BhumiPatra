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
          100: '#e0eaf3',
          200: '#bed1e5',
          300: '#94b3d3',
          400: '#648fbe',
          500: '#4171a8',
          600: '#2f578c',
          700: '#264671',
          800: '#1e385c',
          900: '#142742',
          950: '#0c182a',
        },
        portal: {
          bg: '#f8fafc',
          surface: '#ffffff',
          border: '#e2e8f0',
          dark: '#0f172a',
          muted: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
