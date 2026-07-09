/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // チョーク風（黒板の文字）／付箋の手書き風
        chalk: ['"Yomogi"', '"Kalam"', 'cursive'],
        hand: ['"Kalam"', '"Yomogi"', 'cursive'],
      },
      colors: {
        chalkboard: {
          DEFAULT: '#2f4739', // 濃い緑
          dark: '#25382d',
          frame: '#5b3a29',   // 木枠
        },
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
