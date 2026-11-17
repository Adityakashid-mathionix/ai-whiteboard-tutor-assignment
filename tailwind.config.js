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
        // True neutral graphite & obsidian (Zero purple/blue cast on OLED screens)
        background: "#08090d",
        surface: "#10121a",
        "surface-elevated": "#171a24",
        "surface-border": "#222533",
        accent: {
          blue: "#0066ff",
          cyan: "#00d2ff",
          emerald: "#00d084",
          amber: "#ffaa00",
          rose: "#ff3355",
          charcoal: "#1a1c23",
        },
        whiteboard: {
          canvas: "#fdfefe",
          grid: "rgba(0, 0, 0, 0.06)",
          pen: "#090a0f",
          blue: "#0066ff",
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
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "SF Mono",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
