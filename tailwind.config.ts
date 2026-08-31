import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        frio: {
          DEFAULT: "#0ea5e9",
          dark: "#0369a1",
          bg: "#e0f2fe",
        },
        caliente: {
          DEFAULT: "#f97316",
          dark: "#c2410c",
          bg: "#ffedd5",
        },
        organizador: {
          DEFAULT: "#16a34a",
          dark: "#15803d",
          bg: "#dcfce7",
        },
        peligro: {
          DEFAULT: "#dc2626",
          dark: "#991b1b",
          bg: "#fee2e2",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
