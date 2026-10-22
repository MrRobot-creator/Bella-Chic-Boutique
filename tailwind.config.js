/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#A96F79',
          light: '#C48D97',
          dark: '#8C5560',
        },
        secondary: {
          DEFAULT: '#F8EEEE',
          light: '#FFF5F5',
          dark: '#E8D4D4',
        },
        brand: {
          dark: '#503B3F',
          darker: '#4B3B3D',
          black: '#292528',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
