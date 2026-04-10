import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Tiro_Devanagari_Hindi } from "next/font/google";
import { Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";

const tiroDevanagariHindi = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  variable: "--font-tiro-devanagari-hindi",
  weight: "400",
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-noto-serif-devanagari",
  weight: "400",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bihaan Bhojpuri - आधुनिक बिहारी साहित्य के डिजिटल संग्रह",
  description: "Bihaan Bhojpuri - आपका डिजिटल संग्रह आधुनिक बिहारी साहित्य के",
  icons: {
    icon: '/assets/logos/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${tiroDevanagariHindi.variable} ${notoSerifDevanagari.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
