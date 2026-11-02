import type { Metadata, Viewport } from "next";
import { Fraunces, IM_Fell_English, Inter, Noto_Serif_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, cardUrl, shareTags } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  preload: false,
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  preload: false,
  subsets: ["latin"],
  display: "swap",
});

const devanagari = Noto_Serif_Devanagari({
  variable: "--font-devanagari",
  preload: false,
  subsets: ["devanagari"],
  weight: ["400", "600"],
  display: "swap",
});

// The book's own hand: a rough old printed English, and a Devanagari cut from traditional type.
const fell = IM_Fell_English({
  variable: "--font-fell",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const tiro = Tiro_Devanagari_Hindi({
  variable: "--font-tiro",
  preload: false,
  subsets: ["devanagari"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "The history of India on one map · indianepics", template: "%s · indianepics" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["Indian history", "historical atlas", "map", "timeline", "Itihasa", "Maurya", "Mughal", "British Raj", "freedom struggle", "Republic of India", "open data"],
  authors: [{ name: "Saidev Dhal", url: "https://saidev.codes" }],
  creator: "Saidev Dhal",
  publisher: "Saidev Dhal",
  alternates: { canonical: "/", types: { "text/markdown": "/llms-full.txt", "text/plain": "/llms.txt" } },
  ...shareTags({
    title: "The history of India, on one map",
    description: SITE_DESCRIPTION,
    path: "/",
    image: cardUrl("home"),
    alt: "The history of India, on one map: an open manuscript with an ink drawing of Krishna and Arjuna on the chariot",
  }),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  category: "education",
};

export const viewport: Viewport = { themeColor: "#ebe1cd" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full antialiased font-sans", fraunces.variable, inter.variable, devanagari.variable, fell.variable, tiro.variable)}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LangProvider>{children}</LangProvider>
        <Analytics />
      </body>
    </html>
  );
}
