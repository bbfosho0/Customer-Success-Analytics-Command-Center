import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        "input-background": "var(--input-background)",
        "chart-1": "var(--chart-1)",
        "chart-2": "var(--chart-2)",
        "chart-3": "var(--chart-3)",
        "chart-4": "var(--chart-4)",
        "chart-5": "var(--chart-5)",
        surface: "var(--card)",
        "surface-strong": "var(--muted)",
        "accent-strong": "var(--chart-2)",
        success: "#4ade80",
        warning: "#fb923c",
        danger: "#f87171",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 24px -22px rgba(15, 23, 42, 0.9)",
        glow: "0 0 30px -18px rgba(13, 148, 136, 0.6)",
      },
      borderRadius: {
        xl: "1.25rem",
      },
      backgroundImage: {
        "grid-light":
          "linear-gradient(to right, rgba(226,232,240,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(226,232,240,0.35) 1px, transparent 1px)",
        "grid-dark":
          "linear-gradient(to right, rgba(15,23,42,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.35) 1px, transparent 1px)",
      },
      keyframes: {
        pulseFloat: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
          "100%": { transform: "translateY(0px)" },
        },
      },
      animation: {
        pulseFloat: "pulseFloat 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
