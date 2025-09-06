import type { Metadata } from "next";
import { Geist, Geist_Mono, Rubik_Mono_One, Bungee, Oranienbaum, DM_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import ThemeScript from "@/components/ThemeScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rubikMono = Rubik_Mono_One({
  variable: "--font-rubik-mono",
  weight: "400",
  subsets: ["latin"],
});

const bungee = Bungee({
  variable: "--font-bungee",
  weight: "400",
  subsets: ["latin"],
});

const oranienbaum = Oranienbaum({
  variable: "--font-oranienbaum",
  weight: "400",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MAMA - Money Made Fun",
  description: "Your AI financial advisor that turns budgeting into a game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${rubikMono.variable} ${bungee.variable} ${oranienbaum.variable} ${dmMono.variable} antialiased`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
