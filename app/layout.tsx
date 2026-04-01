import type { Metadata } from "next";
import { Rajdhani, Share_Tech_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const display = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

const mono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech",
});

export const metadata: Metadata = {
  title: "DS4D · OSINT Threat Pattern Monitor",
  description:
    "Open-source discussion monitoring prototype for installation force protection (demo).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="font-display">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
