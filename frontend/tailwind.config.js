/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: "rgb(var(--color-charcoal-950) / <alpha-value>)",
          900: "rgb(var(--color-charcoal-900) / <alpha-value>)",
          800: "rgb(var(--color-charcoal-800) / <alpha-value>)",
          700: "rgb(var(--color-charcoal-700) / <alpha-value>)",
          600: "rgb(var(--color-charcoal-600) / <alpha-value>)",
        },
        white: "rgb(var(--color-foreground) / <alpha-value>)",
        "on-ember": "rgb(var(--color-on-ember) / <alpha-value>)",
        ember: {
          400: "#ff8a4c",
          500: "#ff6a2b",
          600: "#e6551a",
          700: "#c2430f",
        },
      },
      fontFamily: {
        display: ["'Barlow Condensed'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
