/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
       boxShadow: {
        myShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        glowing: '0 0 20px rgba(255, 255, 255, 0.6)',
        deepBlue: '0 5px 15px rgba(0, 0, 255, 0.4)',
      },
      fontFamily: {
        roboto: ['var(--font-roboto)'],
        popins: ['poppins', 'sans-serif'],
        sarpanch: ['sarpanch', 'sans-serif']
      },
      backgroundImage: {
        'body-texture': "url('/img/background.jpg')",
      },
      
    },
  },
  plugins: [
    require('tailwindcss-textshadow'),
    plugin(function ({ addVariant }) {
      addVariant('parent', '&>div');
    }),
  ],
}
