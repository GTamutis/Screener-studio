import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

import { ThemeProvider } from "@/components/ui/glass/theme-provider";
import { ConditionalMesh } from "@/components/layout/conditional-mesh";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Day One Strategy",
    template: "%s · Day One Strategy",
  },
  description:
    "Day One Strategy workspace — project setup, screener workflows, quotas, invitations, and delivery.",
  icons: {
    icon: "/brand/day-one-icon-white.png",
    apple: "/brand/day-one-icon-white.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={
        {
          "--font-hypertext": '"Hypertext", Arial, sans-serif',
          "--font-display": '"Hypertext Display", "Hypertext", Arial, sans-serif',
        } as React.CSSProperties
      }
    >
      <body
        className={`${jetbrainsMono.variable} relative min-h-screen bg-background font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <ConditionalMesh />
          </Suspense>
          <ClerkProvider>
            <TooltipProvider delayDuration={150}>
              <div
                data-app-shell
                className="relative flex min-h-screen flex-col"
              >
                {children}
              </div>
            </TooltipProvider>
            <Toaster />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
