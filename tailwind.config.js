/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zonda: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#047857', // Verde Oscuro Esmeralda
          800: '#065f46', // Verde Bosque Grow Labs
          900: '#064e3b', // Verde Oscuro Profundo
          950: '#022c22', // Verde Oscuro Extremo
        },
        obsidian: {
          900: '#000000',
          800: '#0a0a0a',
          700: '#121212',
          600: '#1e1e1e',
        },
        darkgreen: {
          50: '#f0fdf4',
          100: '#dcfce7',
          600: '#047857',
          700: '#065f46',
          800: '#064e3b',
          900: '#022c22',
        },
        sanatorio: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        hairline: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'none': '0px',
        'sm': '0px',
        DEFAULT: '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        'full': '0px', // Bordes rectos y afilados en toda la app
      },
      boxShadow: {
        'crisp': '0 0 0 1px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'sharp-lift': '0 4px 0 0 #064e3b',
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
