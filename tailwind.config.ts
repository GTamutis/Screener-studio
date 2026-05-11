import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "3xl": "1.75rem",
      },
      boxShadow: {
        glass:
          "0 1px 0 0 hsl(var(--glass-highlight) / 0.6) inset, 0 20px 60px -20px hsl(220 50% 10% / 0.25), 0 8px 30px -12px hsl(280 60% 30% / 0.18)",
        "glass-sm":
          "0 1px 0 0 hsl(var(--glass-highlight) / 0.5) inset, 0 8px 24px -12px hsl(220 50% 10% / 0.2)",
        "glow-primary":
          "0 10px 40px -10px hsl(var(--brand-from) / 0.55), 0 6px 20px -8px hsl(var(--brand-via) / 0.5)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, hsl(var(--brand-from)) 0%, hsl(var(--brand-via)) 50%, hsl(var(--brand-to)) 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, hsl(var(--brand-from) / 0.15) 0%, hsl(var(--brand-via) / 0.15) 50%, hsl(var(--brand-to) / 0.15) 100%)",
        "mesh-light":
          "radial-gradient(at 12% 10%, hsl(245 90% 78% / 0.55) 0px, transparent 50%), radial-gradient(at 88% 20%, hsl(290 95% 80% / 0.5) 0px, transparent 50%), radial-gradient(at 50% 90%, hsl(200 95% 78% / 0.55) 0px, transparent 50%), radial-gradient(at 90% 95%, hsl(330 90% 82% / 0.45) 0px, transparent 50%), radial-gradient(at 5% 85%, hsl(160 80% 75% / 0.4) 0px, transparent 50%)",
        "mesh-dark":
          "radial-gradient(at 12% 10%, hsl(250 80% 30% / 0.65) 0px, transparent 50%), radial-gradient(at 85% 18%, hsl(285 70% 28% / 0.6) 0px, transparent 50%), radial-gradient(at 50% 90%, hsl(195 70% 22% / 0.7) 0px, transparent 50%), radial-gradient(at 90% 95%, hsl(320 70% 30% / 0.55) 0px, transparent 50%), radial-gradient(at 5% 85%, hsl(165 65% 20% / 0.5) 0px, transparent 50%)",
        "grain":
          "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
      },
      keyframes: {
        "blob-1": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(40px,-30px,0) scale(1.1)" },
          "66%": { transform: "translate3d(-20px,20px,0) scale(0.95)" },
        },
        "blob-2": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(-30px,30px,0) scale(0.95)" },
          "66%": { transform: "translate3d(30px,-20px,0) scale(1.1)" },
        },
        "blob-3": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(25px,25px,0) scale(1.05)" },
          "66%": { transform: "translate3d(-25px,-15px,0) scale(0.95)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "blob-1": "blob-1 22s ease-in-out infinite",
        "blob-2": "blob-2 26s ease-in-out infinite",
        "blob-3": "blob-3 30s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
};
export default config;
