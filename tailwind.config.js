/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/views/**/*.js', './public/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        coral: '#E88B7B',
        lavender: '#D4C5E8',
        mint: '#A8D5BA',
        sky: '#BCE3F5',
        peach: '#FFD4B8',
        pinky: '#F5C8D8',
      },
      boxShadow: {
        soft: '0 10px 26px rgba(17,24,39,.08)',
        card: '0 18px 60px rgba(17,24,39,.12)',
      },
      borderRadius: {
        xl2: '26px',
      },
      fontFamily: {
        rounded: [
          'ui-rounded',
          '"SF Pro Rounded"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
