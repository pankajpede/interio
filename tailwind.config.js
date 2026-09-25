/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F9FA',
        surface: '#FFFFFF',
        sidebar: '#1E2025',
        primary: {
          50: '#F0F5FF',
          100: '#E0EAFF',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        dark: {
          800: '#1F2937',
          900: '#111827',
        }
      },
    },
  },
  plugins: [],
}
