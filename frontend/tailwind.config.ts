import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1b3a6b',     // azul oscuro (sidebar, botones principales)
          light: '#2a5298',
          dark: '#122b4f',
        },
        secondary: {
          DEFAULT: '#c8a020',     // dorado (acentos, botones secundarios)
          light: '#d4b43a',
          dark: '#a07f1a',
        },
        background: '#f3f4f6',    // gris claro de fondo
        card: '#ffffff',          // blanco para tarjetas
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;