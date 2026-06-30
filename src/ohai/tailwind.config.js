/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // OHAI palette from logo: Cyan-Purple neural fingerprint gradient
        ohai: {
          primary: '#03DDF7', // Bright Cyan from fingerprint
          accent: '#9A4DF1', // Purple from neural net
          dark: '#0A0A0A', // Dark background
          card: '#1F1F1F', // Dark cards
          text: '#F5F5F5', // Light text
          border: '#333333',
          glow: '#03DDF7', // Cyan glow
        },
      },
    },
  },
  plugins: [],
}
