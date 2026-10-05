/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--primary-50, #eff6ff)',
          100: 'var(--primary-100, #dbeafe)',
          500: 'var(--primary-500, #3b82f6)',
          600: 'var(--primary-600, #2563eb)',
          700: 'var(--primary-700, #1d4ed8)',
          800: 'var(--primary-800, #1e40af)',
          900: 'var(--primary-900, #1e3a8a)',
        },
      },
    },
  },
  plugins: [],
};

