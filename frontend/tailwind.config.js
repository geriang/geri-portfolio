/**
 * Tailwind configuration for the portfolio frontend.
 * Uses exact colour values from the existing design (light/dark) and Geist fonts.
 */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        backgroundLight: '#ffffff',
        backgroundDark: '#0a0a0a',
        foregroundLight: '#171717',
        foregroundDark: '#ededed',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
