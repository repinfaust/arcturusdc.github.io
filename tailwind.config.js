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
        paper: '#F8F4EE'
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
