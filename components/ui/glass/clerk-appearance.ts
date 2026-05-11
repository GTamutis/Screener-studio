import type { Appearance } from "@clerk/types";

export const glassClerkAppearance: Appearance = {
  variables: {
    colorPrimary: "hsl(250 84% 60%)",
    colorText: "hsl(222 47% 11%)",
    colorTextSecondary: "hsl(220 9% 46%)",
    colorBackground: "transparent",
    colorInputBackground: "hsl(0 0% 100% / 0.85)",
    colorInputText: "hsl(222 47% 11%)",
    colorNeutral: "hsl(220 14% 96%)",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    card: "glass-surface-strong shadow-glass rounded-3xl border-0 p-8",
    cardBox:
      "glass-surface-strong shadow-glass rounded-3xl border-0 overflow-hidden",
    headerTitle: "text-2xl font-bold tracking-tight text-gradient",
    headerSubtitle: "text-muted-foreground text-sm",
    socialButtonsBlockButton:
      "border border-border bg-card/60 backdrop-blur hover:bg-card transition-colors rounded-lg",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground text-xs uppercase tracking-wide",
    formFieldLabel:
      "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
    formFieldInput:
      "bg-card/80 backdrop-blur border border-input rounded-lg shadow-sm focus:ring-4 focus:ring-primary/15 focus:border-primary/60",
    formButtonPrimary:
      "bg-brand-gradient hover:opacity-95 text-white font-semibold shadow-glow-primary rounded-lg transition-all hover:-translate-y-px",
    footerActionLink:
      "text-primary hover:text-primary/80 font-semibold transition-colors",
    footer: "bg-transparent",
    formFieldAction:
      "text-primary hover:text-primary/80 font-semibold transition-colors",
    identityPreview:
      "glass-surface rounded-lg",
    otpCodeFieldInput:
      "bg-card/80 border border-input rounded-lg",
  },
};
