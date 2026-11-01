import type { Metadata } from "next";
import { Fraunces, Inter, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
  title: "indianepics",
  description:
    "A scroll-driven map of the Indian subcontinent from the Itihasa to today. Two tracks: tradition and evidence. Open data, open source.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full antialiased font-sans", fraunces.variable, inter.variable, devanagari.variable)}>
      <body className="min-h-full flex flex-col">
        <LangProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </LangProvider>
      </body>
    </html>
  );
}
