/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C2405B',
          light: '#FC8497',
          dark: '#A72F48',
        },
        secondary: {
          DEFAULT: '#FDE9EB',
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
