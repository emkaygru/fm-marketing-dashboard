/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Female Mavericks Brand Colors
        'fm-blue': '#00639e',      // Lapis Lazuli (Primary)
        'fm-orange': '#e45525',    // Flame (CTA/Accent)
        'fm-navy': '#1d3665',      // Eerie Black (Dark)
        'fm-gray': '#48484a',      // Davy's Gray
        'fm-teal': '#2fb7c8',      // Accent teal
        'fm-yellow': '#f7d878',    // Accent yellow
      },
    },
  },
  plugins: [],
}
