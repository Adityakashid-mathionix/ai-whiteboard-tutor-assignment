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
        background: "#0b0f17",
        surface: "#111827",
        "surface-elevated": "#1e293b",
        "surface-border": "#334155",
        accent: {
          blue: "#2563eb",
          sky: "#0284c7",
          cyan: "#06b6d4",
          emerald: "#059669",
          amber: "#d97706",
          rose: "#e11d48",
          slate: "#64748b",
        },
        whiteboard: {
          canvas: "#ffffff",
          grid: "rgba(15, 23, 42, 0.05)",
          pen: "#0f172a",
          blue: "#2563eb",
          sky: "#0284c7",
          cyan: "#0891b2",
          emerald: "#059669",
          amber: "#d97706",
          rose: "#dc2626",
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
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
