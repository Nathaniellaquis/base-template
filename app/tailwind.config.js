/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#10B981", // Emerald - Safe/Good
        warning: "#F59E0B", // Amber - Caution  
        danger: "#EF4444", // Red - Avoid
        neutral: "#6B7280", // Gray - UI elements
        background: "#FFFFFF", // White
        text: "#111827", // Near black
      },
    },
  },
  plugins: [],
} 