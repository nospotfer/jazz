import { LanguageProvider } from "@/components/providers/language-provider";
import { GlobalLoadingProvider } from "@/components/providers/global-loading-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { OpenReplayProvider } from "@/components/analytics/openreplay-provider";
import { GoogleAnalyticsScript } from "@/components/third-parties/google-analytics-script";
import { PrivacyControls } from "@/components/analytics/privacy-controls";
import { PUBLIC_SITE_DESCRIPTION, PUBLIC_SITE_ORIGIN, PUBLIC_SITE_TITLE } from "@/lib/seo";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_ORIGIN),
  title: { default: PUBLIC_SITE_TITLE, template: `%s · ${PUBLIC_SITE_TITLE}` },
  description: PUBLIC_SITE_DESCRIPTION,
  robots: { index: false, follow: false },
  icons: {
    icon: "/images/logo-mark.png",
    shortcut: "/images/logo-mark.png",
    apple: "/images/logo-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${playfairDisplay.variable} ${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <GlobalLoadingProvider>{children}</GlobalLoadingProvider>
            <PrivacyControls />
            <OpenReplayProvider />
            <GoogleAnalyticsScript />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
