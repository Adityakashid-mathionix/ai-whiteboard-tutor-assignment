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
        // Clean white & light editorial desk palette
        background: "#ffffff",
        foreground: "#0d0e11",
        desk: {
          base: "#f8f9fb",
          surface: "#ffffff",
          card: "#ffffff",
          elevated: "#f4f5f8",
          border: "#e2e5eb",
          "border-subtle": "rgba(0, 0, 0, 0.06)",
        },
        // Signature electric cobalt
        electric: {
          DEFAULT: "#1677ff",
          hover: "#0958d9",
          light: "#e6f4ff",
          glow: "rgba(22, 119, 255, 0.25)",
        },
        "neon-cyan": "#00b4d8",
        // Sticky note colors
        sticky: {
          yellow: "#fef9c3",
          mint: "#dcfce7",
          pink: "#fce7f3",
          blue: "#e0f2fe",
        },
        // Smartboard porcelain canvas
        whiteboard: {
          canvas: "#ffffff",
          grid: "rgba(0, 0, 0, 0.05)",
          pen: "#0d0e11",
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
        paper: "0 1px 3px rgba(0,0,0,0.06), 0 4px 14px rgba(0,0,0,0.04)",
        lift: "0 8px 30px rgba(0,0,0,0.08)",
        sticky: "0 6px 20px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)",
        electric: "0 0 20px rgba(22, 119, 255, 0.25)",
        smartboard: "0 10px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
      },
      animation: {
        "float-gentle": "floatGentle 4s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        "equalizer-1": "equalizer 0.8s ease-in-out infinite alternate",
        "equalizer-2": "equalizer 0.6s ease-in-out infinite alternate 0.2s",
        "equalizer-3": "equalizer 0.9s ease-in-out infinite alternate 0.4s",
      },
      keyframes: {
        floatGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: 0.7, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.02)" },
        },
        equalizer: {
          "0%": { height: "4px" },
          "100%": { height: "18px" },
        },
      },
    },
  },
  plugins: [],
};
