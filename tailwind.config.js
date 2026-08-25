/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./projects/**/*.{html,ts}"
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      keyframes: {
        slide: {
          '0%': { left: '-33%' },
          '50%': { left: '100%' },
          '100%': { left: '-33%' },
        },
      },
      animation: {
        slide: 'slide 1.5s infinite linear',
      },
    },
  },
  plugins: [],
}

