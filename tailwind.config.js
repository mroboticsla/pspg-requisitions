/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        teal: {
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
        },
        brand: {
          dark: '#00253F',
          accent: '#FF1556',
          accentDark: '#E8134E',
        },
        neutral: {
          25: '#fcfcfd',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        surface: {
          primary: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
        },
        // Paleta para pantallas de administración
        admin: {
          primary: '#00253F',      // Azul oscuro principal
          secondary: '#0369a1',    // Azul secundario
          accent: '#FF1556',       // Rojo/rosa para acciones importantes
          accentHover: '#E8134E',  // Hover del accent
          success: '#059669',      // Verde para acciones positivas
          successHover: '#047857', // Hover del success
          danger: '#dc2626',       // Rojo para eliminar
          dangerHover: '#b91c1c',  // Hover del danger
          warning: '#f59e0b',      // Amarillo para advertencias
          info: '#3b82f6',         // Azul para información
          
          // Backgrounds
          bg: {
            page: '#f8fafc',       // Fondo de página
            card: '#ffffff',       // Fondo de tarjetas
            hover: '#f1f5f9',      // Hover en elementos
            input: '#ffffff',      // Fondo de inputs
            disabled: '#f1f5f9',   // Fondo deshabilitado
          },
          
          // Borders
          border: {
            DEFAULT: '#e2e8f0',    // Border por defecto
            focus: '#FF1556',      // Border en foco
            hover: '#cbd5e1',      // Border en hover
          },
          
          // Text
          text: {
            primary: '#0f172a',    // Texto principal
            secondary: '#475569',  // Texto secundario
            muted: '#94a3b8',      // Texto apagado
            inverse: '#ffffff',    // Texto inverso (sobre fondos oscuros)
          },
        },
      },
      spacing: {
        // Espaciado específico para administración
        'admin-xs': '0.5rem',   // 8px
        'admin-sm': '0.75rem',  // 12px
        'admin-md': '1rem',     // 16px
        'admin-lg': '1.5rem',   // 24px
        'admin-xl': '2rem',     // 32px
        'admin-2xl': '3rem',    // 48px
      },
      borderRadius: {
        'admin': '0.5rem',      // 8px - border radius estándar para admin
        'admin-sm': '0.375rem', // 6px - border radius pequeño
        'admin-lg': '0.75rem',  // 12px - border radius grande
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
