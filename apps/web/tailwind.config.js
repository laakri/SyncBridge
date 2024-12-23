import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0A0A0F",
          secondary: "#13131A",
        },
        primary: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          light: "#A78BFA",
        },
        accent: {
          DEFAULT: "#F0ABFC",
          secondary: "#E879F9",
        },
        border: {
          DEFAULT: "#27272A",
          light: "#3F3F46",
        },
      },
      fontFamily: {
        sans: ["Inter Variable", ...fontFamily.sans],
      },
      animation: {
        "gradient-x": "gradient-x 15s ease infinite",
        "gradient-y": "gradient-y 15s ease infinite",
        "gradient-xy": "gradient-xy 15s ease infinite",
      },
      keyframes: {
        "gradient-y": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "center top",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "center center",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
