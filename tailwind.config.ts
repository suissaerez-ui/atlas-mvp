import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        bubble: "0 18px 48px rgba(88, 81, 154, 0.18)",
        soft: "0 12px 30px rgba(39, 47, 93, 0.1)",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
