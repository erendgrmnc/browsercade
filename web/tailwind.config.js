/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#0d1016",
        panel: "#161b24",
        ink: "#ecedf2",
        muted: "#969eab",
        faint: "#6c7482",
        hairline: "#272d38",
        accent: "#2348ff",
        glow: "#6b8cff",
      },
      fontFamily: {
        sans: ['"Sora"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
        display: ['"Unbounded"', '"Sora"', "ui-sans-serif", "sans-serif"],
      },
      letterSpacing: {
        mono: "0.04em",
      },
    },
  },
  plugins: [],
};
