/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#373d20',
        secondary: '#717744',
        tertiary: '#abac7f',
        background: '#fefefe',
        text: '#080808'
      }
    }
  },
  plugins: []
}
