import "./globals.css";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Date Crew — Matchmaker Workspace",
  description: "Internal matchmaking operations platform for The Date Crew (TDC)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${plusJakartaSans.variable}`}
    >
      <body className="min-h-full bg-[#FAFAFA] text-[#09090B] selection:bg-black selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
