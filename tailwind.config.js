/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'classi-panel': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(12px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'classi-backdrop': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'vic-fade': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'classi-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'classi-panel': 'classi-panel 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'classi-backdrop': 'classi-backdrop 0.2s ease-out forwards',
        'vic-fade': 'vic-fade 0.5s ease-out forwards',
        'classi-shimmer': 'classi-shimmer 1.35s ease-in-out infinite',
      },
      colors: {
        /* ألوان العصر الفيكتوري: عنّابي عميق، ذهبي ملكي، كريمي، أخضر زمردي */
        victorian: {
          50:  '#fbf7f1',
          100: '#f4ead8',
          200: '#e8d4ad',
          300: '#d9b87e',
          400: '#c89a55',
          500: '#b07a38',
          600: '#8c5a28',
          700: '#6b4220',
          800: '#4a2d18',
          900: '#2b1a0f',
          950: '#180d07',
        },
        burgundy: {
          50:  '#fbf2f2',
          100: '#f5dcdc',
          200: '#eab5b5',
          300: '#d78484',
          400: '#c05a5a',
          500: '#a03c3c',
          600: '#7d2828',
          700: '#5e1e1e',
          800: '#401414',
          900: '#260b0b',
        },
        cream: {
          50:  '#fdfbf5',
          100: '#faf4e4',
          200: '#f2e7c5',
          300: '#e8d59a',
          400: '#d9bf6a',
        },
        emeraldv: {
          500: '#2f6b4f',
          600: '#234f3b',
          700: '#173628',
        },
        /* إبقاء classi للتوافق العكسي مع الكومبوننتات القديمة (لن نكسر شيئاً) */
        classi: {
          50: '#fbf2f2',
          100: '#f5dcdc',
          200: '#eab5b5',
          300: '#d78484',
          400: '#c05a5a',
          500: '#a03c3c',
          600: '#7d2828',
          700: '#5e1e1e',
          800: '#401414',
          900: '#260b0b',
        },
      },
      fontFamily: {
        /* الواجهة بالكامل: Tajawal فقط + احتياط النظام */
        sans: ['"Tajawal"', 'system-ui', 'sans-serif'],
        display: ['"Tajawal"', 'system-ui', 'sans-serif'],
        body: ['"Tajawal"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'vic-ornament':
          "radial-gradient(circle at 20% 10%, rgba(176,122,56,0.08) 0, transparent 40%), radial-gradient(circle at 80% 90%, rgba(125,40,40,0.08) 0, transparent 40%)",
      },
    },
  },
  plugins: [],
}
