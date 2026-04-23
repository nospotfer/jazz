import { LanguageProvider } from "@/components/providers/language-provider";
import { GlobalLoadingProvider } from "@/components/providers/global-loading-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ClarityScript } from "@/components/third-parties/clarity-script";
import { GoogleAnalyticsScript } from "@/components/third-parties/google-analytics-script";
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
  title: "La Cultura del Jazz",
  description: "Curso online con Enric Vázquez Ramonich",
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
          </LanguageProvider>
        </ThemeProvider>
        <ClarityScript />
        <GoogleAnalyticsScript />
      </body>
    </html>
  );
}
