/**
 * Design tokens ported from the Braynix / Aditya Kashid portfolio system:
 * a warm paper desk surface, handwritten Caveat display type, JetBrains Mono
 * eyebrows, Newsreader prose and a single electric blue accent.
 */
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
        // Warm paper desk surface
        background: "#f7f5f1",
        foreground: "#1b1b1b",
        paper: {
          DEFAULT: "#ffffff",
          warm: "#fcfaf6",
          sunk: "#f2f0ec",
        },
        border: {
          DEFAULT: "#e0ddda",
          strong: "#dad7d3",
        },
        muted: {
          DEFAULT: "#edebe7",
          foreground: "#575552",
        },
        secondary: "#eeebe5",
        steel: "#393e42",
        destructive: "#c9302d",

        // Signature electric cobalt, used sparingly
        electric: {
          DEFAULT: "#1677ff",
          hover: "#0958d9",
          light: "#e6f4ff",
          glow: "rgba(22, 119, 255, 0.25)",
        },

        // Physical desk objects
        sticky: {
          yellow: "#ffefb1",
          blue: "#cfe8fe",
          mint: "#d3edd7",
          pink: "#fedbda",
          beige: "#ecdbc5",
        },
        tape: "#d5cdc0",

        // Whiteboard ink palette (shared with the SVG renderer)
        board: {
          canvas: "#ffffff",
          grid: "rgba(27, 27, 27, 0.05)",
          ink: "#1b1b1b",
          blue: "#1677ff",
          cyan: "#0284c7",
          emerald: "#059669",
          amber: "#d97706",
          rose: "#dc2626",
          violet: "#7c3aed",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        serif: ["Newsreader", "Georgia", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["Caveat", "Kalam", "cursive"],
        handwritten: ["Caveat", "Kalam", "cursive"],
      },
      letterSpacing: {
        eyebrow: "0.22em",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        card: "0.75rem",
      },
      boxShadow: {
        paper: "0 1px 2px rgba(60,52,40,0.06), 0 6px 16px -4px rgba(60,52,40,0.10)",
        lift: "0 2px 4px rgba(60,52,40,0.08), 0 14px 28px -6px rgba(60,52,40,0.16)",
        sticky: "0 1px 1px rgba(60,52,40,0.08), 0 8px 14px -6px rgba(60,52,40,0.22)",
        electric: "0 0 0 1px rgba(22,119,255,0.35), 0 10px 24px -10px rgba(22,119,255,0.40)",
        board: "0 2px 4px rgba(60,52,40,0.08), 0 18px 40px -12px rgba(60,52,40,0.22)",
      },
      animation: {
        "float-gentle": "floatGentle 4s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        "chalk-in": "chalkIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
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
        chalkIn: {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
