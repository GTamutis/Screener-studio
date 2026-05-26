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
        sans: ["var(--font-hypertext)", "Arial", "sans-serif"],
        display: [
          "var(--font-display)",
          "var(--font-hypertext)",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "var(--font-geist-mono)",
          "ui-monospace",
          "monospace",
        ],
      },
      colors: {
        "dos-teal": "hsl(var(--dos-teal))",
        "dos-glow": "hsl(var(--dos-glow))",
        "dos-navy": "hsl(var(--dos-navy))",
        "dos-blue": "hsl(var(--dos-blue))",
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
          "0 1px 0 0 hsl(var(--glass-highlight) / 0.55) inset, 0 24px 48px -24px hsl(215 52% 25% / 0.14), 0 8px 24px -12px hsl(215 45% 20% / 0.1)",
        "glass-sm":
          "0 1px 0 0 hsl(var(--glass-highlight) / 0.45) inset, 0 8px 20px -12px hsl(215 52% 25% / 0.1)",
        "glow-primary":
          "0 10px 36px -12px hsl(var(--brand-from) / 0.35), 0 4px 16px -8px hsl(var(--brand-via) / 0.28)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, hsl(var(--brand-from)) 0%, hsl(var(--brand-via)) 50%, hsl(var(--brand-to)) 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, hsl(var(--brand-from) / 0.1) 0%, hsl(var(--brand-via) / 0.1) 50%, hsl(var(--brand-to) / 0.1) 100%)",
        "mesh-light":
          "radial-gradient(at 12% 14%, hsl(var(--dos-blue) / 0.08) 0px, transparent 52%), radial-gradient(at 88% 18%, hsl(var(--dos-teal) / 0.1) 0px, transparent 50%), radial-gradient(at 48% 88%, hsl(var(--dos-navy) / 0.04) 0px, transparent 48%), radial-gradient(at 6% 82%, hsl(var(--dos-glow) / 0.06) 0px, transparent 45%)",
        "mesh-dark":
          "radial-gradient(at 12% 10%, hsl(var(--dos-navy) / 0.55) 0px, transparent 50%), radial-gradient(at 85% 20%, hsl(var(--dos-blue) / 0.22) 0px, transparent 48%), radial-gradient(at 50% 90%, hsl(var(--dos-teal) / 0.12) 0px, transparent 52%), radial-gradient(at 8% 85%, hsl(var(--dos-glow) / 0.06) 0px, transparent 45%)",
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
