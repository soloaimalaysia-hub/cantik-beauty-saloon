import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          gold: "#B76E79",
          light: "#E8A0A9",
          pale: "#FFF0F3",
          deep: "#8B4E57",
        },
        blush: {
          50: "#FFF5F7",
          100: "#FFE4EA",
          200: "#FFB3C1",
          300: "#FF8FA3",
          400: "#FF6B81",
          500: "#FF4757",
        },
        champagne: "#F7E7CE",
        mink: "#2D1B1E",
      },
      fontFamily: {
        playfair: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "rose-gradient": "linear-gradient(135deg, #FFF0F3 0%, #F7E7CE 100%)",
        "hero-gradient": "linear-gradient(135deg, #2D1B1E 0%, #8B4E57 50%, #B76E79 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
