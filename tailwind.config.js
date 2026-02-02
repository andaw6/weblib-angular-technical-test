/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "#16141a",
        foreground: "#f0f0f0",
        card: "#1e1b24",
        border: "#2d2a35",
        muted: "#252229",
        "muted-foreground": "#888",
        accent: "#22c55e",
        warning: "#f59e0b",
        destructive: "#ef4444",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    ({ addUtilities }) => {
      const newUtilities = {
        ".stagger-1": { "animation-delay": "0.1s" },
        ".stagger-2": { "animation-delay": "0.2s" },
        ".stagger-3": { "animation-delay": "0.3s" },
        ".stagger-4": { "animation-delay": "0.4s" },
        ".stagger-5": { "animation-delay": "0.5s" },
        ".stagger-6": { "animation-delay": "0.6s" },
      };
      addUtilities(newUtilities);
    },
  ],
};
