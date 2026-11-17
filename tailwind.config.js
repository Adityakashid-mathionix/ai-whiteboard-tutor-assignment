/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aditya Kashid's warm editorial obsidian & desk palette
        background: "#0c0d10",
        foreground: "#f6f4ef",
        desk: {
          base: "#0c0d10",
          surface: "#121620",
          card: "#181b24",
          elevated: "#1e222e",
          border: "#282d3b",
          "border-subtle": "rgba(255, 255, 255, 0.08)",
        },
        // Portfolio signature electric cobalt & neon accents
        electric: {
          DEFAULT: "#1677ff",
          hover: "#0a4fbf",
          light: "#3b8bff",
          glow: "rgba(22, 119, 255, 0.35)",
        },
        "neon-cyan": "#00d2ff",
        // Tactile sticky note colors from portfolio
        sticky: {
          yellow: "#ffeb99",
          mint: "#cbf3d2",
          pink: "#ffb8cc",
          blue: "#cfe2ff",
        },
        // Smartboard porcelain canvas
        whiteboard: {
          canvas: "#fdfefe",
          grid: "rgba(18, 22, 32, 0.07)",
          pen: "#0c0d10",
          blue: "#1677ff",
          cyan: "#00a8e8",
          emerald: "#00b875",
          amber: "#e68a00",
          rose: "#e62e4d",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        serif: [
          "Newsreader",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        newsreader: [
          "Newsreader",
          "Georgia",
          "serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
        caveat: [
          "Caveat",
          "cursive",
        ],
        handwritten: [
          "Caveat",
          "cursive",
        ],
      },
      boxShadow: {
        paper: "0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)",
        sticky: "0 4px 14px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.2)",
        electric: "0 0 20px rgba(22, 119, 255, 0.4)",
        smartboard: "inset 0 2px 10px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
