/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,mdx}",
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F0452F',
          600: '#D83E29'
        },
        ink: '#1C1C1C',
        muted: '#6A6A6A',
        paper: '#F8F4EE',
        // ApexTwin Design System
        apex: {
          carbon: '#0B0B0C',
          graphite: '#1A1C1F',
          stealth: '#2C2E32',
          white: '#F2F2F2',
          soft: '#A0A4A8',
          mint: '#00FF9A',
          'mint-tint': '#7DFFD0',
          heat: '#FF3B2F',
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,.06)'
      },
      borderRadius: {
        xl2: '18px'
      }
    },
  },
  plugins: [],
}
