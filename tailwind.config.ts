import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // <--- Pastikan baris ini ada!
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },
        peach: {
          DEFAULT: '#ff9a8b',
          light: '#ffd6d6',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
      }
    },
  },
  plugins: [],
};
export default config;