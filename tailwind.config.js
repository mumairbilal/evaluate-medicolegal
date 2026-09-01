/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e2e8f0",
          200: "#c6d8e7",
          300: "#98b8d1",
          500: "#3f7098",
          600: "#254663",
          700: "#1c3549",
          900: "#132534",
        },
        ink: {
          900: "#132534",
          800: "#0d1f29",
          700: "#132534",
        },
        teal: {
          50: "#eefaf7",
          400: "#48b39d",
          500: "#48b39d",
          600: "#22796a",
        },
        heading: {
          DEFAULT: "#4d7693",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
}
