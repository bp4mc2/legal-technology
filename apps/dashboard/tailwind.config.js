/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lt: {
          page: '#f5f7fb',
          card: '#ffffff',
          text: '#111827',
          muted: '#6b7280',
          heading: '#030213',
          primary: '#1d4ed8',
          primarySoft: '#eff6ff',
          primaryBorder: '#bfdbfe',
          border: '#e5e7eb',
          danger: '#d4183d',
        },
      },
      borderRadius: {
        lt: '12px',
      },
      boxShadow: {
        lt: '0 1px 2px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
