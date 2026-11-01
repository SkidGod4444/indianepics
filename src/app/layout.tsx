import type { Metadata } from "next";
import { Fraunces, Inter, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const devanagari = Noto_Serif_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "indianepics · The history of the Indian subcontinent on one map", template: "%s · indianepics" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["Indian history", "historical atlas", "map", "timeline", "Itihasa", "Maurya", "Mughal", "British Raj", "freedom struggle", "Republic of India", "open data"],
  authors: [{ name: "indianepics contributors", url: "https://github.com/SkidGod4444/indianepics" }],
  alternates: { canonical: "/", types: { "text/markdown": "/llms-full.txt", "text/plain": "/llms.txt" } },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_IN", alternateLocale: ["hi_IN"], url: "/", title: "indianepics", description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: "indianepics", description: SITE_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  category: "education",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full antialiased font-sans", fraunces.variable, inter.variable, devanagari.variable)}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LangProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </LangProvider>
      </body>
    </html>
  );
}
