/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        sun: {
          50: "#fff6ed",
          100: "#ffead5",
          200: "#ffd1a3",
          300: "#ffb16a",
          400: "#ff8a33",
          500: "#ff6d00",
          600: "#ff5400",
          700: "#cc3e02",
          800: "#a1300b",
          900: "#822a0c",
          950: "#461204",
        },
        ember: {
          50: "#fff9eb",
          100: "#ffeec6",
          200: "#ffdb88",
          300: "#ffb600",
          400: "#ff9e00",
          500: "#ff8500",
          600: "#ff6000",
          700: "#cc4a02",
          800: "#a13a0b",
          900: "#82300c",
          950: "#461604",
        },
        crate: {
          950: "#0f0d0b",
          900: "#1a1612",
          800: "#241e18",
          700: "#2d261f",
          600: "#3d342b",
          500: "#5a4d40",
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', "sans-serif"],
        body: ["Outfit", "sans-serif"],
      },
      animation: {
        "card-in": "cardIn 0.45s ease-out both",
        "fade-in": "fadeIn 0.3s ease-out both",
        "slide-up": "slideUp 0.4s ease-out both",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        cardIn: {
          from: { opacity: "0", transform: "translateY(24px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
