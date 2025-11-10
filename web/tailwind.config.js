/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { xl: '72rem' }
    },
    extend: {
      colors: {
        bg: {
          DEFAULT: 'hsl(0 0% 100%)',
          muted: 'hsl(210 20% 98%)',
          dark: 'hsl(222 47% 11%)'
        },
        fg: {
          DEFAULT: 'hsl(222 47% 11%)',
          muted: 'hsl(215 16% 47%)',
          onMuted: 'hsl(222 47% 11%)',
          inverted: 'hsl(0 0% 100%)'
        },
        accent: {
          DEFAULT: 'hsl(221 83% 53%)',
          hover: 'hsl(221 83% 47%)'
        },
        border: 'hsl(214 32% 91%)'
      },
      borderRadius: {
        lg: '12px',
        md: '10px',
        sm: '8px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol']
      }
    }
  },
  plugins: []
}



